import { EquiposRepository } from '../repositories/equipos.repository.js';
import { AsignacionesRepository } from '../repositories/asignaciones.repository.js';
import { ComponentesRepository } from '../repositories/componentes.repository.js';
import { IncidenciasRepository } from '../repositories/incidencias.repository.js';
import { IntervencionesRepository } from '../repositories/intervenciones.repository.js';
import { withTransaction, createRequest } from '../config/db.js';
import QRCode from 'qrcode';

function normalizarTexto(valor) {
  return String(valor || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
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

function validarNoBaja(equipo) {
  if (equipo.Estado === 'BAJA') {
    throw businessError('No se puede editar un equipo dado de baja.');
  }
}

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

    if (!data.CodBarra) {
      data.CodBarra = `QR-${data.CodEquipo}-${Date.now().toString(36).toUpperCase()}`;
    }
    const id = await EquiposRepository.create(data);
    const equipo = await this.getById(id);
    await EquiposRepository.registrarCambioEstado(id, null, 'DISPONIBLE', data.IdUsuario, 'Equipo creado');
    return equipo;
  },

  async update(id, data) {
    const equipo = await EquiposRepository.getById(id);
    if (!equipo) throw businessError('Equipo no encontrado', 404);
    validarNoBaja(equipo);

    const safeData = { ...data };
    delete safeData.CodEquipo;
    delete safeData.Estado;
    await EquiposRepository.update(id, safeData);
    return this.getById(id);
  },

  async bajaEquipo(id, idUsuario) {
    const equipo = await EquiposRepository.getById(id);
    if (!equipo) throw businessError('Equipo no encontrado', 404);
    if (equipo.Estado === 'BAJA') throw businessError('El equipo ya está dado de baja');
    const activa = await AsignacionesRepository.getActivaByEquipo(id);
    if (activa) throw businessError('No se puede dar de baja un equipo con asignación activa');
    await EquiposRepository.updateEstado(id, 'BAJA');
    await EquiposRepository.registrarCambioEstado(id, equipo.Estado, 'BAJA', idUsuario, 'Baja lógica del equipo');
    return this.getById(id);
  },

  async cambiarEstado(id, nuevoEstado, idUsuario, obs) {
    const equipo = await EquiposRepository.getById(id);
    if (!equipo) throw businessError('Equipo no encontrado', 404);
    if (equipo.Estado === 'BAJA') throw businessError('No se puede cambiar el estado de un equipo dado de baja.');
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

  async getTiposAsignables() {
    return EquiposRepository.getTiposAsignables();
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
    return this.getCaracteristicas(idEquipo);
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

    return ComponentesRepository.asignarAEquipo(idEquipo, idComponente, obs, origenVinculo, motivo, idIntervencion);
  },

  async quitarComponenteDeEquipo(idEquipo, idMovComponente, idUsuario, motivo, nuevoEstado) {
    const equipo = await EquiposRepository.getById(idEquipo);
    if (!equipo) throw new Error('Equipo no encontrado');
    validarNoBaja(equipo);
    return ComponentesRepository.desasignarDeEquipo(idMovComponente, motivo, nuevoEstado);
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

    return this.getById(id);
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
};
