import { AsignacionesRepository } from '../repositories/asignaciones.repository.js';
import { EquiposRepository } from '../repositories/equipos.repository.js';
import { ComponentesRepository } from '../repositories/componentes.repository.js';
import { TrabajadoresRepository } from '../repositories/trabajadores.repository.js';
import { withTransaction, createRequest } from '../config/db.js';

const DB = 'InventarioGP';
const fec = () => new Date().toISOString().split('T')[0];

async function validarTrabajador(idReferente) {
  const t = await TrabajadoresRepository.getById(idReferente);
  if (!t) throw new Error('Trabajador no encontrado');
  if (String(t.Activo) !== '1') throw new Error('El trabajador no está activo');
  return t;
}

async function validarEquipoDisponible(idEquipo) {
  const equipo = await EquiposRepository.getById(idEquipo);
  if (!equipo) throw new Error('Equipo no encontrado');
  if (equipo.Estado !== 'DISPONIBLE') throw new Error(`El equipo ${equipo.CodEquipo} no está disponible`);
  return equipo;
}

export const AsignacionesService = {
  async list(filtros) {
    return AsignacionesRepository.listAll(filtros);
  },

  async getById(id) {
    return AsignacionesRepository.getById(id);
  },

  async asignar(data) {
    const equipo = await validarEquipoDisponible(data.IdMaeEquipo);
    await validarTrabajador(data.IdReferente);

    return withTransaction(DB, async (trx) => {
      const req = (sql, p) => createRequest(trx, p).query(sql);

      const [asig] = await req(`
        INSERT INTO Tab_EQ_MovEquiposAsignaciones (IdMaeEquipo, IdReferente, FecAsignacion, Obs, Estado)
        OUTPUT INSERTED.IdMovEquipoAsignacion
        VALUES (@idEquipo, @idTrabajador, @fec, @obs, 'VIGENTE')
      `, { idEquipo: data.IdMaeEquipo, idTrabajador: data.IdReferente, fec: fec(), obs: data.Obs || null });
      const idAsig = asig.IdMovEquipoAsignacion;

      await req(`UPDATE Tab_EQ_MaeEquipos SET Estado = 'ASIGNADO' WHERE IdMaeEquipo = @id`, { id: data.IdMaeEquipo });

      await req(`
        INSERT INTO Tab_EQ_MovEstadosEquipos (IdMaeEquipo, EstadoAnterior, EstadoNuevo, IdUsuario, Obs)
        VALUES (@idEquipo, @estadoAnt, 'ASIGNADO', @idUsuario, 'Equipo asignado')
      `, { idEquipo: data.IdMaeEquipo, estadoAnt: equipo.Estado, idUsuario: data.IdUsuario || null });

      if (data.componentes?.length) {
        for (const comp of data.componentes) {
          await req(`
            INSERT INTO Tab_EQ_MovEquiposComponentes (IdMaeEquipo, IdComponente, Obs, Estado)
            VALUES (@idEquipo, @idComponente, @obs, 'VIGENTE')
          `, { idEquipo: data.IdMaeEquipo, idComponente: comp.IdComponente, obs: comp.Obs || null });
          await req(`UPDATE Tab_EQ_Componentes SET Estado = 'ASIGNADO' WHERE IdComponente = @id`, { id: comp.IdComponente });
        }
      }

      return idAsig;
    });
  },

  async cesar(id, idUsuario) {
    const asig = await AsignacionesRepository.getById(id);
    if (!asig) throw new Error('Asignación no encontrada');

    return withTransaction(DB, async (trx) => {
      const req = (sql, p) => createRequest(trx, p).query(sql);

      await req(`UPDATE Tab_EQ_MovEquiposAsignaciones SET Estado = 'CESADO', FecCese = GETDATE() WHERE IdMovEquipoAsignacion = @id`, { id });
      await req(`UPDATE Tab_EQ_MaeEquipos SET Estado = 'DISPONIBLE' WHERE IdMaeEquipo = @id`, { id: asig.IdMaeEquipo });
      await req(`
        INSERT INTO Tab_EQ_MovEstadosEquipos (IdMaeEquipo, EstadoAnterior, EstadoNuevo, IdUsuario, Obs)
        VALUES (@idEquipo, 'ASIGNADO', 'DISPONIBLE', @idUsuario, 'Asignación finalizada')
      `, { idEquipo: asig.IdMaeEquipo, idUsuario: idUsuario || null });
    });
  },

  async asignarMulti(data, idUsuario) {
    const { IdMaeEquipos, IdReferente, Obs } = data;
    if (!IdMaeEquipos?.length) throw new Error('No se especificaron equipos');

    // Validar trabajador una vez
    await validarTrabajador(IdReferente);

    // Validar todos los equipos antes de la transacción
    for (const idEquipo of IdMaeEquipos) {
      await validarEquipoDisponible(idEquipo);
    }

    return withTransaction(DB, async (trx) => {
      const req = (sql, p) => createRequest(trx, p).query(sql);
      const results = [];

      for (const idEquipo of IdMaeEquipos) {
        const [asig] = await req(`
          INSERT INTO Tab_EQ_MovEquiposAsignaciones (IdMaeEquipo, IdReferente, FecAsignacion, Obs, Estado)
          OUTPUT INSERTED.IdMovEquipoAsignacion
          VALUES (@idEquipo, @idTrabajador, @fec, @obs, 'VIGENTE')
        `, { idEquipo, idTrabajador: IdReferente, fec: fec(), obs: Obs || null });
        const idAsig = asig.IdMovEquipoAsignacion;

        await req(`UPDATE Tab_EQ_MaeEquipos SET Estado = 'ASIGNADO' WHERE IdMaeEquipo = @id`, { id: idEquipo });
        await req(`
          INSERT INTO Tab_EQ_MovEstadosEquipos (IdMaeEquipo, EstadoAnterior, EstadoNuevo, IdUsuario, Obs)
          VALUES (@idEquipo, 'DISPONIBLE', 'ASIGNADO', @idUsuario, 'Asignación múltiple')
        `, { idEquipo, idUsuario: idUsuario || null });

        results.push({ idEquipo, idAsig, success: true });
      }

      return results;
    });
  },

  async asignarConAccesorios(data) {
    const { IdMaeEquipo, IdReferente, Obs, Accesorios, IdUsuario } = data;

    const equipo = await validarEquipoDisponible(IdMaeEquipo);
    const trabajador = await validarTrabajador(IdReferente);

    const accsValidos = [];
    if (Accesorios?.length) {
      for (const acc of Accesorios) {
        const c = await ComponentesRepository.getById(acc.IdComponente);
        if (!c) throw new Error(`Componente ID ${acc.IdComponente} no encontrado`);
        if (c.Estado !== 'DISPONIBLE') throw new Error(`Componente ${c.CodComponente} no está disponible`);
        if (accsValidos.some(a => a.IdComponente === acc.IdComponente)) {
          throw new Error(`Componente duplicado: ${c.CodComponente}`);
        }
        accsValidos.push(acc);
      }
    }

    return withTransaction(DB, async (trx) => {
      const req = (sql, p) => createRequest(trx, p).query(sql);

      const [asigResult] = await req(`
        INSERT INTO Tab_EQ_MovEquiposAsignaciones (IdMaeEquipo, IdReferente, FecAsignacion, Obs, Estado)
        OUTPUT INSERTED.IdMovEquipoAsignacion
        VALUES (@idEquipo, @idTrabajador, @fec, @obs, 'VIGENTE')
      `, { idEquipo: IdMaeEquipo, idTrabajador: IdReferente, fec: fec(), obs: Obs || null });
      const idAsig = asigResult.IdMovEquipoAsignacion;

      await req(`UPDATE Tab_EQ_MaeEquipos SET Estado = 'ASIGNADO' WHERE IdMaeEquipo = @id`, { id: IdMaeEquipo });

      await req(`
        INSERT INTO Tab_EQ_MovEstadosEquipos (IdMaeEquipo, EstadoAnterior, EstadoNuevo, IdUsuario, Obs)
        VALUES (@idEquipo, @estadoAnt, 'ASIGNADO', @idUsuario, 'Equipo asignado con accesorios')
      `, { idEquipo: IdMaeEquipo, estadoAnt: equipo.Estado, idUsuario: IdUsuario || null });

      for (const acc of accsValidos) {
        await req(`
          INSERT INTO Tab_EQ_MovAccesoriosTrabajador
            (IdComponente, IdReferente, FecAsignacion, Obs, Estado, IdUsuarioCrea, IdMovEquipoAsignacion)
          VALUES (@idComponente, @idTrabajador, @fec, @obs, 'VIGENTE', @idUsuario, @idAsig)
        `, {
          idComponente: acc.IdComponente,
          idTrabajador: IdReferente,
          fec: fec(),
          obs: acc.Obs || null,
          idUsuario: IdUsuario || null,
          idAsig,
        });

        await req(`UPDATE Tab_EQ_Componentes SET Estado = 'ASIGNADO' WHERE IdComponente = @id`, { id: acc.IdComponente });
      }

      return { idAsig, equipo: IdMaeEquipo, accesorios: accsValidos.length };
    });
  },

  async cesarActivasByTrabajador(idTrabajador, idUsuario) {
    const activas = await AsignacionesRepository.getActivasByTrabajador(idTrabajador);
    if (!activas.length) return { count: 0, accesoriosCesados: 0 };

    const accs = await ComponentesRepository.listAccesoriosPorTrabajador(idTrabajador);

    return withTransaction(DB, async (trx) => {
      const req = (sql, p) => createRequest(trx, p).query(sql);

      for (const asig of activas) {
        await req(`UPDATE Tab_EQ_MovEquiposAsignaciones SET Estado = 'CESADO', FecCese = GETDATE() WHERE IdMovEquipoAsignacion = @id`, { id: asig.IdMovEquipoAsignacion });
        await req(`UPDATE Tab_EQ_MaeEquipos SET Estado = 'DISPONIBLE' WHERE IdMaeEquipo = @id`, { id: asig.IdMaeEquipo });
        await req(`
          INSERT INTO Tab_EQ_MovEstadosEquipos (IdMaeEquipo, EstadoAnterior, EstadoNuevo, IdUsuario, Obs)
          VALUES (@idEquipo, 'ASIGNADO', 'DISPONIBLE', @idUsuario, 'Asignación finalizada (desasignación masiva)')
        `, { idEquipo: asig.IdMaeEquipo, idUsuario: idUsuario || null });
      }

      for (const acc of accs) {
        await req(`UPDATE Tab_EQ_MovAccesoriosTrabajador SET Estado = 'CESADO', FecCese = GETDATE() WHERE IdMovAccesorio = @id`, { id: acc.IdMovAccesorio });
        await req(`UPDATE Tab_EQ_Componentes SET Estado = 'DISPONIBLE' WHERE IdComponente = @id`, { id: acc.IdComponente });
      }

      return { count: activas.length, accesoriosCesados: accs.length };
    });
  },

  async getActa(id) {
    const asig = await AsignacionesRepository.getById(id);
    if (!asig) return null;

    const accs = await ComponentesRepository.listAccesoriosPorTrabajador(asig.IdReferente);

    const fec = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });

    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Acta de Entrega - ${asig.CodEquipo}</title>
<style>
  body { font-family: 'Inter', Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #1a1a1a; }
  h1 { text-align: center; font-size: 20px; margin-bottom: 4px; }
  .subtitle { text-align: center; color: #666; font-size: 13px; margin-bottom: 30px; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; font-size: 13px; }
  th { background: #f5f5f5; font-weight: 600; }
  .firmas { display: flex; justify-content: space-between; margin-top: 60px; }
  .firma { text-align: center; width: 45%; }
  .linea { border-top: 1px solid #333; padding-top: 8px; font-size: 12px; margin-top: 40px; }
  .obs { margin-top: 20px; font-size: 13px; }
  .obs strong { display: block; margin-bottom: 4px; }
</style>
</head>
<body>
  <h1>ACTA DE ENTREGA DE EQUIPO</h1>
  <p class="subtitle">Fecha: ${fec} — Código: ACT-${String(asig.IdMovEquipoAsignacion).padStart(6, '0')}</p>

  <table>
    <tr><th colspan="2">Datos del Trabajador</th></tr>
    <tr><td style="width:30%">Nombre</td><td>${asig.TrabajadorNombre || '—'}</td></tr>
    <tr><td>DNI</td><td>${asig.DOI || '—'}</td></tr>
    <tr><td>Área</td><td>${asig.Area || '—'}</td></tr>
  </table>

  <table>
    <tr><th colspan="3">Equipo Entregado</th></tr>
    <tr><th>Código</th><th>Tipo</th><th>Detalle</th></tr>
    <tr><td>${asig.CodEquipo}</td><td>${asig.DesTipodeEquipo || '—'}</td><td>${asig.CodBarra ? `Código barra: ${asig.CodBarra}` : ''}</td></tr>
  </table>

  ${accs.length ? `
  <table>
    <tr><th colspan="3">Accesorios Entregados</th></tr>
    <tr><th>Código</th><th>Tipo</th><th>Descripción</th></tr>
    ${accs.map(a => `<tr><td>${a.CodComponente}</td><td>${a.DesTipodeComponente || '—'}</td><td>${a.DesComponente || '—'}${a.Marca ? ` / ${a.Marca}` : ''}</td></tr>`).join('')}
  </table>` : ''}

  ${asig.Obs ? `<div class="obs"><strong>Observaciones:</strong><p>${asig.Obs}</p></div>` : ''}

  <div class="firmas">
    <div class="firma">
      <div class="linea">ENTREGÓ</div>
    </div>
    <div class="firma">
      <div class="linea">RECIBIÓ</div>
    </div>
  </div>

  <p style="text-align:center;font-size:11px;color:#999;margin-top:40px;">
    Documento generado por InventarioGP — ${fec}
  </p>
</body>
</html>`;
  },
};
