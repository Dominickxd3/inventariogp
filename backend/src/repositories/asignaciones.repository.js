import { query } from '../config/db.js';

const DB = 'InventarioGP';

export const AsignacionesRepository = {
  async listAll(filtros = {}) {
    let sql = `
      SELECT a.*, e.CodEquipo, e.CodBarra, te.DesTipodeEquipo,
             tr.Trabajador as TrabajadorNombre, tr.DOI, tr.Area, tr.Ocupacion
      FROM Tab_EQ_MovEquiposAsignaciones a
      JOIN Tab_EQ_MaeEquipos e ON a.IdMaeEquipo = e.IdMaeEquipo
      LEFT JOIN Tab_EQ_TipodeEquipos te ON e.IdTipodeEquipo = te.IdTipodeEquipo
      LEFT JOIN Tab_EQ_Trabajadores tr ON a.IdReferente = tr.IdTrabajador
      WHERE 1=1
    `;
    const params = {};
    if (filtros.estado) { sql += ' AND a.Estado = @estado'; params.estado = filtros.estado; }
    if (filtros.idEquipo) { sql += ' AND a.IdMaeEquipo = @idEquipo'; params.idEquipo = filtros.idEquipo; }
    if (filtros.idTrabajador) { sql += ' AND a.IdReferente = @idTrabajador'; params.idTrabajador = filtros.idTrabajador; }
    sql += ' ORDER BY a.FecRegistro DESC';
    return query(DB, sql, params);
  },

  async getById(id) {
    const rows = await query(DB, `
      SELECT a.*, e.CodEquipo, e.CodBarra, t.DesTipodeEquipo
      FROM Tab_EQ_MovEquiposAsignaciones a
      JOIN Tab_EQ_MaeEquipos e ON a.IdMaeEquipo = e.IdMaeEquipo
      LEFT JOIN Tab_EQ_TipodeEquipos t ON e.IdTipodeEquipo = t.IdTipodeEquipo
      WHERE a.IdMovEquipoAsignacion = @id
    `, { id });
    return rows[0] || null;
  },

  async getActivaByEquipo(idEquipo) {
    const rows = await query(DB, `
      SELECT a.*, tr.Trabajador as TrabajadorNombre, tr.DOI, tr.Area, tr.Ocupacion
      FROM Tab_EQ_MovEquiposAsignaciones a
      LEFT JOIN Tab_EQ_Trabajadores tr ON a.IdReferente = tr.IdTrabajador
      WHERE a.IdMaeEquipo = @id AND a.Estado = 'VIGENTE'
    `, { id: idEquipo });
    return rows[0] || null;
  },

  async getHistorialByEquipo(idEquipo) {
    return query(DB, `
      SELECT a.*, tr.Trabajador as TrabajadorNombre, tr.DOI
      FROM Tab_EQ_MovEquiposAsignaciones a
      LEFT JOIN Tab_EQ_Trabajadores tr ON a.IdReferente = tr.IdTrabajador
      WHERE a.IdMaeEquipo = @id
      ORDER BY a.FecRegistro DESC
    `, { id: idEquipo });
  },

  async getHistorialByTrabajador(idTrabajador) {
    return query(DB, `
      SELECT a.*, e.CodEquipo, e.CodBarra, t.DesTipodeEquipo,
             tr.Trabajador as TrabajadorNombre
      FROM Tab_EQ_MovEquiposAsignaciones a
      JOIN Tab_EQ_MaeEquipos e ON a.IdMaeEquipo = e.IdMaeEquipo
      LEFT JOIN Tab_EQ_TipodeEquipos t ON e.IdTipodeEquipo = t.IdTipodeEquipo
      LEFT JOIN Tab_EQ_Trabajadores tr ON a.IdReferente = tr.IdTrabajador
      WHERE a.IdReferente = @id
      ORDER BY a.FecRegistro DESC
    `, { id: idTrabajador });
  },

  async getActivasByTrabajador(idTrabajador) {
    return query(DB, `
      SELECT a.*, e.CodEquipo, e.CodBarra, t.DesTipodeEquipo,
             tr.Trabajador as TrabajadorNombre
      FROM Tab_EQ_MovEquiposAsignaciones a
      JOIN Tab_EQ_MaeEquipos e ON a.IdMaeEquipo = e.IdMaeEquipo
      LEFT JOIN Tab_EQ_TipodeEquipos t ON e.IdTipodeEquipo = t.IdTipodeEquipo
      LEFT JOIN Tab_EQ_Trabajadores tr ON a.IdReferente = tr.IdTrabajador
      WHERE a.IdReferente = @id AND a.Estado = 'VIGENTE'
      ORDER BY t.DesTipodeEquipo, e.CodEquipo
    `, { id: idTrabajador });
  },

  async cesarActivasByTrabajador(idTrabajador) {
    const ids = await query(DB, `
      SELECT IdMovEquipoAsignacion FROM Tab_EQ_MovEquiposAsignaciones
      WHERE IdReferente = @id AND Estado = 'VIGENTE'
    `, { id: idTrabajador });
    for (const row of ids) {
      await this.cesar(row.IdMovEquipoAsignacion);
    }
    return ids;
  },

  async asignar(data) {
    const result = await query(DB, `
      INSERT INTO Tab_EQ_MovEquiposAsignaciones
        (IdMaeEquipo, IdReferente, FecAsignacion, Obs, Estado)
      OUTPUT INSERTED.IdMovEquipoAsignacion
      VALUES (@idEquipo, @idTrabajador, @fec, @obs, 'VIGENTE')
    `, {
      idEquipo: data.IdMaeEquipo,
      idTrabajador: data.IdReferente,
      fec: data.FecAsignacion || new Date().toISOString().split('T')[0],
      obs: data.Obs || null,
    });
    return result[0]?.IdMovEquipoAsignacion;
  },

  async cesar(id) {
    await query(DB, `
      UPDATE Tab_EQ_MovEquiposAsignaciones
      SET Estado = 'CESADO', FecCese = GETDATE()
      WHERE IdMovEquipoAsignacion = @id
    `, { id });
  },

  async cesarActivoByEquipo(idEquipo, fecCese) {
    await query(DB, `
      UPDATE Tab_EQ_MovEquiposAsignaciones
      SET Estado = 'CESADO', FecCese = @fec
      WHERE IdMaeEquipo = @id AND Estado = 'VIGENTE'
    `, { id: idEquipo, fec: fecCese || new Date().toISOString().split('T')[0] });
  },
};
