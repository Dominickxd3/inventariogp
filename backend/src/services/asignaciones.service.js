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

    if (data.componentes?.length) {
      for (const comp of data.componentes) {
        await ComponentesRepository.asignarAEquipo(data.IdMaeEquipo, comp.IdComponente, comp.Obs);
      }
    }
    return idAsig;
  },

  async cesar(id) {
    const asig = await AsignacionesRepository.getById(id);
    if (!asig) throw new Error('Asignación no encontrada');
    await AsignacionesRepository.cesar(id);
    await EquiposRepository.updateEstado(asig.IdMaeEquipo, 'DISPONIBLE');
  },

  async getHistorialByEquipo(idEquipo) {
    return AsignacionesRepository.getHistorialByEquipo(idEquipo);
  },

  async getHistorialByTrabajador(idTrabajador) {
    return AsignacionesRepository.getHistorialByTrabajador(idTrabajador);
  },
};
