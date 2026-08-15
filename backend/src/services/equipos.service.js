import { EquiposRepository } from '../repositories/equipos.repository.js';
import { AsignacionesRepository } from '../repositories/asignaciones.repository.js';
import { ActasRepository } from '../repositories/actas.repository.js';
import { ComponentesRepository } from '../repositories/componentes.repository.js';
import { ComponentesService } from './componentes.service.js';
import { PlantillasComponentesRepository } from '../repositories/plantillas-componentes.repository.js';
import { IncidenciasRepository } from '../repositories/incidencias.repository.js';
import { IntervencionesRepository } from '../repositories/intervenciones.repository.js';
import { ConfiguracionesService } from './configuraciones.service.js';
import { ConfiguracionesRepository } from '../repositories/configuraciones.repository.js';
import { withTransaction, createRequest } from '../config/db.js';
import QRCode from 'qrcode';
import { EventsService } from './events.service.js';

function normalizarTexto(valor) {
  return String(valor || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function normalizarClaveEquipo(clave) {
  const limpia = normalizarTexto(clave).replace(/\s+/g, ' ');
  const alias = {
    MARCA: 'Marca',
    MODELO: 'Modelo',
    COLOR: 'Color',
    CAPACIDAD: 'Capacidad',
    ALMACENAMIENTO: 'Capacidad',
    DISCO: 'Capacidad',
    'DISCO DURO': 'Capacidad',
    SSD: 'Capacidad',
    NVME: 'Capacidad',
    'CAPACIDAD DE DISCO': 'Capacidad',
    RAM: 'Ram',
    MEMORIA: 'Ram',
    'MEMORIA RAM': 'Ram',
    'MEMORIA PRINCIPAL': 'Ram',
  };
  return alias[limpia] || '';
}

const TIPOS_NO_EQUIPO = [
  'TECLADO', 'MOUSE', 'CARGADOR', 'CABLE', 'ADAPTADOR', 'MOCHILA', 'AUDIFONOS',
];

function esTipoNoEquipo(tipo) {
  if (!tipo) return false;
  const nombre = normalizarTexto(tipo.DesTipodeEquipo || tipo.CodTipodeEquipo);
  return TIPOS_NO_EQUIPO.includes(nombre);
}

function businessError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

// R2: no se permite modificar datos de un equipo cuyo acta ya fue firmada.
async function validarSinActaFirmada(idEquipo, data) {
  const contieneDatosActa = Object.keys(data || {}).some(
    (k) => k !== 'Obs' && data[k] !== undefined && data[k] !== null
  );
  if (!contieneDatosActa) return;
  const tieneFirmada = await ActasRepository.tieneFirmadaPorEquipo(idEquipo);
  if (tieneFirmada) {
    throw businessError(
      'El equipo tiene un acta firmada vigente. Anula el acta y genera una nueva antes de modificar sus datos.',
      422
    );
  }
}

function validarNoBaja(equipo) {
  if (equipo.Estado === 'BAJA') {
    throw businessError('No se puede editar un equipo dado de baja.');
  }
}

// Tipos de componente esenciales de una PC armada (la tarjeta de video es opcional)
const ESSENCIALES = {
  RAM: { etiqueta: 'Memoria RAM', nombres: ['MEMORIA RAM'] },
  DISCO: { etiqueta: 'Almacenamiento (Disco)', nombres: ['DISCO SSD', 'DISCO DURO', 'M.2 NVME'] },
  PLACA: { etiqueta: 'Placa Madre', nombres: ['PLACA MADRE'] },
  PROCESADOR: { etiqueta: 'Procesador', nombres: ['PROCESADOR'] },
  FUENTE: { etiqueta: 'Fuente de Poder', nombres: ['FUENTE DE PODER'] },
};

function normalizarTipoNombre(v) {
  return String(v || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

async function validarComponentesEsenciales(componentes) {
  if (!componentes?.length) return;
  const presentes = new Set();
  for (const c of componentes) {
    const tipo = await ComponentesRepository.getTipoById(c.IdTipodeComponente);
    if (tipo) presentes.add(normalizarTipoNombre(tipo.DesTipodeComponente));
  }
  const faltantes = Object.values(ESSENCIALES)
    .filter((e) => !e.nombres.some((n) => presentes.has(normalizarTipoNombre(n))))
    .map((e) => e.etiqueta);
  if (faltantes.length) {
    throw businessError(`Faltan componentes esenciales: ${faltantes.join(', ')}. La tarjeta de video es opcional.`);
  }
}

export const EquiposService = {
  async list(filtros) {
    const result = await EquiposRepository.listAll(filtros);
    if (result.rows && result.rows.length) {
      const ids = result.rows.map(r => r.IdMaeEquipo).join(',');
      const caracs = await EquiposRepository.getCaracteristicasByLote(ids);
      const map = {};
      for (const c of caracs) {
        if (!map[c.IdMaeEquipo]) map[c.IdMaeEquipo] = {};
        map[c.IdMaeEquipo][normalizarClaveEquipo(c.Clave)] = c.Valor;
      }
      result.rows = result.rows.map(r => {
        const m = map[r.IdMaeEquipo] || {};
        return {
          ...r,
          Marca: m.Marca || null,
          Modelo: m.Modelo || null,
          Capacidad: m.Capacidad || null,
          Ram: m.Ram || null,
          Color: m.Color || null,
        };
      });
    }
    return result;
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
    if (!data.IdTipodeEquipo) {
      throw businessError('El tipo de equipo es obligatorio');
    }

    const tipo = await EquiposRepository.getTipoById(data.IdTipodeEquipo);
    if (!tipo) {
      throw businessError('El tipo de equipo no existe');
    }
    if (tipo.Estado !== 'ACTIVO') {
      throw businessError('El tipo de equipo no está activo', 400);
    }
    if (esTipoNoEquipo(tipo)) {
      throw businessError('Este tipo debe registrarse como accesorio/componente, no como equipo principal.');
    }

    const existente = await EquiposRepository.getByCodEquipo(data.CodEquipo);
    if (existente) throw businessError(`Ya existe un equipo con el código ${data.CodEquipo}`);

    if (data.CodBarra) {
      const existenteBarra = await EquiposRepository.getByCodigo(data.CodBarra);
      if (existenteBarra) throw businessError(`Ya existe un equipo con el código de barra ${data.CodBarra}`);
    } else {
      data.CodBarra = `QR-${data.CodEquipo}-${Date.now().toString(36).toUpperCase()}`;
    }
    const id = await EquiposRepository.create(data);
    const equipo = await this.getById(id);
    await EquiposRepository.registrarCambioEstado(id, null, 'DISPONIBLE', data.IdUsuario, 'Equipo creado');
    EventsService.emit('equipo.created', { id, CodEquipo: equipo.CodEquipo });
    return equipo;
  },

  async update(id, data) {
    const equipo = await EquiposRepository.getById(id);
    if (!equipo) throw businessError('Equipo no encontrado', 404);
    validarNoBaja(equipo);
    await validarSinActaFirmada(id, data);

    if (data.CodBarra?.trim() && data.CodBarra.trim() !== (equipo.CodBarra || '')) {
      const existenteBarra = await EquiposRepository.getByCodigo(data.CodBarra.trim());
      if (existenteBarra) throw businessError(`Ya existe un equipo con el código de barra ${data.CodBarra}`);
    }

    const safeData = { ...data };
    delete safeData.CodEquipo;
    delete safeData.Estado;
    await EquiposRepository.update(id, safeData);
    const actualizado = await this.getById(id);
    EventsService.emit('equipo.updated', { id, CodEquipo: actualizado.CodEquipo });
    return actualizado;
  },

  async bajaEquipo(id, idUsuario, motivo) {
    const equipo = await EquiposRepository.getById(id);
    if (!equipo) throw businessError('Equipo no encontrado', 404);
    if (equipo.Estado === 'BAJA') throw businessError('El equipo ya está dado de baja');
    if (equipo.Estado === 'ASIGNADO') throw businessError('No se puede dar de baja un equipo con asignación activa');
    const activa = await AsignacionesRepository.getActivaByEquipo(id);
    if (activa) throw businessError('No se puede dar de baja un equipo con asignación activa');
    await EquiposRepository.updateEstado(id, 'BAJA');
    await EquiposRepository.registrarCambioEstado(id, equipo.Estado, 'BAJA', idUsuario, `Baja: ${motivo}`);
    const resultado = await this.getById(id);
    EventsService.emit('equipo.deleted', { id, CodEquipo: equipo.CodEquipo });
    return resultado;
  },

  async cambiarEstado(id, nuevoEstado, idUsuario, obs) {
    const equipo = await EquiposRepository.getById(id);
    if (!equipo) throw businessError('Equipo no encontrado', 404);
    if (equipo.Estado === 'BAJA') throw businessError('No se puede cambiar el estado de un equipo dado de baja.');
    const estadoAnterior = equipo.Estado;
    await EquiposRepository.updateEstado(id, nuevoEstado);
    await EquiposRepository.registrarCambioEstado(id, estadoAnterior, nuevoEstado, idUsuario, obs);
    const actualizado = await this.getById(id);
    EventsService.emit('equipo.updated', { id, CodEquipo: actualizado.CodEquipo });
    return actualizado;
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

  async getTiposAsignables() {
    return EquiposRepository.getTiposAsignables();
  },

  async getPlantillaByTipo(idTipo) {
    return EquiposRepository.getPlantillaByTipo(idTipo);
  },

  async listValoresPlantilla(idPlantilla, q) {
    return EquiposRepository.listValoresPlantilla(idPlantilla, q || '');
  },

  async getTimeline(id) {
    const equipo = await EquiposRepository.getById(id);
    if (!equipo) return [];
    return EquiposRepository.getTimeline(id);
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

  async getCaracteristicas(idEquipo) {
    const equipo = await EquiposRepository.getById(idEquipo);
    if (!equipo) throw businessError('Equipo no encontrado', 404);

    const plantilla = await EquiposRepository.getPlantillaByTipo(equipo.IdTipodeEquipo);
    const valores = await EquiposRepository.getCaracteristicas(idEquipo);

    const caracteristicas = plantilla.map(p => {
      const valor = valores.find(v => v.IdPlantilla === p.IdPlantilla);
      return {
        IdPlantilla: p.IdPlantilla,
        Clave: p.Clave,
        Etiqueta: p.Etiqueta,
        TipoDato: p.TipoDato,
        Requerido: !!p.Requerido,
        Orden: p.Orden,
        Valor: valor?.Valor || null,
      };
    });

    return {
      equipo: { IdMaeEquipo: equipo.IdMaeEquipo, CodEquipo: equipo.CodEquipo },
      tipoEquipo: equipo.DesTipodeEquipo,
      caracteristicas,
    };
  },

  async saveCaracteristicas(idEquipo, caracteristicas, idUsuario) {
    const equipo = await EquiposRepository.getById(idEquipo);
    if (!equipo) throw businessError('Equipo no encontrado', 404);
    validarNoBaja(equipo);

    const plantilla = await EquiposRepository.getPlantillaByTipo(equipo.IdTipodeEquipo);
    const idsValidos = new Set(plantilla.map(p => p.IdPlantilla));

    for (const c of caracteristicas) {
      if (!c.IdPlantilla) throw businessError('IdPlantilla es requerido');
      if (!idsValidos.has(c.IdPlantilla)) {
        throw businessError(`La característica con IdPlantilla ${c.IdPlantilla} no pertenece al tipo de equipo ${equipo.DesTipodeEquipo}`);
      }
    }

    await withTransaction('InventarioGP', async (trx) => {
      const req = (params) => createRequest(trx, params);
      for (const c of caracteristicas) {
        const { recordset } = await req({ idEquipo, idPlantilla: c.IdPlantilla })
          .query('SELECT IdCaracteristica FROM Tab_EQ_CaracteristicasEquipo WHERE IdMaeEquipo = @idEquipo AND IdPlantilla = @idPlantilla');
        if (recordset.length > 0) {
          await req({ id: recordset[0].IdCaracteristica, valor: c.Valor || null, idUsuario: idUsuario || null })
            .query('UPDATE Tab_EQ_CaracteristicasEquipo SET Valor = @valor, IdUsuarioModifica = @idUsuario, FecModificacion = GETDATE() WHERE IdCaracteristica = @id');
        } else {
          await req({ idEquipo, idPlantilla: c.IdPlantilla, valor: c.Valor || null, idUsuario: idUsuario || null })
            .query(`INSERT INTO Tab_EQ_CaracteristicasEquipo (IdMaeEquipo, IdPlantilla, Clave, Valor, IdUsuarioCrea)
              VALUES (@idEquipo, @idPlantilla, (SELECT Clave FROM Tab_EQ_PlantillaCaracteristicas WHERE IdPlantilla = @idPlantilla), @valor, @idUsuario)`);
        }
      }
    });
    EventsService.emit('equipo.updated', { id: idEquipo });
    return this.getCaracteristicas(idEquipo);
  },

  // ─── Configuración TI (hostname / usuario Windows) ──────────────
  async getConfiguracion(id) {
    const equipo = await EquiposRepository.getById(id);
    if (!equipo) throw businessError('Equipo no encontrado', 404);
    const historial = await ConfiguracionesService.getHistorial(id);
    return {
      equipo: {
        IdMaeEquipo: equipo.IdMaeEquipo,
        CodEquipo: equipo.CodEquipo,
        DesTipodeEquipo: equipo.DesTipodeEquipo,
        HostnameActual: equipo.HostnameActual,
        UsuarioWindowsActual: equipo.UsuarioWindowsActual,
      },
      historial,
    };
  },

  async actualizarConfiguracion(id, data, idUsuario) {
    const equipo = await EquiposRepository.getById(id);
    if (!equipo) throw businessError('Equipo no encontrado', 404);
    validarNoBaja(equipo);
    await validarSinActaFirmada(id, data);

    const tipo = await EquiposRepository.getTipoById(equipo.IdTipodeEquipo);
    if (!ConfiguracionesService.esTipoConfigurable(tipo)) {
      throw businessError(`El tipo de equipo ${equipo.DesTipodeEquipo} no admite configuración TI (hostname / usuario Windows).`);
    }

    const finales = await ConfiguracionesService.resolver({
      idEquipo: id,
      hostname: data.Hostname,
      usuarioWindows: data.UsuarioWindows,
    });

    const registros = [];
    if (finales.hostname !== (equipo.HostnameActual || null)) {
      registros.push({
        idTipoCod: 'CAMBIO_HOSTNAME',
        hostnameAnterior: equipo.HostnameActual || null,
        hostnameNuevo: finales.hostname,
      });
    }
    if (finales.usuarioWindows !== (equipo.UsuarioWindowsActual || null)) {
      registros.push({
        idTipoCod: 'CAMBIO_USUARIO_WINDOWS',
        usuarioAnterior: equipo.UsuarioWindowsActual || null,
        usuarioNuevo: finales.usuarioWindows,
      });
    }

    if (!registros.length) {
      return this.getConfiguracion(id);
    }

    const tiposResueltos = await Promise.all(
      registros.map(async (r) => ({
        ...r,
        idTipoConfiguracion: (await ConfiguracionesRepository.getTipoByCod(r.idTipoCod))?.IdTipodeConfiguracion ?? null,
      }))
    );

    await withTransaction('InventarioGP', async (trx) => {
      await ConfiguracionesRepository.actualizarConfig(trx, id, finales.hostname, finales.usuarioWindows);
      for (const r of tiposResueltos) {
        await ConfiguracionesRepository.registrar(trx, {
          idEquipo: id,
          idTipoConfiguracion: r.idTipoConfiguracion,
          hostnameAnterior: r.hostnameAnterior,
          hostnameNuevo: r.hostnameNuevo,
          usuarioAnterior: r.usuarioAnterior ?? null,
          usuarioNuevo: r.usuarioNuevo ?? null,
          idUsuario,
          obs: data.Obs || null,
        });
      }
    });

    const configActualizada = await this.getConfiguracion(id);
    EventsService.emit('configuracion.updated', { id, Hostname: finales.hostname, UsuarioWindows: finales.usuarioWindows });
    return configActualizada;
  },

  async agregarComponenteAEquipo(idEquipo, idComponente, obs, idUsuario, origenVinculo, motivo, idIntervencion) {
    const equipo = await EquiposRepository.getById(idEquipo);
    if (!equipo) throw businessError('Equipo no encontrado', 404);
    validarNoBaja(equipo);

    const componente = await ComponentesRepository.getById(idComponente);
    if (!componente) throw businessError('Componente no encontrado', 404);
    if (componente.Estado !== 'DISPONIBLE') throw businessError('El componente no está disponible');

    const existentes = await ComponentesRepository.getByEquipo(idEquipo);
    if (existentes.some(c => c.IdComponente === idComponente)) {
      throw businessError('El componente ya está instalado en este equipo');
    }

    const resultadoVinculo = await ComponentesRepository.asignarAEquipo(idEquipo, idComponente, obs, origenVinculo, motivo, idIntervencion);
    EventsService.emit('accesorio.vinculado', { idEquipo, idComponente });
    return resultadoVinculo;
  },

  async quitarComponenteDeEquipo(idEquipo, idMovComponente, idUsuario, motivo, nuevoEstado) {
    const equipo = await EquiposRepository.getById(idEquipo);
    if (!equipo) throw new Error('Equipo no encontrado');
    validarNoBaja(equipo);
    const resultadoDesvinculo = await ComponentesRepository.desasignarDeEquipo(idMovComponente, motivo, nuevoEstado);
    EventsService.emit('accesorio.desvinculado', { idEquipo, idMovComponente });
    return resultadoDesvinculo;
  },

  async getComponentesDelEquipo(idEquipo) {
    return ComponentesRepository.getByEquipo(idEquipo);
  },

  async createQuick(data) {
    if (!data.IdTipodeEquipo) {
      throw businessError('El tipo de equipo es obligatorio');
    }

    const tipo = await EquiposRepository.getTipoById(data.IdTipodeEquipo);
    if (!tipo) {
      throw businessError('El tipo de equipo no existe');
    }
    if (tipo.Estado !== 'ACTIVO') {
      throw businessError('El tipo de equipo no está activo');
    }

    if (esTipoNoEquipo(tipo)) {
      throw businessError('Este tipo debe registrarse como accesorio/componente, no como equipo principal.');
    }

    if (data.CodBarra) {
      const existente = await EquiposRepository.getByCodigo(data.CodBarra);
      if (existente) {
        throw businessError(`Ya existe un equipo con el código de barra ${data.CodBarra}`);
      }
    }

    const codEquipo = await this.generateNextCodEquipo(tipo);
    const existenteCod = await EquiposRepository.getByCodEquipo(codEquipo);
    if (existenteCod) {
      throw businessError('Conflicto al generar código interno, intente nuevamente');
    }

    const codBarra = data.CodBarra || `QR-${codEquipo}-${Date.now().toString(36).toUpperCase()}`;

    const id = await EquiposRepository.createQuick({
      codEquipo,
      idTipo: data.IdTipodeEquipo,
      codBarra,
      obs: data.Obs || null,
      estado: 'DISPONIBLE',
      idUsuario: data.IdUsuario || null,
    });

    // Componentes de fábrica: se crean en el módulo Componentes y se vinculan
    // automáticamente a la PC con OrigenVinculo = FABRICA
    let componentes = data.componentes || [];
    if (data.idPlantillaComp) {
      const plantilla = await PlantillasComponentesRepository.getById(data.idPlantillaComp);
      if (!plantilla) throw businessError('Plantilla de componentes no encontrada');
      componentes = plantilla.componentes.map((c) => ({
        IdTipodeComponente: c.IdTipodeComponente,
        Marca: c.Marca,
        Modelo: c.Modelo,
        Capacidad: c.Capacidad,
      }));
    }

    if (componentes?.length) {
      await validarComponentesEsenciales(componentes);
      for (const compData of componentes) {
        if (!compData.IdTipodeComponente) {
          throw businessError('Cada componente requiere un tipo de componente');
        }
        const idComp = await ComponentesService.createQuick(
          {
            IdTipodeComponente: compData.IdTipodeComponente,
            DesComponente: compData.DesComponente,
            Marca: compData.Marca,
            Modelo: compData.Modelo,
            Serie: compData.Serie,
            Capacidad: compData.Capacidad,
            Obs: compData.Obs,
          },
          data.IdUsuario || null,
        );
        await ComponentesRepository.asignarAEquipo(
          id,
          idComp,
          compData.Obs || null,
          'FABRICA',
          'Componente de fábrica (PC armada)',
          null,
        );
      }
    }

    const equipoCreado = await this.getById(id);
    EventsService.emit('equipo.created', { id, CodEquipo: codEquipo });
    return equipoCreado;
  },

  async createQuickLote(data) {
    if (!data.IdTipodeEquipo) throw businessError('El tipo de equipo es obligatorio');
    const cantidad = Math.min(Math.max(parseInt(data.cantidad, 10) || 1, 1), 100);
    if (!data.idPlantillaComp) throw businessError('Selecciona una plantilla de componentes');
    const plantilla = await PlantillasComponentesRepository.getById(data.idPlantillaComp);
    if (!plantilla) throw businessError('Plantilla de componentes no encontrada');
    const componentes = plantilla.componentes.map((c) => ({
      IdTipodeComponente: c.IdTipodeComponente,
      Marca: c.Marca,
      Modelo: c.Modelo,
      Capacidad: c.Capacidad,
    }));
    await validarComponentesEsenciales(componentes);

    const creados = [];
    for (let i = 0; i < cantidad; i++) {
      const creado = await this.createQuick({
        IdTipodeEquipo: data.IdTipodeEquipo,
        idPlantillaComp: data.idPlantillaComp,
        IdUsuario: data.IdUsuario,
      });
      creados.push(creado);
    }
    return creados;
  },

  async generateNextCodEquipo(tipo) {
    const PREFIX_MAP = new Map([
      ['LAPTOP', 'LAP'],
      ['CELULAR', 'CEL'],
      ['MONITOR', 'MON'],
      ['IMPRESORA', 'IMP'],
      ['ACCESS POINT', 'AP'],
      ['SWITCH', 'SW'],
      ['PC ESCRITORIO', 'PC'],
      ['TABLET', 'TAB'],
    ]);

    const nombre = (tipo.DesTipodeEquipo || tipo.CodTipodeEquipo || '').toUpperCase().trim();
    const prefix = PREFIX_MAP.get(nombre) || nombre.replace(/[^A-Z0-9]/g, '').substring(0, 3) || 'GEN';

    const lastCod = await EquiposRepository.getLastCodEquipoByPrefix(prefix);
    let nextNum = 1;
    if (lastCod) {
      const numPart = lastCod.substring(prefix.length + 1);
      nextNum = parseInt(numPart, 10) + 1;
    }
    return `${prefix}-${String(nextNum).padStart(6, '0')}`;
  },

  // Intervenciones técnicas
  async getIntervenciones(idEquipo) {
    const equipo = await EquiposRepository.getById(idEquipo);
    if (!equipo) throw businessError('Equipo no encontrado', 404);
    return IntervencionesRepository.getByEquipo(idEquipo);
  },

  async crearIntervencion(idEquipo, data, idUsuario) {
    const equipo = await EquiposRepository.getById(idEquipo);
    if (!equipo) throw businessError('Equipo no encontrado', 404);
    if (equipo.Estado === 'BAJA') throw businessError('No se pueden registrar intervenciones en un equipo dado de baja.');

    const VALIDOS = ['MANTENIMIENTO', 'REEMPLAZO', 'MEJORA', 'REPARACION', 'DIAGNOSTICO', 'LIMPIEZA', 'INSTALACION_SO', 'BAJA_EQUIPO', 'BAJA_COMPONENTE'];
    if (!VALIDOS.includes(data.TipoIntervencion)) {
      throw businessError('Tipo de intervención inválido.');
    }
    if (!data.Descripcion?.trim()) {
      throw businessError('La descripción es obligatoria.');
    }

    // Validar incidencia si se envía
    if (data.IdIncidencia) {
      const inc = await IncidenciasRepository.getById(data.IdIncidencia);
      if (!inc) throw businessError('Incidencia no encontrada', 404);
      if (inc.IdMaeEquipo !== idEquipo) throw businessError('La incidencia no pertenece a este equipo');
    }

    // Validar componente instalado si se envía
    if (data.IdComponenteInstalado) {
      const comp = await ComponentesRepository.getById(data.IdComponenteInstalado);
      if (!comp) throw businessError('Componente instalado no encontrado', 404);
      if (['BAJA', 'ASIGNADO'].includes(comp.Estado)) {
        throw businessError(`El componente ${comp.CodComponente} no está disponible (estado: ${comp.Estado})`);
      }
    }

    // Validar componente retirado si se envía (debe estar asignado a este equipo)
    if (data.IdComponenteRetirado) {
      const comp = await ComponentesRepository.getById(data.IdComponenteRetirado);
      if (!comp) throw businessError('Componente retirado no encontrado', 404);
      const equipoComps = await ComponentesRepository.getByEquipo(idEquipo);
      if (!equipoComps.some(c => c.IdComponente === data.IdComponenteRetirado)) {
        throw businessError('El componente retirado no está asignado a este equipo');
      }
    }

    // ─── Lógica por tipo ────────────────────────────────────────
    const tipo = data.TipoIntervencion;
    const payload = {
      IdMaeEquipo: idEquipo,
      IdIncidencia: data.IdIncidencia || null,
      IdComponenteInstalado: null,
      IdComponenteRetirado: null,
      TipoIntervencion: tipo,
      Descripcion: data.Descripcion.trim(),
      IdUsuario: idUsuario || null,
      PiezaAfectada: data.PiezaAfectada || null,
      ComponenteRetiradoNoInventariado: data.ComponenteRetiradoNoInventariado || false,
      Resultado: data.Resultado || null,
      RequiereReparacion: data.RequiereReparacion != null ? data.RequiereReparacion : null,
      SoftwareInstalado: data.SoftwareInstalado || null,
      Version: data.Version || null,
      MotivoBaja: data.MotivoBaja || null,
    };

    switch (tipo) {
      case 'REEMPLAZO':
      case 'MEJORA': {
        payload.IdComponenteInstalado = data.IdComponenteInstalado || null;
        payload.IdComponenteRetirado = data.ComponenteRetiradoNoInventariado ? null : (data.IdComponenteRetirado || null);
        const idIntervencion = await IntervencionesRepository.create(payload);
        // Si hay componente instalado, asignarlo al equipo
        if (data.IdComponenteInstalado) {
          await ComponentesRepository.asignarAEquipo(
            idEquipo, data.IdComponenteInstalado, null,
            tipo === 'REEMPLAZO' ? 'REEMPLAZO' : 'MEJORA',
            data.Descripcion, idIntervencion
          );
        }
        // Si hay componente retirado real, desasignarlo y dejarlo disponible
        if (data.IdComponenteRetirado && !data.ComponenteRetiradoNoInventariado) {
          const eqComps = await ComponentesRepository.getByEquipo(idEquipo);
          const mov = eqComps.find(c => c.IdComponente === data.IdComponenteRetirado);
          if (mov) {
            await ComponentesRepository.desasignarDeEquipo(mov.IdMovEquipoComponente, data.Descripcion, 'DISPONIBLE');
          }
        }
        return idIntervencion;
      }

      case 'BAJA_COMPONENTE': {
        payload.MotivoBaja = data.MotivoBaja || null;
        payload.IdComponenteRetirado = data.IdComponenteRetirado || null;
        const idIntervencion = await IntervencionesRepository.create(payload);
        if (data.IdComponenteRetirado) {
          const eqComps = await ComponentesRepository.getByEquipo(idEquipo);
          const mov = eqComps.find(c => c.IdComponente === data.IdComponenteRetirado);
          if (mov) {
            await ComponentesRepository.desasignarDeEquipo(mov.IdMovEquipoComponente, data.MotivoBaja || data.Descripcion, 'BAJA');
          }
        }
        return idIntervencion;
      }

      case 'BAJA_EQUIPO': {
        payload.MotivoBaja = data.MotivoBaja || null;
        // Validar que no tenga asignación activa
        const activa = await AsignacionesRepository.getActivaByEquipo(idEquipo);
        if (activa) {
          throw businessError('No se puede dar de baja un equipo con asignación activa. Cesé la asignación primero.');
        }
        const idIntervencion = await IntervencionesRepository.create(payload);
        // Cambiar estado del equipo
        await EquiposRepository.updateEstado(idEquipo, 'BAJA');
        await EquiposRepository.registrarCambioEstado(idEquipo, equipo.Estado, 'BAJA', idUsuario, `Baja: ${data.MotivoBaja || ''} - ${data.Descripcion}`);
        // Procesar componentes según data.ComponentesBaja
        if (data.ComponentesBaja && Array.isArray(data.ComponentesBaja)) {
          const eqComps = await ComponentesRepository.getByEquipo(idEquipo);
          for (const c of data.ComponentesBaja) {
            const mov = eqComps.find(m => m.IdComponente === c.IdComponente);
            if (mov) {
              if (c.Accion === 'DISPONIBLE') {
                await ComponentesRepository.desasignarDeEquipo(mov.IdMovEquipoComponente, 'Equipo dado de baja');
              } else if (c.Accion === 'BAJA') {
                await ComponentesRepository.desasignarDeEquipo(mov.IdMovEquipoComponente, 'Componente dado de baja junto con equipo');
              }
              // 'MANTENER' no hace nada
            }
          }
        }
        return idIntervencion;
      }

      default:
        return IntervencionesRepository.create(payload);
    }
  },

  // Plantillas de componentes de fábrica
  async listPlantillas() {
    return PlantillasComponentesRepository.list();
  },

  async getPlantilla(id) {
    const p = await PlantillasComponentesRepository.getById(id);
    if (!p) throw businessError('Plantilla no encontrada', 404);
    return p;
  },

  async createPlantilla(nombre, descripcion, componentes, idUsuario) {
    if (!nombre?.trim()) throw businessError('El nombre de la plantilla es obligatorio');
    if (!componentes?.length) throw businessError('La plantilla debe tener al menos un componente');
    await validarComponentesEsenciales(componentes);
    return PlantillasComponentesRepository.create(nombre.trim(), descripcion, componentes, idUsuario);
  },

  async updatePlantilla(id, nombre, descripcion, componentes) {
    if (!nombre?.trim()) throw businessError('El nombre de la plantilla es obligatorio');
    if (!componentes?.length) throw businessError('La plantilla debe tener al menos un componente');
    await validarComponentesEsenciales(componentes);
    return PlantillasComponentesRepository.update(id, nombre.trim(), descripcion, componentes);
  },

  async deletePlantilla(id) {
    return PlantillasComponentesRepository.remove(id);
  },
};
