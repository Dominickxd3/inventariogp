import { query } from '../config/db.js';

const DB = 'InventarioGP';

export const EquiposRepository = {
  async listAll(filtros = {}) {
    let sql = `
      SELECT e.*, t.DesTipodeEquipo
      FROM Tab_EQ_MaeEquipos e
      LEFT JOIN Tab_EQ_TipodeEquipos t ON e.IdTipodeEquipo = t.IdTipodeEquipo
      WHERE 1=1
    `;
    const params = {};
    if (filtros.estado) { sql += ' AND e.Estado = @estado'; params.estado = filtros.estado; }
    if (filtros.idTipo) { sql += ' AND e.IdTipodeEquipo = @idTipo'; params.idTipo = filtros.idTipo; }
    if (filtros.search) { sql += " AND (e.CodEquipo LIKE @search OR e.CodBarra LIKE @search)"; params.search = `%${filtros.search}%`; }
    sql += ' ORDER BY e.FecCreacion DESC';
    return query(DB, sql, params);
  },

  async getById(id) {
    const rows = await query(DB, `
      SELECT e.*, t.DesTipodeEquipo
      FROM Tab_EQ_MaeEquipos e
      LEFT JOIN Tab_EQ_TipodeEquipos t ON e.IdTipodeEquipo = t.IdTipodeEquipo
      WHERE e.IdMaeEquipo = @id
    `, { id });
    return rows[0] || null;
  },

  async getByCodigo(codBarra) {
    const rows = await query(DB, `
      SELECT e.*, t.DesTipodeEquipo
      FROM Tab_EQ_MaeEquipos e
      LEFT JOIN Tab_EQ_TipodeEquipos t ON e.IdTipodeEquipo = t.IdTipodeEquipo
      WHERE e.CodBarra = @codBarra
    `, { codBarra });
    return rows[0] || null;
  },

  async create(data) {
    const result = await query(DB, `
      INSERT INTO Tab_EQ_MaeEquipos (CodEquipo, IdTipodeEquipo, CodBarra, Obs, Estado)
      OUTPUT INSERTED.IdMaeEquipo
      VALUES (@codEquipo, @idTipo, @codBarra, @obs, @estado)
    `, {
      codEquipo: data.CodEquipo,
      idTipo: data.IdTipodeEquipo,
      codBarra: data.CodBarra || null,
      obs: data.Obs || null,
      estado: data.Estado || 'DISPONIBLE',
    });
    return result[0]?.IdMaeEquipo;
  },

  async update(id, data) {
    await query(DB, `
      UPDATE Tab_EQ_MaeEquipos
      SET CodEquipo = @codEquipo, IdTipodeEquipo = @idTipo, CodBarra = @codBarra,
          Obs = @obs, Estado = @estado
      WHERE IdMaeEquipo = @id
    `, {
      id,
      codEquipo: data.CodEquipo,
      idTipo: data.IdTipodeEquipo,
      codBarra: data.CodBarra,
      obs: data.Obs,
      estado: data.Estado,
    });
  },

  async updateEstado(id, estado) {
    await query(DB, 'UPDATE Tab_EQ_MaeEquipos SET Estado = @estado WHERE IdMaeEquipo = @id', { id, estado });
  },

  async delete(id) {
    await query(DB, 'DELETE FROM Tab_EQ_MaeEquipos WHERE IdMaeEquipo = @id', { id });
  },

  // Tipos de equipo
  async listTipos() {
    return query(DB, "SELECT * FROM Tab_EQ_TipodeEquipos WHERE Estado = 'ACTIVO' ORDER BY DesTipodeEquipo");
  },

  async createTipo(data) {
    const result = await query(DB, `
      INSERT INTO Tab_EQ_TipodeEquipos (CodTipodeEquipo, DesTipodeEquipo, Estado)
      OUTPUT INSERTED.IdTipodeEquipo
      VALUES (@cod, @desc, 'ACTIVO')
    `, { cod: data.CodTipodeEquipo || 'GEN', desc: data.DesTipodeEquipo });
    return result[0]?.IdTipodeEquipo;
  },

  async registrarCambioEstado(idEquipo, estadoAnterior, estadoNuevo, idUsuario, obs) {
    await query(DB, `
      INSERT INTO Tab_EQ_MovEstadosEquipos
        (IdMaeEquipo, EstadoAnterior, EstadoNuevo, IdUsuario, Obs)
      VALUES (@idEquipo, @estadoAnterior, @estadoNuevo, @idUsuario, @obs)
    `, {
      idEquipo,
      estadoAnterior,
      estadoNuevo,
      idUsuario: idUsuario || null,
      obs: obs || null,
    });
  },

  async getHistorialEstados(idEquipo) {
    return query(DB, `
      SELECT e.*, u.NombreUsuario
      FROM Tab_EQ_MovEstadosEquipos e
      LEFT JOIN Tab_SYS_Usuarios u ON e.IdUsuario = u.IdUsuario
      WHERE e.IdMaeEquipo = @id
      ORDER BY e.FecCambio DESC
    `, { id: idEquipo });
  },
};
