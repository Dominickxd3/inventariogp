import { query } from '../config/db.js';

const DB = 'InventarioGP';

export const UsuariosRepository = {
  async getByNombreUsuario(nombreUsuario) {
    const rows = await query(DB, `
      SELECT * FROM Tab_SYS_Usuarios WHERE NombreUsuario = @nombre
    `, { nombre: nombreUsuario });
    return rows[0] || null;
  },

  async getById(id) {
    const rows = await query(DB, `
      SELECT IdUsuario, NombreUsuario, Correo, Rol, Estado, FecCreacion, FecUltimoAcceso
      FROM Tab_SYS_Usuarios WHERE IdUsuario = @id
    `, { id });
    return rows[0] || null;
  },

  async listAll() {
    return query(DB, `
      SELECT IdUsuario, NombreUsuario, Correo, Rol, Estado, FecCreacion, FecUltimoAcceso
      FROM Tab_SYS_Usuarios ORDER BY NombreUsuario
    `);
  },

  async create(data) {
    const result = await query(DB, `
      INSERT INTO Tab_SYS_Usuarios (NombreUsuario, Correo, PasswordHash, Rol, IdPersonal)
      OUTPUT INSERTED.IdUsuario
      VALUES (@nombre, @correo, @hash, @rol, @idPersonal)
    `, {
      nombre: data.NombreUsuario,
      correo: data.Correo || null,
      hash: data.PasswordHash,
      rol: data.Rol || 'TECNICO',
      idPersonal: data.IdPersonal || null,
    });
    return result[0]?.IdUsuario;
  },

  async updateUltimoAcceso(id) {
    await query(DB, 'UPDATE Tab_SYS_Usuarios SET FecUltimoAcceso = GETDATE() WHERE IdUsuario = @id', { id });
  },
};
