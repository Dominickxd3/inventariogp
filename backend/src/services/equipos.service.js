import { EquiposRepository } from '../repositories/equipos.repository.js';
import { AsignacionesRepository } from '../repositories/asignaciones.repository.js';
import { ComponentesRepository } from '../repositories/componentes.repository.js';
import { IncidenciasRepository } from '../repositories/incidencias.repository.js';
import QRCode from 'qrcode';

export const EquiposService = {
  async list(filtros) {
    return EquiposRepository.listAll(filtros);
  },

  async getById(id) {
    const equipo = await EquiposRepository.getById(id);
    if (!equipo) return null;
    const asignacion = await AsignacionesRepository.getActivaByEquipo(id);
    const componentes = await ComponentesRepository.getByEquipo(id);
    return { ...equipo, asignacion, componentes };
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
    return this.getById(id);
  },

  async update(id, data) {
    await EquiposRepository.update(id, data);
    return this.getById(id);
  },

  async delete(id) {
    const activa = await AsignacionesRepository.getActivaByEquipo(id);
    if (activa) throw new Error('No se puede eliminar un equipo con asignación activa');
    await EquiposRepository.delete(id);
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

  async dashboard() {
    const todos = await EquiposRepository.listAll();
    const total = todos.length;
    const disponibles = todos.filter(e => e.Estado === 'DISPONIBLE').length;
    const asignados = todos.filter(e => e.Estado === 'ASIGNADO').length;
    const incidencia = todos.filter(e => e.Estado === 'INCIDENCIA').length;
    const baja = todos.filter(e => e.Estado === 'BAJA').length;

    const porTipo = {};
    todos.forEach(e => {
      const tipo = e.DesTipodeEquipo || 'SIN TIPO';
      porTipo[tipo] = (porTipo[tipo] || 0) + 1;
    });

    return { total, disponibles, asignados, incidencia, baja, porTipo };
  },
};
