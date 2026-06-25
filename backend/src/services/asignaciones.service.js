import { AsignacionesRepository } from '../repositories/asignaciones.repository.js';
import { EquiposRepository } from '../repositories/equipos.repository.js';
import { ComponentesRepository } from '../repositories/componentes.repository.js';
import { withTransaction, createRequest } from '../config/db.js';

export const AsignacionesService = {
  async list(filtros) {
    return AsignacionesRepository.listAll(filtros);
  },

  async getById(id) {
    return AsignacionesRepository.getById(id);
  },

  async asignar(data) {
    const equipo = await EquiposRepository.getById(data.IdMaeEquipo);
    if (!equipo) throw new Error('Equipo no encontrado');
    if (equipo.Estado !== 'DISPONIBLE') throw new Error('El equipo no está disponible');

    const idAsig = await AsignacionesRepository.asignar(data);
    await EquiposRepository.updateEstado(data.IdMaeEquipo, 'ASIGNADO');
    await EquiposRepository.registrarCambioEstado(data.IdMaeEquipo, equipo.Estado, 'ASIGNADO', data.IdUsuario, 'Equipo asignado');

    if (data.componentes?.length) {
      for (const comp of data.componentes) {
        await ComponentesRepository.asignarAEquipo(data.IdMaeEquipo, comp.IdComponente, comp.Obs);
      }
    }
    return idAsig;
  },

  async cesar(id, idUsuario) {
    const asig = await AsignacionesRepository.getById(id);
    if (!asig) throw new Error('Asignación no encontrada');
    await AsignacionesRepository.cesar(id);
    await EquiposRepository.updateEstado(asig.IdMaeEquipo, 'DISPONIBLE');
    await EquiposRepository.registrarCambioEstado(asig.IdMaeEquipo, 'ASIGNADO', 'DISPONIBLE', idUsuario, 'Asignación finalizada');
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

  async asignarMulti(data, idUsuario) {
    const { IdMaeEquipos, IdReferente, Obs } = data;
    const results = [];
    for (const idEquipo of IdMaeEquipos) {
      try {
        const id = await this.asignar({
          IdMaeEquipo: idEquipo,
          IdReferente,
          Obs,
          IdUsuario: idUsuario,
        });
        results.push({ idEquipo, success: true, idAsig: id });
      } catch (e) {
        results.push({ idEquipo, success: false, error: e.message });
      }
    }
    return results;
  },

  async asignarConAccesorios(data) {
    const { IdMaeEquipo, IdReferente, Obs, Accesorios, IdUsuario } = data;

    const equipo = await EquiposRepository.getById(IdMaeEquipo);
    if (!equipo) throw new Error('Equipo no encontrado');
    if (equipo.Estado !== 'DISPONIBLE') throw new Error('El equipo no está disponible');

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

    const DB = 'InventarioGP';
    const fec = new Date().toISOString().split('T')[0];

    return withTransaction(DB, async (trx) => {
      const req = (sql, params) => createRequest(trx, params).query(sql);

      const [asigResult] = await req(`
        INSERT INTO Tab_EQ_MovEquiposAsignaciones (IdMaeEquipo, IdReferente, FecAsignacion, Obs, Estado)
        OUTPUT INSERTED.IdMovEquipoAsignacion
        VALUES (@idEquipo, @idTrabajador, @fec, @obs, 'VIGENTE')
      `, { idEquipo: IdMaeEquipo, idTrabajador: IdReferente, fec, obs: Obs || null });
      const idAsig = asigResult.IdMovEquipoAsignacion;

      await req(`UPDATE Tab_EQ_MaeEquipos SET Estado = 'ASIGNADO' WHERE IdMaeEquipo = @id`, { id: IdMaeEquipo });

      await req(`
        INSERT INTO Tab_EQ_MovEstadosEquipos (IdMaeEquipo, EstadoAnterior, EstadoNuevo, IdUsuario, Obs)
        VALUES (@idEquipo, @estadoAnt, 'ASIGNADO', @idUsuario, 'Equipo asignado con accesorios')
      `, { idEquipo: IdMaeEquipo, estadoAnt: equipo.Estado, idUsuario: IdUsuario || null });

      for (const acc of accsValidos) {
        await req(`
          INSERT INTO Tab_EQ_MovAccesoriosTrabajador (IdComponente, IdReferente, FecAsignacion, Obs, Estado, IdUsuarioCrea)
          VALUES (@idComponente, @idTrabajador, @fec, @obs, 'VIGENTE', @idUsuario)
        `, { idComponente: acc.IdComponente, idTrabajador: IdReferente, fec, obs: acc.Obs || null, idUsuario: IdUsuario || null });

        await req(`UPDATE Tab_EQ_Componentes SET Estado = 'ASIGNADO' WHERE IdComponente = @id`, { id: acc.IdComponente });
      }

      return { idAsig, equipo: IdMaeEquipo, accesorios: accsValidos.length };
    });
  },

  async cesarActivasByTrabajador(idTrabajador, idUsuario) {
    const activas = await AsignacionesRepository.getActivasByTrabajador(idTrabajador);
    for (const asig of activas) {
      await AsignacionesRepository.cesar(asig.IdMovEquipoAsignacion);
      await EquiposRepository.updateEstado(asig.IdMaeEquipo, 'DISPONIBLE');
      await EquiposRepository.registrarCambioEstado(asig.IdMaeEquipo, 'ASIGNADO', 'DISPONIBLE', idUsuario, 'Asignación finalizada (desasignación masiva)');
    }
    // También cesar accesorios activos del trabajador
    const accs = await ComponentesRepository.listAccesoriosPorTrabajador(idTrabajador);
    for (const acc of accs) {
      await ComponentesRepository.cesarAccesorioATrabajador(acc.IdMovAccesorio);
    }
    return { count: activas.length, accesoriosCesados: accs.length };
  },
};
