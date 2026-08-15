import { ComponentesRepository } from '../repositories/componentes.repository.js';
import { withTransaction, createRequest } from '../config/db.js';
import { EventsService } from './events.service.js';

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
  ['M.2 NVME', 'NVME'],
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

function buildAutoDescFromPlantilla(tipoNombre, plantilla, caracteristicas) {
  const map = {};
  for (const c of caracteristicas || []) map[c.Clave] = c.Valor;
  const partes = [String(tipoNombre || '').trim()];
  const filas = (plantilla || [])
    .filter(p => p.MostrarEnDescripcion && map[p.Clave])
    .sort((a, b) => (a.OrdenDescripcion || 99) - (b.OrdenDescripcion || 99));
  for (const p of filas) partes.push(map[p.Clave]);
  return partes.filter(Boolean).join(' ');
}

function normalizeTypeName(value) {
  return normalizarTexto(value);
}

async function buildCaracteristicasResueltas(lista, plantilla) {
  const plantillaArr = plantilla || [];
  const idsValidos = new Set(plantillaArr.map(p => p.IdPlantilla));
  const invalidos = (lista || []).filter(c => c && !idsValidos.has(c.IdPlantilla));
  if (invalidos.length > 0) {
    throw businessError(`IDs de plantilla inválidos: ${invalidos.map(x => x.IdPlantilla).join(', ')}`, 422);
  }
  const resueltas = [];
  for (const c of lista || []) {
    if (!c || !c.IdPlantilla) continue;
    const plant = plantillaArr.find(p => p.IdPlantilla === c.IdPlantilla);
    let idValorCatalogo = c.IdValorCatalogo || null;
    let valor = c.Valor ?? '';
    if (String(plant?.TipoDato || '').toUpperCase() === 'CATALOGO' && !idValorCatalogo && valor.trim()) {
      const match = await ComponentesRepository.findCatalogoValor(plant.IdCatalogo, valor);
      if (match) {
        idValorCatalogo = match.IdValor;
        valor = match.NombreValor;
      }
    }
    resueltas.push({
      IdPlantilla: c.IdPlantilla,
      Clave: plant?.Clave || '',
      Valor: valor,
      IdValorCatalogo: idValorCatalogo,
    });
  }
  return resueltas;
}

// Conserva los campos legacy (Marca/Modelo/Serie/Lote/Capacidad) como
// caracteristicas cuando la plantilla del tipo define esa clave. Evita que
// esos datos se pierdan al ya no existir las columnas fijas en Tab_EQ_Componentes.
function mergeLegacyCaracteristicas(resueltas, plantilla, data) {
  const out = [...(resueltas || [])];
  const existentes = new Set(out.map(c => c.Clave));
  const claves = ['Marca', 'Modelo', 'Serie', 'Lote', 'Capacidad'];
  for (const clave of claves) {
    const valor = data?.[clave]?.trim?.();
    if (!valor || existentes.has(clave)) continue;
    const p = (plantilla || []).find(x => x.Clave === clave);
    if (!p) continue;
    out.push({ IdPlantilla: p.IdPlantilla, Clave: clave, Valor: valor, IdValorCatalogo: null });
    existentes.add(clave);
  }
  return out;
}

export const ComponentesService = {
  async list(filtros) {
    const result = await ComponentesRepository.listAll(filtros);
    if (result.length) {
      const ids = result.map(r => r.IdComponente).join(',');
      if (ids) {
        const caracs = await ComponentesRepository.getCaracteristicasByLote(ids);
        const map = {};
        for (const c of caracs) {
          if (!map[c.IdComponente]) map[c.IdComponente] = {};
          map[c.IdComponente][c.Clave] = c.Valor;
        }
        return result.map(r => {
          const caracMap = map[r.IdComponente] || {};
          return {
            ...r,
            caracteristicas: caracMap,
            Marca: caracMap.Marca || r.Marca || null,
            Modelo: caracMap.Modelo || r.Modelo || null,
            Capacidad: caracMap.Capacidad || r.Capacidad || null,
          };
        });
      }
    }
    return result;
  },

  async getById(id) {
    const c = await ComponentesRepository.getById(id);
    if (!c) throw businessError('Componente no encontrado', 404);
    const caracs = await ComponentesRepository.getCaracteristicasComponente(id);
    const map = {};
    for (const cc of caracs) map[cc.Clave] = cc.Valor;
    return {
      ...c,
      caracteristicas: caracs,
      Marca: map.Marca || c.Marca || null,
      Modelo: map.Modelo || c.Modelo || null,
      Capacidad: map.Capacidad || c.Capacidad || null,
    };
  },

  async getByCodigo(cod) {
    return ComponentesRepository.getByCodigo(cod);
  },

  async getDetalleByCodigo(cod) {
    const comp = await ComponentesRepository.getByCodigo(cod);
    if (!comp) return null;
    const detalle = await ComponentesRepository.getDetalleById(comp.IdComponente);
    detalle.caracteristicas = await ComponentesRepository.getCaracteristicasComponente(comp.IdComponente);
    return detalle;
  },

  async listTipos() {
    const tipos = await ComponentesRepository.listTipos();
    return tipos.filter((tipo) => !INVALID_COMPONENT_TYPES.has(normalizeTypeName(tipo.DesTipodeComponente)));
  },

  async listAccDisponibles() {
    const list = await ComponentesRepository.listAccDisponibles();
    if (list.length) {
      const ids = list.map(r => r.IdComponente).join(',');
      if (ids) {
        const caracs = await ComponentesRepository.getCaracteristicasByLote(ids);
        const map = {};
        for (const c of caracs) {
          if (!map[c.IdComponente]) map[c.IdComponente] = {};
          map[c.IdComponente][c.Clave] = c.Valor;
        }
        return list.map(r => {
          const m = map[r.IdComponente] || {};
          return { ...r, Marca: m.Marca || r.Marca || null, Modelo: m.Modelo || r.Modelo || null };
        });
      }
    }
    return list;
  },

  async listMarcas(q) {
    return ComponentesRepository.listMarcas(q || '');
  },

  async searchCatalogo(nombre, q) {
    return ComponentesRepository.searchCatalogo(nombre, q);
  },

  async listValoresPlantilla(idPlantilla, q) {
    return ComponentesRepository.listValoresPlantilla(idPlantilla, q || '');
  },

  async listAccsPorTrabajador(idTrabajador) {
    return ComponentesRepository.listAccesoriosPorTrabajador(idTrabajador);
  },

  async create(data, idUsuario) {
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
    const plantilla = await ComponentesRepository.getPlantillaByComponenteTipo(data.IdTipodeComponente);
    const caracteristicas = mergeLegacyCaracteristicas(
      await buildCaracteristicasResueltas(data.caracteristicas || [], plantilla),
      plantilla, data,
    );
    if (!data.DesComponente?.trim()) {
      data.DesComponente = buildAutoDescFromPlantilla(tipo.DesTipodeComponente, plantilla, caracteristicas) || null;
    }
    const resultado = await ComponentesRepository.create(data, { idUsuario, caracteristicas });
    EventsService.emit('componente.created', { id: resultado, CodComponente: data.CodComponente });
    return resultado;
  },

  async update(id, data) {
    const comp = await ComponentesRepository.getById(id);
    if (!comp) throw businessError('Componente no encontrado', 404);
    if (comp.Estado === 'BAJA') throw businessError('No se puede editar un componente dado de baja');
    const resultado = await ComponentesRepository.update(id, data);
    EventsService.emit('componente.updated', { id });
    return resultado;
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
    const publicUrl = process.env.ACTAS_PUBLIC_URL || 'http://localhost:5173';
    const url = `${publicUrl}/componentes/scan/${comp.CodComponente}`;
    detalle.qrBase64 = await QRCode.toDataURL(url, { width: 150, margin: 1 });
    detalle.qrUrl = url;

    return detalle;
  },

  async baja(id) {
    const comp = await ComponentesRepository.getById(id);
    if (!comp) throw businessError('Componente no encontrado', 404);
    if (comp.Estado === 'BAJA') throw businessError('El componente ya está dado de baja');
    if (comp.Estado === 'ASIGNADO') throw businessError('No se puede dar de baja un componente asignado. Cese la asignación primero.');
    const resultado = await ComponentesRepository.baja(id);
    EventsService.emit('componente.deleted', { id, CodComponente: comp.CodComponente });
    return resultado;
  },

  async createQuick(data, idUsuario) {
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

    const plantilla = await ComponentesRepository.getPlantillaByComponenteTipo(data.IdTipodeComponente);
    const caracteristicas = mergeLegacyCaracteristicas(
      await buildCaracteristicasResueltas(data.caracteristicas || [], plantilla),
      plantilla, data,
    );
    const autoDescription = buildAutoDescFromPlantilla(tipo.DesTipodeComponente, plantilla, caracteristicas);

    const resultado = await ComponentesRepository.create({
      IdTipodeComponente: data.IdTipodeComponente,
      CodComponente: codComponente,
      DesComponente: data.DesComponente?.trim() || autoDescription || null,
      Obs: data.Obs || null,
    }, { idUsuario, caracteristicas });
    EventsService.emit('componente.created', { id: resultado, CodComponente: codComponente });
    return resultado;
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
        const esCatalogo = String(plant?.TipoDato || '').toUpperCase() === 'CATALOGO';
        let idValorCatalogo = carac.IdValorCatalogo || null;

        if (esCatalogo && !idValorCatalogo && carac.Valor?.trim()) {
          const match = await ComponentesRepository.findCatalogoValor(plant.IdCatalogo, carac.Valor);
          idValorCatalogo = match?.IdValor || null;
        }

        await ComponentesRepository.insertCaracteristicaComponente(
          idComponente,
          carac.IdPlantilla,
          plant?.Clave || '',
          carac.Valor || '',
          idValorCatalogo,
          idUsuario,
          tx,
        );
      }
    });

    return this.getCaracteristicas(idComponente);
  },
};
