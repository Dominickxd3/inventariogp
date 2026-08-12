import { ComponentesRepository } from '../repositories/componentes.repository.js';
import { withTransaction, createRequest } from '../config/db.js';

function normalizarTexto(valor) {
  return String(valor || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function businessError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

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
  ['TINTA', 'TIN'],
  ['CARTUCHO', 'CTU'],
  ['CARCASA', 'CRC'],
  ['PROTECTOR', 'PRO'],
  ['BASE', 'BAS'],
  ['WEBCAM', 'WEB'],
  ['MOCHILA', 'MOC'],
  ['MEMORIA', 'MEM'],
  ['AUDIFONOS', 'AUD'],
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
  const upper = normalizarTexto(tipoNombre);
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
  return normalizarTexto(value);
}

export const ComponentesService = {
  async list(filtros) {
    const result = await ComponentesRepository.listAll(filtros);
    if (filtros.idTipo && result.rows?.length) {
      const ids = result.rows.map(r => r.IdComponente).join(',');
      if (ids) {
        const caracs = await ComponentesRepository.getCaracteristicasByLote(ids);
        const map = {};
        for (const c of caracs) {
          if (!map[c.IdComponente]) map[c.IdComponente] = {};
          map[c.IdComponente][c.Clave] = c.Valor;
        }
        result.rows = result.rows.map(r => ({ ...r, caracteristicas: map[r.IdComponente] || {} }));
      }
    }
    return result;
  },

  async getById(id) {
    const c = await ComponentesRepository.getById(id);
    if (!c) throw businessError('Componente no encontrado', 404);
    return c;
  },

  async listTipos() {
    const tipos = await ComponentesRepository.listTipos();
    return tipos.filter((tipo) => !INVALID_COMPONENT_TYPES.has(normalizeTypeName(tipo.DesTipodeComponente)));
  },

  async listAccDisponibles() {
    return ComponentesRepository.listAccDisponibles();
  },

  async listAccsPorTrabajador(idTrabajador) {
    return ComponentesRepository.listAccesoriosPorTrabajador(idTrabajador);
  },

  async create(data) {
    const tipo = await ComponentesRepository.getTipoById(data.IdTipodeComponente);
    if (!tipo) throw businessError('Tipo de componente no encontrado');
    if (INVALID_COMPONENT_TYPES.has(normalizeTypeName(tipo.DesTipodeComponente))) {
      throw businessError('El tipo seleccionado corresponde a un equipo principal, no a un componente');
    }
    if (data.Serie?.trim()) {
      const existente = await ComponentesRepository.getBySerie(data.Serie.trim());
      if (existente) throw businessError(`Ya existe un componente con la serie ${data.Serie.trim()}`);
    }
    const codigo = data.CodComponente?.trim();
    if (!codigo) {
      const prefix = derivePrefix(tipo.DesTipodeComponente);
      const lastCod = await ComponentesRepository.getLastCodComponenteByPrefix(prefix);
      let nextNum = 1;
      if (lastCod) {
        const parts = lastCod.split('-');
        const numPart = parts[parts.length - 1];
        nextNum = parseInt(numPart, 10) + 1;
      }
      data.CodComponente = `${prefix}-${String(nextNum).padStart(6, '0')}`;
    }
    if (!data.DesComponente?.trim()) {
      data.DesComponente = buildAutoDescription(
        tipo.DesTipodeComponente, data.Marca, data.Modelo, data.Capacidad
      ) || null;
    }
    return ComponentesRepository.create(data);
  },

  async update(id, data) {
    const comp = await ComponentesRepository.getById(id);
    if (!comp) throw businessError('Componente no encontrado', 404);
    if (comp.Estado === 'BAJA') throw businessError('No se puede editar un componente dado de baja');
    return ComponentesRepository.update(id, data);
  },

  async createTipo(data) {
    return ComponentesRepository.createTipo(data);
  },

  async getDetalle(id) {
    if (!Number.isInteger(id) || id <= 0) throw businessError('ID de componente inválido', 400);
    const detalle = await ComponentesRepository.getDetalleById(id);
    if (!detalle?.componente) throw businessError('Componente no encontrado', 404);
    detalle.caracteristicas = await ComponentesRepository.getCaracteristicasComponente(id);

    const QRCode = (await import('qrcode')).default;
    const comp = detalle.componente;
    const url = `/componentes/scan/${comp.CodComponente}`;
    detalle.qrBase64 = await QRCode.toDataURL(url, { width: 150, margin: 1 });
    detalle.qrUrl = url;

    return detalle;
  },

  async baja(id) {
    const comp = await ComponentesRepository.getById(id);
    if (!comp) throw businessError('Componente no encontrado', 404);
    if (comp.Estado === 'BAJA') throw businessError('El componente ya está dado de baja');
    if (comp.Estado === 'ASIGNADO') throw businessError('No se puede dar de baja un componente asignado. Cese la asignación primero.');
    return ComponentesRepository.baja(id);
  },

  async createQuick(data) {
    const tipo = await ComponentesRepository.getTipoById(data.IdTipodeComponente);
    if (!tipo) throw businessError('Tipo de componente no encontrado');
    if (INVALID_COMPONENT_TYPES.has(normalizeTypeName(tipo.DesTipodeComponente))) {
      throw businessError('El tipo seleccionado corresponde a un equipo principal, no a un componente');
    }
    if (data.Serie?.trim()) {
      const existente = await ComponentesRepository.getBySerie(data.Serie.trim());
      if (existente) {
        throw businessError(`Ya existe un componente con la serie ${data.Serie.trim()}`);
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
  async getPlantillaByTipo(idTipo) {
    return ComponentesRepository.getPlantillaByComponenteTipo(idTipo);
  },

  async getCaracteristicas(idComponente) {
    return ComponentesRepository.getCaracteristicasComponente(idComponente);
  },

  async saveCaracteristicas(idComponente, caracteristicas, idUsuario) {
    const datos = await ComponentesRepository.getById(idComponente);
    if (!datos) throw Object.assign(new Error('Componente no encontrado'), { statusCode: 404 });

    const plantilla = await ComponentesRepository.getPlantillaByComponenteTipo(datos.IdTipodeComponente);
    const validIds = new Set(plantilla.map(p => p.IdPlantilla));

    const invalidos = caracteristicas.filter(c => !validIds.has(c.IdPlantilla));
    if (invalidos.length > 0) {
      throw Object.assign(new Error(`IDs de plantilla inválidos: ${invalidos.map(x => x.IdPlantilla).join(', ')}`), { statusCode: 422 });
    }

    await withTransaction('InventarioGP', async (tx) => {
      const req = createRequest(tx, { id: idComponente });
      await req.query('DELETE FROM Tab_Componente_Caracteristicas WHERE IdComponente = @id');

      for (const carac of caracteristicas) {
        const plant = plantilla.find(p => p.IdPlantilla === carac.IdPlantilla);
        const req2 = createRequest(tx, { idComponente, idPlantilla: carac.IdPlantilla, clave: plant?.Clave || '', valor: carac.Valor || '', idUsuario });
        await req2.query(`
          INSERT INTO Tab_Componente_Caracteristicas (IdComponente, IdPlantilla, Clave, Valor, IdUsuarioCrea)
          VALUES (@idComponente, @idPlantilla, @clave, @valor, @idUsuario)
        `);
      }
    });

    return this.getCaracteristicas(idComponente);
  },
};
