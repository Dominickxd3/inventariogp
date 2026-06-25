import { IncidenciasRepository } from '../repositories/incidencias.repository.js';
import { EquiposRepository } from '../repositories/equipos.repository.js';
import { AsignacionesRepository } from '../repositories/asignaciones.repository.js';

export const IncidenciasService = {
  async list(filtros) {
    return IncidenciasRepository.listAll(filtros);
  },

  async getById(id) {
    return IncidenciasRepository.getById(id);
  },

  async getByEquipo(idEquipo) {
    return IncidenciasRepository.getByEquipo(idEquipo);
  },

  async create(data) {
    const equipo = await EquiposRepository.getById(data.IdMaeEquipo);
    if (!equipo) throw new Error('Equipo no encontrado');

    const idIncidencia = await IncidenciasRepository.create(data);
    await EquiposRepository.updateEstado(data.IdMaeEquipo, 'INCIDENCIA');
    await EquiposRepository.registrarCambioEstado(data.IdMaeEquipo, equipo.Estado, 'INCIDENCIA', data.IdUsuario, `Incidencia: ${data.TipoIncidencia}`);
    return idIncidencia;
  },

  async cerrar(id, idUsuario) {
    const incidencia = await IncidenciasRepository.getById(id);
    if (!incidencia) throw new Error('Incidencia no encontrada');

    await IncidenciasRepository.updateEstado(id, 'CERRADO');

    const activa = await AsignacionesRepository.getActivaByEquipo(incidencia.IdMaeEquipo);
    const nuevoEstado = activa ? 'ASIGNADO' : 'DISPONIBLE';

    await EquiposRepository.updateEstado(incidencia.IdMaeEquipo, nuevoEstado);
    await EquiposRepository.registrarCambioEstado(
      incidencia.IdMaeEquipo, 'INCIDENCIA', nuevoEstado, idUsuario,
      `Incidencia cerrada - equipo ${nuevoEstado === 'ASIGNADO' ? 'permanece asignado' : 'disponible'}`
    );
  },
};
