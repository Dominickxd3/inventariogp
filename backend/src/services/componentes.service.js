import { ComponentesRepository } from '../repositories/componentes.repository.js';

const PREFIX_MAP = new Map([
  ['MEMORIA RAM', 'RAM'],
  ['DISCO SSD', 'SSD'],
  ['DISCO DURO', 'HDD'],
  ['FUENTE DE PODER', 'FUE'],
  ['PLACA MADRE', 'PLA'],
  ['PROCESADOR', 'CPU'],
  ['TARJETA DE VIDEO', 'GPU'],
  ['CARGADOR', 'CAR'],
  ['BATERIA', 'BAT'],
  ['PANTALLA', 'PAN'],
  ['MOUSE', 'MOU'],
  ['TECLADO', 'TEC'],
  ['ADAPTADOR', 'ADA'],
  ['CABLE', 'CAB'],
  ['TONER', 'TON'],
]);

const INVALID_COMPONENT_TYPES = new Set([
  'LAPTOP',
  'CELULAR',
  'PC ESCRITORIO',
  'IMPRESORA',
  'MONITOR',
  'TABLET',
  'SWITCH',
  'ACCESS POINT',
]);

function derivePrefix(tipoNombre) {
  const upper = (tipoNombre || '').toUpperCase().trim();
  if (PREFIX_MAP.has(upper)) return PREFIX_MAP.get(upper);
  const match = upper.match(/^[A-Z]{3}/);
  return match ? match[0] : 'COM';
}

function buildAutoDescription(tipoNombre, marca, modelo, detalle) {
  return [tipoNombre, marca, modelo, detalle]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ');
}

function normalizeTypeName(value) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

export const ComponentesService = {
  async list(filtros) {
    return ComponentesRepository.listAll(filtros);
  },

  async getById(id) {
    return ComponentesRepository.getById(id);
  },

  async listTipos() {
    const tipos = await ComponentesRepository.listTipos();
    return tipos.filter((tipo) => !INVALID_COMPONENT_TYPES.has(normalizeTypeName(tipo.DesTipodeComponente)));
  },

  async create(data) {
    return ComponentesRepository.create(data);
  },

  async update(id, data) {
    return ComponentesRepository.update(id, data);
  },

  async createTipo(data) {
    return ComponentesRepository.createTipo(data);
  },

  async createQuick(data) {
    const tipo = await ComponentesRepository.getTipoById(data.IdTipodeComponente);
    if (!tipo) throw new Error('Tipo de componente no encontrado');
    if (INVALID_COMPONENT_TYPES.has(normalizeTypeName(tipo.DesTipodeComponente))) {
      throw new Error('El tipo seleccionado corresponde a un equipo principal, no a un componente');
    }
    if (data.Serie?.trim()) {
      const existente = await ComponentesRepository.getBySerie(data.Serie.trim());
      if (existente) {
        throw new Error(`Ya existe un componente con la serie ${data.Serie.trim()}`);
      }
    }

    const prefix = derivePrefix(tipo.DesTipodeComponente);
    const lastCod = await ComponentesRepository.getLastCodComponenteByPrefix(prefix);
    let nextNum = 1;
    if (lastCod) {
      const parts = lastCod.split('-');
      const numPart = parts[parts.length - 1];
      nextNum = parseInt(numPart, 10) + 1;
    }
    const codComponente = `${prefix}-${String(nextNum).padStart(6, '0')}`;
    const autoDescription = buildAutoDescription(
      tipo.DesTipodeComponente,
      data.Marca,
      data.Modelo,
      data.Capacidad
    );

    return ComponentesRepository.create({
      IdTipodeComponente: data.IdTipodeComponente,
      CodComponente: codComponente,
      DesComponente: data.DesComponente?.trim() || autoDescription || null,
      Marca: data.Marca || null,
      Modelo: data.Modelo || null,
      Serie: data.Serie || null,
      Lote: data.Lote || null,
      Capacidad: data.Capacidad || null,
      Obs: data.Obs || null,
    });
  },
};
