import { EquiposRepository } from '../repositories/equipos.repository.js';
import { AsignacionesRepository } from '../repositories/asignaciones.repository.js';
import { ComponentesRepository } from '../repositories/componentes.repository.js';
import { IncidenciasRepository } from '../repositories/incidencias.repository.js';
import QRCode from 'qrcode';

export const EquiposService = {
  async list(filtros) {
    return EquiposRepository.listAll(filtros);
  },

  async listAllForExport(filtros) {
    return EquiposRepository.listAll({ ...filtros, page: 1, pageSize: 99999 });
  },

  async getById(id) {
    const equipo = await EquiposRepository.getById(id);
    if (!equipo) return null;
    const asignacion = await AsignacionesRepository.getActivaByEquipo(id);
    const componentes = await ComponentesRepository.getByEquipo(id);
    const historialEstados = await EquiposRepository.getHistorialEstados(id);
    return { ...equipo, asignacion, componentes, historialEstados };
  },

  async getByCodigo(codBarra) {
    const equipo = await EquiposRepository.getByCodigo(codBarra);
    if (!equipo) return null;
    const asignacion = await AsignacionesRepository.getActivaByEquipo(equipo.IdMaeEquipo);
    const componentes = await ComponentesRepository.getByEquipo(equipo.IdMaeEquipo);
    return { ...equipo, asignacion, componentes };
  },

  async create(data) {
    if (!data.CodBarra) {
      data.CodBarra = `QR-${data.CodEquipo}-${Date.now().toString(36).toUpperCase()}`;
    }
    const id = await EquiposRepository.create(data);
    const equipo = await this.getById(id);
    await EquiposRepository.registrarCambioEstado(id, null, 'DISPONIBLE', data.IdUsuario, 'Equipo creado');
    return equipo;
  },

  async update(id, data) {
    const anterior = await EquiposRepository.getById(id);
    await EquiposRepository.update(id, data);
    if (data.Estado && anterior && anterior.Estado !== data.Estado) {
      await EquiposRepository.registrarCambioEstado(id, anterior.Estado, data.Estado, data.IdUsuario);
    }
    return this.getById(id);
  },

  async delete(id) {
    const activa = await AsignacionesRepository.getActivaByEquipo(id);
    if (activa) throw new Error('No se puede eliminar un equipo con asignación activa');
    await EquiposRepository.delete(id);
  },

  async cambiarEstado(id, nuevoEstado, idUsuario, obs) {
    const equipo = await EquiposRepository.getById(id);
    if (!equipo) throw new Error('Equipo no encontrado');
    const estadoAnterior = equipo.Estado;
    await EquiposRepository.updateEstado(id, nuevoEstado);
    await EquiposRepository.registrarCambioEstado(id, estadoAnterior, nuevoEstado, idUsuario, obs);
    return this.getById(id);
  },

  async generarQR(id) {
    const equipo = await EquiposRepository.getById(id);
    if (!equipo) return null;
    const url = `/equipos/scan/${equipo.CodBarra}`;
    const qrDataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 });
    return { qr: qrDataUrl, url, equipo };
  },

  async listTipos() {
    return EquiposRepository.listTipos();
  },

  async createTipo(data) {
    return EquiposRepository.createTipo(data);
  },

  async getHistorialEstados(id) {
    return EquiposRepository.getHistorialEstados(id);
  },

  async dashboard() {
    return EquiposRepository.getDashboardStats();
  },
};
