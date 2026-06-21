import { AsignacionesRepository } from '../repositories/asignaciones.repository.js';
import { EquiposRepository } from '../repositories/equipos.repository.js';
import { ComponentesRepository } from '../repositories/componentes.repository.js';

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

  async cesarActivasByTrabajador(idTrabajador, idUsuario) {
    const activas = await AsignacionesRepository.getActivasByTrabajador(idTrabajador);
    for (const asig of activas) {
      await AsignacionesRepository.cesar(asig.IdMovEquipoAsignacion);
      await EquiposRepository.updateEstado(asig.IdMaeEquipo, 'DISPONIBLE');
      await EquiposRepository.registrarCambioEstado(asig.IdMaeEquipo, 'ASIGNADO', 'DISPONIBLE', idUsuario, 'Asignación finalizada (desasignación masiva)');
    }
    return { count: activas.length };
  },
};
