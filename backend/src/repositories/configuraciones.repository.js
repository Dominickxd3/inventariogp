import { query, createRequest } from '../config/db.js';

const DB = 'InventarioGP';

// Ejecuta dentro de una transacción (trx) si se provee, o como query simple.
const exec = (trx, params, sql) => trx ? createRequest(trx, params).query(sql) : query(DB, sql, params);

export const ConfiguracionesRepository = {
  async getTipoByCod(cod) {
    const rows = await query(DB, `
      SELECT IdTipodeConfiguracion, CodTipodeConfiguracion, DesTipodeConfiguracion
      FROM Tab_EQ_TipodeConfiguraciones
      WHERE CodTipodeConfiguracion = @cod
    `, { cod });
    return rows[0] || null;
  },

  async getByEquipo(idEquipo) {
    return query(DB, `
      SELECT m.*, tc.CodTipodeConfiguracion, tc.DesTipodeConfiguracion,
             u.User_Fullname AS NombreUsuario
      FROM Tab_EQ_MovConfiguraciones m
      LEFT JOIN Tab_EQ_TipodeConfiguraciones tc ON m.IdTipodeConfiguracion = tc.IdTipodeConfiguracion
      LEFT JOIN Tab_SYS_Usuarios u ON m.IdUsuarioCrea = u.IdUsuario
      WHERE m.IdMaeEquipo = @id
      ORDER BY m.FecRegistro DESC, m.IdMovConfiguracion DESC
    `, { id: idEquipo });
  },

  async existeHostname(hostname, idEquipo) {
    const rows = await query(DB, `
      SELECT TOP 1 IdMaeEquipo, CodEquipo
      FROM Tab_EQ_MaeEquipos
      WHERE HostnameActual = @hostname
        AND Estado <> 'BAJA'
        AND (@idEquipo IS NULL OR IdMaeEquipo <> @idEquipo)
    `, { hostname, idEquipo: idEquipo ?? null });
    return rows[0] || null;
  },

  async actualizarConfig(trx, idEquipo, hostname, usuarioWindows) {
    await exec(trx, {
      idEquipo,
      hostname: hostname ?? null,
      usuarioWindows: usuarioWindows ?? null,
    }, `
      UPDATE Tab_EQ_MaeEquipos
      SET HostnameActual = @hostname, UsuarioWindowsActual = @usuarioWindows
      WHERE IdMaeEquipo = @idEquipo
    `);
  },

  async registrar(trx, data) {
    await exec(trx, {
      idEquipo: data.idEquipo,
      idMovEquipoAsignacion: data.idMovEquipoAsignacion ?? null,
      idTipoConfiguracion: data.idTipoConfiguracion ?? null,
      hostnameAnterior: data.hostnameAnterior ?? null,
      hostnameNuevo: data.hostnameNuevo ?? null,
      usuarioAnterior: data.usuarioAnterior ?? null,
      usuarioNuevo: data.usuarioNuevo ?? null,
      idUsuario: data.idUsuario ?? null,
      obs: data.obs ?? null,
    }, `
      INSERT INTO Tab_EQ_MovConfiguraciones
        (IdMaeEquipo, IdMovEquipoAsignacion, IdTipodeConfiguracion,
         HostnameAnterior, HostnameNuevo, UsuarioWindowsAnterior, UsuarioWindowsNuevo,
         FecRegistro, IdUsuarioCrea, Obs, Estado)
      VALUES
        (@idEquipo, @idMovEquipoAsignacion, @idTipoConfiguracion,
         @hostnameAnterior, @hostnameNuevo, @usuarioAnterior, @usuarioNuevo,
         GETDATE(), @idUsuario, @obs, 'ACTIVO')
    `);
  },
};