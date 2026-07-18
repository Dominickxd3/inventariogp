import { AsignacionesRepository } from '../repositories/asignaciones.repository.js';
import { EquiposRepository } from '../repositories/equipos.repository.js';
import { ComponentesRepository } from '../repositories/componentes.repository.js';
import { TrabajadoresRepository } from '../repositories/trabajadores.repository.js';
import { IncidenciasRepository } from '../repositories/incidencias.repository.js';
import { withTransaction, createRequest, query } from '../config/db.js';

const DB = 'InventarioGP';
const fec = () => new Date().toISOString().split('T')[0];

// Helpers transaccionales seguros para mssql
const trxRows = async (trx, sqlText, params = {}) => {
  const result = await createRequest(trx, params).query(sqlText);
  return result.recordset || [];
};

const trxExec = async (trx, sqlText, params = {}) => {
  await createRequest(trx, params).query(sqlText);
};



async function validarTrabajador(idReferente) {
  const t = await TrabajadoresRepository.getById(idReferente);
  if (!t) throw new Error('Trabajador no encontrado');
  if (String(t.Activo) !== '1') throw new Error('El trabajador no está activo');
  return t;
}

async function validarEquipoDisponible(idEquipo) {
  const equipo = await EquiposRepository.getById(idEquipo);
  if (!equipo) throw new Error('Equipo no encontrado');
  if (equipo.Estado !== 'DISPONIBLE') {
    const msgs = {
      BAJA: 'está dado de baja',
      MANTENIMIENTO: 'está en mantenimiento',
      INCIDENCIA: 'tiene una incidencia abierta',
      ASIGNADO: 'ya está asignado',
    };
    throw new Error(`El equipo ${equipo.CodEquipo} ${msgs[equipo.Estado] || `no está disponible (estado: ${equipo.Estado})`}`);
  }
  const incidencias = await IncidenciasRepository.getByEquipo(idEquipo);
  if (incidencias.some(i => i.Estado === 'ABIERTO')) {
    throw new Error(`El equipo ${equipo.CodEquipo} está disponible pero tiene una incidencia abierta`);
  }
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
    // Normalize field names: Zod schema uses IdEquipo/IdTrabajador, service uses IdMaeEquipo/IdReferente
    const idEquipo = data.IdMaeEquipo ?? data.IdEquipo;
    const idTrabajador = data.IdReferente ?? data.IdTrabajador;
    if (!idEquipo) throw new Error('El equipo es obligatorio');
    if (!idTrabajador) throw new Error('El trabajador es obligatorio');

    const equipo = await validarEquipoDisponible(idEquipo);
    await validarTrabajador(idTrabajador);

    return withTransaction(DB, async (trx) => {
      const rows = await trxRows(trx, `
        INSERT INTO Tab_EQ_MovEquiposAsignaciones (IdMaeEquipo, IdReferente, FecAsignacion, Obs, Estado)
        OUTPUT INSERTED.IdMovEquipoAsignacion
        VALUES (@idEquipo, @idTrabajador, @fec, @obs, 'VIGENTE')
      `, { idEquipo, idTrabajador, fec: fec(), obs: data.Obs || null });
      const idAsig = rows[0].IdMovEquipoAsignacion;

      await trxExec(trx, `UPDATE Tab_EQ_MaeEquipos SET Estado = 'ASIGNADO' WHERE IdMaeEquipo = @id`, { id: idEquipo });

      await trxExec(trx, `
        INSERT INTO Tab_EQ_MovEstadosEquipos (IdMaeEquipo, EstadoAnterior, EstadoNuevo, IdUsuario, Obs)
        VALUES (@idEquipo, @estadoAnt, 'ASIGNADO', @idUsuario, 'Equipo asignado')
      `, { idEquipo, estadoAnt: equipo.Estado, idUsuario: data.IdUsuario || null });

      if (data.componentes?.length) {
        for (const comp of data.componentes) {
          await trxExec(trx, `
            INSERT INTO Tab_EQ_MovEquiposComponentes (IdMaeEquipo, IdComponente, Obs, Estado)
            VALUES (@idEquipo, @idComponente, @obs, 'VIGENTE')
          `, { idEquipo, idComponente: comp.IdComponente, obs: comp.Obs || null });
          await trxExec(trx, `UPDATE Tab_EQ_Componentes SET Estado = 'ASIGNADO' WHERE IdComponente = @id`, { id: comp.IdComponente });
        }
      }

      return idAsig;
    });
  },

  async getAccsByAsignacion(id) {
    return query(DB, `
      SELECT m.*, c.CodComponente, c.DesComponente, c.Marca, c.Modelo,
             tc.DesTipodeComponente
      FROM Tab_EQ_MovAccesoriosTrabajador m
      JOIN Tab_EQ_Componentes c ON m.IdComponente = c.IdComponente
      LEFT JOIN Tab_EQ_TipodeComponentes tc ON c.IdTipodeComponente = tc.IdTipodeComponente
      WHERE m.IdMovEquipoAsignacion = @id
      ORDER BY m.FecAsignacion DESC
    `, { id });
  },

  async cesar(id, idUsuario, accesorios, data) {
    const asig = await AsignacionesRepository.getById(id);
    if (!asig) throw new Error('Asignación no encontrada');
    if (asig.Estado !== 'VIGENTE') throw new Error('La asignación ya fue cesada o no está vigente');

    const motivo = (data?.Motivo || '').trim();
    const obsTexto = (data?.Obs || '').trim();
    const obsCombinada = [motivo, obsTexto].filter(Boolean).join(' — ');

    const estadoMap = {
      DEVOLUCION: 'DISPONIBLE',
      DISPONIBLE: 'DISPONIBLE',
      RENUNCIA: 'DISPONIBLE',
      CAMBIO: 'DISPONIBLE',
      TRASLADO: 'DISPONIBLE',
      DAÑADO: 'MANTENIMIENTO',
      DAÑO: 'MANTENIMIENTO',
      ROTO: 'MANTENIMIENTO',
      MANTENIMIENTO: 'MANTENIMIENTO',
      PERDIDO: 'BAJA',
      PERDIDA: 'BAJA',
      ROBADO: 'BAJA',
      ROBO: 'BAJA',
      EXTRAVIADO: 'BAJA',
      BAJA: 'BAJA',
    };

    const palabra = Object.keys(estadoMap).find(k =>
      motivo.toUpperCase().includes(k)
    );
    const estadoNuevo = estadoMap[palabra] || 'DISPONIBLE';

    return withTransaction(DB, async (trx) => {
      await trxExec(trx, `
        UPDATE Tab_EQ_MovEquiposAsignaciones
        SET Estado = 'CESADO', FecCese = GETDATE(), Obs = @obs
        WHERE IdMovEquipoAsignacion = @id
      `, { id, obs: obsCombinada || null });
      await trxExec(trx, `UPDATE Tab_EQ_MaeEquipos SET Estado = @estado WHERE IdMaeEquipo = @id`, { estado: estadoNuevo, id: asig.IdMaeEquipo });
      await trxExec(trx, `
        INSERT INTO Tab_EQ_MovEstadosEquipos (IdMaeEquipo, EstadoAnterior, EstadoNuevo, IdUsuario, Obs)
        VALUES (@idEquipo, 'ASIGNADO', @estadoNuevo, @idUsuario, @obs)
      `, { idEquipo: asig.IdMaeEquipo, estadoNuevo, idUsuario: idUsuario || null, obs: obsCombinada || 'Asignación finalizada' });

      if (accesorios?.length) {
        for (const acc of accesorios) {
          const { idMovAccesorio, accion } = acc;
          if (accion === 'MANTENER') continue;

          if (accion === 'DISPONIBLE') {
            await trxExec(trx, `UPDATE Tab_EQ_MovAccesoriosTrabajador SET Estado = 'CESADO', FecCese = GETDATE() WHERE IdMovAccesorio = @id`, { id: idMovAccesorio });
            const compRows = await trxRows(trx, `SELECT IdComponente FROM Tab_EQ_MovAccesoriosTrabajador WHERE IdMovAccesorio = @id`, { id: idMovAccesorio });
            if (compRows[0]) {
              await trxExec(trx, `UPDATE Tab_EQ_Componentes SET Estado = 'DISPONIBLE' WHERE IdComponente = @id`, { id: compRows[0].IdComponente });
            }
          } else if (accion === 'BAJA' || accion === 'PERDIDO') {
            await trxExec(trx, `UPDATE Tab_EQ_MovAccesoriosTrabajador SET Estado = '${accion}', FecCese = GETDATE() WHERE IdMovAccesorio = @id`, { id: idMovAccesorio });
            const compRows = await trxRows(trx, `SELECT IdComponente FROM Tab_EQ_MovAccesoriosTrabajador WHERE IdMovAccesorio = @id`, { id: idMovAccesorio });
            if (compRows[0]) {
              await trxExec(trx, `UPDATE Tab_EQ_Componentes SET Estado = 'BAJA' WHERE IdComponente = @id`, { id: compRows[0].IdComponente });
            }
          }
        }
      }
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
      const results = [];

      for (const idEquipo of IdMaeEquipos) {
        const rows = await trxRows(trx, `
          INSERT INTO Tab_EQ_MovEquiposAsignaciones (IdMaeEquipo, IdReferente, FecAsignacion, Obs, Estado)
          OUTPUT INSERTED.IdMovEquipoAsignacion
          VALUES (@idEquipo, @idTrabajador, @fec, @obs, 'VIGENTE')
        `, { idEquipo, idTrabajador: IdReferente, fec: fec(), obs: Obs || null });
        const idAsig = rows[0].IdMovEquipoAsignacion;

        await trxExec(trx, `UPDATE Tab_EQ_MaeEquipos SET Estado = 'ASIGNADO' WHERE IdMaeEquipo = @id`, { id: idEquipo });
        await trxExec(trx, `
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

        const tipo = await ComponentesRepository.getTipoById(c.IdTipodeComponente);
        if (tipo?.Categoria !== 'ACCESORIO') {
          throw new Error(
            `El componente ${c.CodComponente} (${c.DesTipodeComponente}) no puede asignarse como accesorio al trabajador. Debe instalarse en un equipo mediante una intervención técnica.`
          );
        }

        accsValidos.push(acc);
      }
    }

    return withTransaction(DB, async (trx) => {
      const rows = await trxRows(trx, `
        INSERT INTO Tab_EQ_MovEquiposAsignaciones (IdMaeEquipo, IdReferente, FecAsignacion, Obs, Estado)
        OUTPUT INSERTED.IdMovEquipoAsignacion
        VALUES (@idEquipo, @idTrabajador, @fec, @obs, 'VIGENTE')
      `, { idEquipo: IdMaeEquipo, idTrabajador: IdReferente, fec: fec(), obs: Obs || null });
      const idAsig = rows[0].IdMovEquipoAsignacion;

      await trxExec(trx, `UPDATE Tab_EQ_MaeEquipos SET Estado = 'ASIGNADO' WHERE IdMaeEquipo = @id`, { id: IdMaeEquipo });

      await trxExec(trx, `
        INSERT INTO Tab_EQ_MovEstadosEquipos (IdMaeEquipo, EstadoAnterior, EstadoNuevo, IdUsuario, Obs)
        VALUES (@idEquipo, @estadoAnt, 'ASIGNADO', @idUsuario, 'Equipo asignado con accesorios')
      `, { idEquipo: IdMaeEquipo, estadoAnt: equipo.Estado, idUsuario: IdUsuario || null });

      for (const acc of accsValidos) {
        await trxExec(trx, `
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

        await trxExec(trx, `UPDATE Tab_EQ_Componentes SET Estado = 'ASIGNADO' WHERE IdComponente = @id`, { id: acc.IdComponente });
      }

      return { idAsig, equipo: IdMaeEquipo, accesorios: accsValidos.length };
    });
  },

  async cesarActivasByTrabajador(idTrabajador, idUsuario) {
    const activas = await AsignacionesRepository.getActivasByTrabajador(idTrabajador);
    if (!activas.length) return { count: 0, accesoriosCesados: 0 };

    const accs = await ComponentesRepository.listAccesoriosPorTrabajador(idTrabajador);

    return withTransaction(DB, async (trx) => {
      for (const asig of activas) {
        await trxExec(trx, `UPDATE Tab_EQ_MovEquiposAsignaciones SET Estado = 'CESADO', FecCese = GETDATE() WHERE IdMovEquipoAsignacion = @id`, { id: asig.IdMovEquipoAsignacion });
        await trxExec(trx, `UPDATE Tab_EQ_MaeEquipos SET Estado = 'DISPONIBLE' WHERE IdMaeEquipo = @id`, { id: asig.IdMaeEquipo });
        await trxExec(trx, `
          INSERT INTO Tab_EQ_MovEstadosEquipos (IdMaeEquipo, EstadoAnterior, EstadoNuevo, IdUsuario, Obs)
          VALUES (@idEquipo, 'ASIGNADO', 'DISPONIBLE', @idUsuario, 'Asignación finalizada (desasignación masiva)')
        `, { idEquipo: asig.IdMaeEquipo, idUsuario: idUsuario || null });
      }

      for (const acc of accs) {
        await trxExec(trx, `UPDATE Tab_EQ_MovAccesoriosTrabajador SET Estado = 'CESADO', FecCese = GETDATE() WHERE IdMovAccesorio = @id`, { id: acc.IdMovAccesorio });
        await trxExec(trx, `UPDATE Tab_EQ_Componentes SET Estado = 'DISPONIBLE' WHERE IdComponente = @id`, { id: acc.IdComponente });
      }

      return { count: activas.length, accesoriosCesados: accs.length };
    });
  },

  async getHistorialByEquipo(idEquipo) {
    return AsignacionesRepository.getHistorialByEquipo(idEquipo);
  },

  async getHistorialByTrabajador(idTrabajador) {
    return AsignacionesRepository.getHistorialByTrabajador(idTrabajador);
  },

  async getActivasByTrabajador(idTrabajador) {
    return AsignacionesRepository.getActivasByTrabajador(idTrabajador);
  },

  async getDetalle(id) {
    if (!id || isNaN(id)) throw new Error('ID de asignación no válido');

    const asig = await AsignacionesRepository.getDetalleById(id);
    if (!asig) throw new Error('Asignación no encontrada');

    const accs = await this.getAccsByAsignacion(id);

    const timeline = [];

    timeline.push({
      fecha: asig.FecAsignacion,
      tipo: 'ASIGNACION_CREADA',
      titulo: 'Asignación creada',
      descripcion: `Equipo ${asig.CodEquipo} asignado a ${asig.NombreTrabajador || 'trabajador'}`,
    });

    if (accs.length) {
      timeline.push({
        fecha: accs[0].FecAsignacion || asig.FecAsignacion,
        tipo: 'ACCESORIO_ENTREGADO',
        titulo: `Accesorio${accs.length > 1 ? 's' : ''} entregado${accs.length > 1 ? 's' : ''}`,
        descripcion: accs.map(a => `${a.CodComponente} ${a.DesComponente || a.DesTipodeComponente}`).join(', '),
      });
    }

    if (asig.Estado === 'CESADO' || asig.FecCese) {
      timeline.push({
        fecha: asig.FecCese || asig.FecAsignacion,
        tipo: 'ASIGNACION_CESADA',
        titulo: 'Asignación cesada',
        descripcion: 'Asignación finalizada',
      });
    }

    const trabajador = asig.NombreTrabajador
      ? {
          IdReferente: asig.IdReferente,
          NombreTrabajador: asig.NombreTrabajador,
          DNI: asig.DOI || null,
          Area: asig.Area || null,
          Cargo: asig.Ocupacion || null,
        }
      : {
          IdReferente: asig.IdReferente,
          NombreTrabajador: null,
          DNI: null,
          Area: null,
          Cargo: null,
        };

    return {
      asignacion: {
        IdMovEquipoAsignacion: asig.IdMovEquipoAsignacion,
        Estado: asig.Estado,
        FecAsignacion: asig.FecAsignacion,
        FecCese: asig.FecCese,
        Obs: asig.Obs,
      },
      trabajador,
      equipo: {
        IdMaeEquipo: asig.IdMaeEquipo,
        CodEquipo: asig.CodEquipo,
        TipoEquipo: asig.TipoEquipo,
        CodBarra: asig.CodBarra,
        EstadoActual: asig.EstadoActual,
      },
      accesorios: accs.map(a => ({
        IdComponente: a.IdComponente,
        CodComponente: a.CodComponente,
        TipoComponente: a.DesTipodeComponente,
        DesComponente: a.DesComponente,
        Marca: a.Marca,
        Modelo: a.Modelo,
        Estado: a.Estado,
      })),
      timeline,
    };
  },

  async getActa(id) {
    const asig = await AsignacionesRepository.getById(id);
    if (!asig) return null;

    const accs = await this.getAccsByAsignacion(id);

    const fec = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
    const fecAsig = asig.FecAsignacion
      ? new Date(asig.FecAsignacion).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })
      : '—';

    const accesoriosRowsHtml = accs.length
      ? accs.map(a => `        <tr>
          <td>${a.CodComponente || ''}</td>
          <td>${a.DesTipodeComponente || '—'}</td>
          <td>${a.DesComponente || '—'}</td>
          <td>${a.Marca || '—'}</td>
          <td>${a.Modelo || '—'}</td>
        </tr>
      `).join('')
      : `        <tr>
          <td colspan="5" style="text-align:center;color:#999;">Sin accesorios entregados</td>
        </tr>
      `;

    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Acta de Entrega - ${asig.CodEquipo}</title>
<style>
  * { box-sizing: border-box; }
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
  <p class="subtitle">Código: ACT-${String(asig.IdMovEquipoAsignacion).padStart(6, '0')} — ${fec}</p>

  <table>
    <tr><th colspan="2">Datos del Trabajador</th></tr>
    <tr><td style="width:30%">Nombre</td><td>${asig.TrabajadorNombre || '—'}</td></tr>
    <tr><td>DNI</td><td>${asig.DOI || '—'}</td></tr>
    <tr><td>Área</td><td>${asig.Area || '—'}</td></tr>
    <tr><td>Cargo</td><td>${asig.Ocupacion || '—'}</td></tr>
  </table>

  <table>
    <tr><th colspan="2">Equipo Entregado</th></tr>
    <tr><td style="width:30%">Código</td><td>${asig.CodEquipo}</td></tr>
    <tr><td>Tipo</td><td>${asig.DesTipodeEquipo || '—'}</td></tr>
    <tr><td>Código de barra / Serie</td><td>${asig.CodBarra || '—'}</td></tr>
  </table>

  <table>
    <tr><th colspan="3">Accesorios Entregados</th></tr>
    <tr><th>Código</th><th>Tipo</th><th>Descripción</th><th>Marca</th><th>Modelo</th></tr>
    ${accesoriosRowsHtml}
  </table>

  <table>
    <tr><th colspan="2">Información de la Entrega</th></tr>
    <tr><td style="width:30%">Fecha de asignación</td><td>${fecAsig}</td></tr>
  </table>

  ${asig.Obs ? `<div class="obs"><strong>Observaciones:</strong><p>${asig.Obs}</p></div>` : ''}

  <div class="firmas">
    <div class="firma">
      <div><strong>ENTREGÓ</strong></div>
      <div style="margin-top:4px;font-size:12px;color:#666;">Responsable de TI</div>
      <div class="linea"></div>
    </div>
    <div class="firma">
      <div><strong>RECIBIÓ</strong></div>
      <div style="margin-top:4px;font-size:12px;color:#666;">${asig.TrabajadorNombre || 'Trabajador'}</div>
      <div class="linea"></div>
    </div>
  </div>

  <p style="text-align:center;font-size:11px;color:#999;margin-top:40px;">
    Documento generado por InventarioGP — ${fec}
  </p>
</body>
</html>`;
  },
};
