import { IncidenciasRepository } from '../repositories/incidencias.repository.js';
import { EquiposRepository } from '../repositories/equipos.repository.js';
import { AsignacionesRepository } from '../repositories/asignaciones.repository.js';
import { ConfiguracionesService } from './configuraciones.service.js';
import { ConfiguracionesRepository } from '../repositories/configuraciones.repository.js';
import { withTransaction, createRequest } from '../config/db.js';

const DB = 'InventarioGP';

const ACCIONES_MANTENIMIENTO = new Set([
  'FORMATEO', 'REINSTALACION_SO', 'CAMBIO_HOSTNAME', 'CAMBIO_USUARIO_WINDOWS',
]);

const TIPO_CFG_POR_ACCION = {
  FORMATEO: 'FORMATEO',
  REINSTALACION_SO: 'REINSTALACION_SO',
  CAMBIO_HOSTNAME: 'CAMBIO_HOSTNAME',
  CAMBIO_USUARIO_WINDOWS: 'CAMBIO_USUARIO_WINDOWS',
};

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

    const esMantenimiento = data.TipoIncidencia === 'MANTENIMIENTO';
    if (esMantenimiento && !ACCIONES_MANTENIMIENTO.has(data.Accion)) {
      const err = new Error('Para incidencias de mantenimiento la acción es obligatoria (FORMATEO, REINSTALACION_SO, CAMBIO_HOSTNAME, CAMBIO_USUARIO_WINDOWS)');
      err.statusCode = 400;
      throw err;
    }

    // Configuración TI final: solo aplica en equipos configurables (PC/Laptop);
    // en otros tipos los nuevos valores quedan anulados (NULL).
    const resuelto = await ConfiguracionesService.resolver({
      idEquipo: data.IdMaeEquipo,
      hostname: data.NuevoHostname,
      usuarioWindows: data.NuevoUsuarioWindows,
    });
    const tipoCfg = esMantenimiento && (resuelto.hostname || resuelto.usuarioWindows)
      ? await ConfiguracionesRepository.getTipoByCod(TIPO_CFG_POR_ACCION[data.Accion])
      : null;

    return withTransaction(DB, async (trx) => {
      const req = (params) => createRequest(trx, params);

      const { recordset } = await req({
        idEquipo: data.IdMaeEquipo,
        idTrabajador: data.IdReferente ?? null,
        tipo: data.TipoIncidencia,
        desc: data.Descripcion,
        fec: data.FecIncidencia || new Date().toISOString().split('T')[0],
        accion: data.Accion ?? null,
        nuevoHost: data.NuevoHostname ?? null,
        nuevoUsr: data.NuevoUsuarioWindows ?? null,
        idUsuario: data.IdUsuario ?? null,
      }).query(`
        INSERT INTO Tab_EQ_Incidencias
          (IdMaeEquipo, IdReferente, TipoIncidencia, Accion, NuevoHostname, NuevoUsuarioWindows, Descripcion, FecIncidencia, Estado, IdUsuario)
        OUTPUT INSERTED.IdIncidencia
        VALUES (@idEquipo, @idTrabajador, @tipo, @accion, @nuevoHost, @nuevoUsr, @desc, @fec, 'ABIERTO', @idUsuario)
      `);
      const idIncidencia = recordset[0]?.IdIncidencia;

      const nuevoEstado = 'INCIDENCIA';
      await req({ idEquipo: data.IdMaeEquipo, estado: nuevoEstado }).query(
        'UPDATE Tab_EQ_MaeEquipos SET Estado = @estado WHERE IdMaeEquipo = @idEquipo'
      );
      await req({
        idEquipo: data.IdMaeEquipo,
        estadoAnterior: equipo.Estado,
        estadoNuevo: nuevoEstado,
        idUsuario: data.IdUsuario ?? null,
        obs: `Incidencia abierta: ${data.TipoIncidencia}`,
      }).query(`
        INSERT INTO Tab_EQ_MovEstadosEquipos (IdMaeEquipo, EstadoAnterior, EstadoNuevo, IdUsuario, Obs)
        VALUES (@idEquipo, @estadoAnterior, @estadoNuevo, @idUsuario, @obs)
      `);

      if (tipoCfg) {
        await ConfiguracionesRepository.actualizarConfig(trx, data.IdMaeEquipo, resuelto.hostname, resuelto.usuarioWindows);
        await ConfiguracionesRepository.registrar(trx, {
          idEquipo: data.IdMaeEquipo,
          idTipoConfiguracion: tipoCfg.IdTipodeConfiguracion,
          hostnameAnterior: equipo.HostnameActual,
          hostnameNuevo: resuelto.hostname,
          usuarioAnterior: equipo.UsuarioWindowsActual,
          usuarioNuevo: resuelto.usuarioWindows,
          idUsuario: data.IdUsuario ?? null,
          obs: `Incidencia ${data.TipoIncidencia} - ${data.Accion}: ${data.Descripcion || ''}`,
        });
      }

      return idIncidencia;
    });
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