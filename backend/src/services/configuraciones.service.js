import { EquiposRepository } from '../repositories/equipos.repository.js';
import { ConfiguracionesRepository } from '../repositories/configuraciones.repository.js';
import { withTransaction } from '../config/db.js';
import { EventsService } from './events.service.js';

const DB = 'InventarioGP';

// Tipos de equipo que admiten configuración TI (hostname / usuario Windows):
// PC ESCRITORIO (2) y LAPTOP (3). El resto de tipos permanece con NULL.
const TIPOS_CONFIGURABLES = new Set([2, 3]);

function businessError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

export const ConfiguracionesService = {
  esTipoConfigurable(tipo) {
    return !!tipo && TIPOS_CONFIGURABLES.has(Number(tipo.IdTipodeEquipo));
  },

  normalizar(valor) {
    if (valor == null) return null;
    const t = String(valor).trim();
    return t.length ? t : null;
  },

  // Resuelve los valores finales de hostname/usuario según el tipo de equipo.
  // Para tipos no configurables devuelve null (la configuración permanece NULL).
  // Valida duplicidad de hostname activo cuando corresponde.
  async resolver({ idEquipo, hostname, usuarioWindows }) {
    const equipo = await EquiposRepository.getById(idEquipo);
    if (!equipo) throw businessError('Equipo no encontrado', 404);
    const tipo = await EquiposRepository.getTipoById(equipo.IdTipodeEquipo);

    if (!this.esTipoConfigurable(tipo)) {
      return { hostname: null, usuarioWindows: null };
    }

    const host = this.normalizar(hostname);
    const usr = this.normalizar(usuarioWindows);

    if (host) {
      const duplicado = await ConfiguracionesRepository.existeHostname(host, idEquipo);
      if (duplicado) {
        throw businessError(`El hostname ${host} ya está en uso por el equipo ${duplicado.CodEquipo}.`, 409);
      }
    }

    return { hostname: host, usuarioWindows: usr };
  },

  async getHistorial(idEquipo) {
    return ConfiguracionesRepository.getByEquipo(idEquipo);
  },

  // Aplica configuración con su propio registro de historial (flujo independiente,
  // ej. panel TI de un equipo). idTipoConfiguracion es el Código del tipo.
  async aplicar({ idEquipo, idTipoConfiguracion, hostname, usuarioWindows, idUsuario, obs }) {
    const equipo = await EquiposRepository.getById(idEquipo);
    if (!equipo) throw businessError('Equipo no encontrado', 404);

    const tipo = await EquiposRepository.getTipoById(equipo.IdTipodeEquipo);
    if (!this.esTipoConfigurable(tipo)) {
      throw businessError(`El tipo de equipo ${equipo.DesTipodeEquipo} no admite configuración TI (hostname / usuario Windows).`);
    }

    const resuelto = await this.resolver({ idEquipo, hostname, usuarioWindows });

    const tipoObj = await ConfiguracionesRepository.getTipoByCod(idTipoConfiguracion);

    await withTransaction(DB, async (trx) => {
      await ConfiguracionesRepository.actualizarConfig(trx, idEquipo, resuelto.hostname, resuelto.usuarioWindows);
      await ConfiguracionesRepository.registrar(trx, {
        idEquipo,
        idTipoConfiguracion: tipoObj?.IdTipodeConfiguracion ?? null,
        hostnameAnterior: equipo.HostnameActual,
        hostnameNuevo: resuelto.hostname,
        usuarioAnterior: equipo.UsuarioWindowsActual,
        usuarioNuevo: resuelto.usuarioWindows,
        idUsuario,
        obs: obs ?? null,
      });
    });

    EventsService.emit('configuracion.updated', { idEquipo, Hostname: resuelto.hostname, UsuarioWindows: resuelto.usuarioWindows });

    return this.getHistorial(idEquipo);
  },
};