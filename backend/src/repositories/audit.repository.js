import { query } from '../config/db.js';

const DB = 'InventarioGP';

export const AuditRepository = {
  async registrarIntento({ userLogon, exitoso, ip, userAgent, mensaje }) {
    await query(DB, `
      INSERT INTO Tab_SYS_LoginAudit (User_Logon, Exitoso, DireccionIP, UserAgent, Mensaje)
      VALUES (@logon, @exitoso, @ip, @userAgent, @mensaje)
    `, {
      logon: userLogon,
      exitoso: exitoso ? 1 : 0,
      ip: ip || null,
      userAgent: userAgent || null,
      mensaje: mensaje || null,
    });
  },

  async ultimosIntentos(limite = 50) {
    return query(DB, `
      SELECT TOP (@limite) IdAudit, User_Logon, FechaIntento, Exitoso, DireccionIP, UserAgent, Mensaje
      FROM Tab_SYS_LoginAudit
      ORDER BY FechaIntento DESC
    `, { limite });
  },

  async intentosPorUsuario(userLogon, limite = 20) {
    return query(DB, `
      SELECT TOP (@limite) IdAudit, User_Logon, FechaIntento, Exitoso, DireccionIP, UserAgent, Mensaje
      FROM Tab_SYS_LoginAudit
      WHERE User_Logon = @logon
      ORDER BY FechaIntento DESC
    `, { logon: userLogon, limite });
  },
};
