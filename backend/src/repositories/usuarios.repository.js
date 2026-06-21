import { query, execute } from '../config/db.js';

const DB = 'InventarioGP';

export const UsuariosRepository = {
  async validarLogin(userLogon, password) {
    const rows = await execute(DB, 'sp_validar_login', { User_Logon: userLogon, Password: password });
    return rows[0] || null;
  },

  async getByLogon(userLogon) {
    const rows = await query(DB, `
      SELECT IdUsuario, User_Logon, User_Fullname, User_Email, SwAcceso, Rol, FecUltimoAcceso
      FROM Tab_SYS_Usuarios WHERE User_Logon = @logon
    `, { logon: userLogon });
    return rows[0] || null;
  },

  async getById(id) {
    const rows = await query(DB, `
      SELECT IdUsuario, User_Logon, User_Fullname, User_Email, Rol, SwAcceso, FecCreacion, FecUltimoAcceso
      FROM Tab_SYS_Usuarios WHERE IdUsuario = @id
    `, { id });
    return rows[0] || null;
  },

  async updateUltimoAcceso(id) {
    await query(DB, 'UPDATE Tab_SYS_Usuarios SET FecUltimoAcceso = GETDATE() WHERE IdUsuario = @id', { id });
  },
};
