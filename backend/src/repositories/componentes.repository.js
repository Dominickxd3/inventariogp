import { query } from '../config/db.js';

const DB = 'InventarioGP';

export const ComponentesRepository = {
  async listAll(filtros = {}) {
    let sql = `
      SELECT c.*, tc.DesTipodeComponente
      FROM Tab_EQ_Componentes c
      LEFT JOIN Tab_EQ_TipodeComponentes tc ON c.IdTipodeComponente = tc.IdTipodeComponente
      WHERE 1=1
    `;
    const params = {};
    if (filtros.estado) { sql += ' AND c.Estado = @estado'; params.estado = filtros.estado; }
    if (filtros.idTipo) { sql += ' AND c.IdTipodeComponente = @idTipo'; params.idTipo = filtros.idTipo; }
    sql += ' ORDER BY c.DesComponente';
    return query(DB, sql, params);
  },

  async getById(id) {
    const rows = await query(DB, `
      SELECT c.*, tc.DesTipodeComponente
      FROM Tab_EQ_Componentes c
      LEFT JOIN Tab_EQ_TipodeComponentes tc ON c.IdTipodeComponente = tc.IdTipodeComponente
      WHERE c.IdComponente = @id
    `, { id });
    return rows[0] || null;
  },

  async create(data) {
    const result = await query(DB, `
      INSERT INTO Tab_EQ_Componentes
        (IdTipodeComponente, CodComponente, DesComponente, Marca, Modelo, Serie,
         Lote, Capacidad, Obs, Estado)
      OUTPUT INSERTED.IdComponente
      VALUES (@idTipo, @cod, @desc, @marca, @modelo, @serie, @lote, @capacidad, @obs, 'DISPONIBLE')
    `, {
      idTipo: data.IdTipodeComponente,
      cod: data.CodComponente,
      desc: data.DesComponente || null,
      marca: data.Marca || null,
      modelo: data.Modelo || null,
      serie: data.Serie || null,
      lote: data.Lote || null,
      capacidad: data.Capacidad || null,
      obs: data.Obs || null,
    });
    return result[0]?.IdComponente;
  },

  async update(id, data) {
    await query(DB, `
      UPDATE Tab_EQ_Componentes
      SET IdTipodeComponente = @idTipo, CodComponente = @cod, DesComponente = @desc,
          Marca = @marca, Modelo = @modelo, Serie = @serie, Lote = @lote,
          Capacidad = @capacidad, Obs = @obs, Estado = @estado
      WHERE IdComponente = @id
    `, {
      id,
      idTipo: data.IdTipodeComponente,
      cod: data.CodComponente,
      desc: data.DesComponente,
      marca: data.Marca,
      modelo: data.Modelo,
      serie: data.Serie,
      lote: data.Lote,
      capacidad: data.Capacidad,
      obs: data.Obs,
      estado: data.Estado,
    });
  },

  async listTipos() {
    return query(DB, "SELECT * FROM Tab_EQ_TipodeComponentes WHERE Estado = 'ACTIVO' ORDER BY DesTipodeComponente");
  },

  async createTipo(data) {
    const result = await query(DB, `
      INSERT INTO Tab_EQ_TipodeComponentes (CodTipodeComponente, DesTipodeComponente, Estado)
      OUTPUT INSERTED.IdTipodeComponente
      VALUES (@cod, @desc, 'ACTIVO')
    `, { cod: data.CodTipodeComponente || 'GEN', desc: data.DesTipodeComponente });
    return result[0]?.IdTipodeComponente;
  },

  // Componentes asignados a un equipo
  async getByEquipo(idEquipo) {
    return query(DB, `
      SELECT mc.*, c.CodComponente, c.DesComponente, c.Marca, c.Modelo, c.Serie,
             tc.DesTipodeComponente
      FROM Tab_EQ_MovEquiposComponentes mc
      JOIN Tab_EQ_Componentes c ON mc.IdComponente = c.IdComponente
      LEFT JOIN Tab_EQ_TipodeComponentes tc ON c.IdTipodeComponente = tc.IdTipodeComponente
      WHERE mc.IdMaeEquipo = @id AND mc.Estado = 'VIGENTE'
    `, { id: idEquipo });
  },

  async asignarAEquipo(idEquipo, idComponente, obs) {
    const result = await query(DB, `
      INSERT INTO Tab_EQ_MovEquiposComponentes (IdMaeEquipo, IdComponente, Obs, Estado)
      OUTPUT INSERTED.IdMovEquipoComponente
      VALUES (@idEquipo, @idComponente, @obs, 'VIGENTE')
    `, {
      idEquipo,
      idComponente,
      obs: obs || null,
    });
    await query(DB, "UPDATE Tab_EQ_Componentes SET Estado = 'ASIGNADO' WHERE IdComponente = @id", { id: idComponente });
    return result[0]?.IdMovEquipoComponente;
  },

  async desasignarDeEquipo(idMov) {
    const comp = await query(DB, 'SELECT IdComponente FROM Tab_EQ_MovEquiposComponentes WHERE IdMovEquipoComponente = @id', { id: idMov });
    await query(DB, "UPDATE Tab_EQ_MovEquiposComponentes SET Estado = 'BAJA', FecBajaComponente = GETDATE() WHERE IdMovEquipoComponente = @id", { id: idMov });
    if (comp[0]) {
      await query(DB, "UPDATE Tab_EQ_Componentes SET Estado = 'DISPONIBLE' WHERE IdComponente = @id", { id: comp[0].IdComponente });
    }
  },

  async listAccesoriosPorTrabajador(idTrabajador) {
    return query(DB, `
      SELECT m.*, c.CodComponente, c.DesComponente, c.Marca, c.Modelo, c.Serie,
             tc.DesTipodeComponente
      FROM Tab_EQ_MovAccesoriosTrabajador m
      JOIN Tab_EQ_Componentes c ON m.IdComponente = c.IdComponente
      LEFT JOIN Tab_EQ_TipodeComponentes tc ON c.IdTipodeComponente = tc.IdTipodeComponente
      WHERE m.IdReferente = @id AND m.Estado = 'VIGENTE'
      ORDER BY m.FecAsignacion DESC
    `, { id: idTrabajador });
  },

  async asignarAccesorioATrabajador(data) {
    const result = await query(DB, `
      INSERT INTO Tab_EQ_MovAccesoriosTrabajador
        (IdComponente, IdReferente, FecAsignacion, Obs, Estado, IdUsuarioCrea)
      OUTPUT INSERTED.IdMovAccesorio
      VALUES (@idComponente, @idTrabajador, @fec, @obs, 'VIGENTE', @idUsuario)
    `, {
      idComponente: data.IdComponente,
      idTrabajador: data.IdReferente,
      fec: data.FecAsignacion || new Date().toISOString().split('T')[0],
      obs: data.Obs || null,
      idUsuario: data.IdUsuario || null,
    });
    await query(DB, "UPDATE Tab_EQ_Componentes SET Estado = 'ASIGNADO' WHERE IdComponente = @id", { id: data.IdComponente });
    return result[0]?.IdMovAccesorio;
  },

  async cesarAccesorioATrabajador(idMov) {
    const comp = await query(DB, 'SELECT IdComponente FROM Tab_EQ_MovAccesoriosTrabajador WHERE IdMovAccesorio = @id', { id: idMov });
    await query(DB, "UPDATE Tab_EQ_MovAccesoriosTrabajador SET Estado = 'CESADO', FecCese = GETDATE() WHERE IdMovAccesorio = @id", { id: idMov });
    if (comp[0]) {
      await query(DB, "UPDATE Tab_EQ_Componentes SET Estado = 'DISPONIBLE' WHERE IdComponente = @id", { id: comp[0].IdComponente });
    }
  },
};
