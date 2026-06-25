import { query, withTransaction, createRequest } from '../config/db.js';

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
    if (filtros.search) { sql += " AND (c.CodComponente LIKE @search OR c.DesComponente LIKE @search OR c.Marca LIKE @search OR c.Modelo LIKE @search OR c.Serie LIKE @search OR c.Capacidad LIKE @search)"; params.search = `%${filtros.search}%`; }
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

  async getTipoById(id) {
    const rows = await query(DB, 'SELECT * FROM Tab_EQ_TipodeComponentes WHERE IdTipodeComponente = @id', { id });
    return rows[0] || null;
  },

  async getBySerie(serie) {
    const rows = await query(DB, `
      SELECT TOP 1 *
      FROM Tab_EQ_Componentes
      WHERE LTRIM(RTRIM(Serie)) = LTRIM(RTRIM(@serie))
    `, { serie });
    return rows[0] || null;
  },

  async getLastCodComponenteByPrefix(prefix) {
    const rows = await query(DB, `
      SELECT TOP 1 CodComponente FROM Tab_EQ_Componentes
      WHERE CodComponente LIKE @prefix + '-%'
      ORDER BY LEN(CodComponente) DESC, CodComponente DESC
    `, { prefix });
    return rows[0]?.CodComponente || null;
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
      ORDER BY mc.IdMovEquipoComponente DESC
    `, { id: idEquipo });
  },

  async getRelacionVigenteByComponente(idComponente) {
    const rows = await query(DB, `
      SELECT TOP 1 *
      FROM Tab_EQ_MovEquiposComponentes
      WHERE IdComponente = @idComponente AND Estado = 'VIGENTE'
      ORDER BY IdMovEquipoComponente DESC
    `, { idComponente });
    return rows[0] || null;
  },

  async asignarAEquipo(idEquipo, idComponente, obs, origenVinculo, motivo, idIntervencion) {
    return withTransaction(DB, async (trx) => {
      const req = (params) => createRequest(trx, params);
      const vigente = await req({ idComponente }).query(`
        SELECT TOP 1 IdMovEquipoComponente, IdMaeEquipo
        FROM Tab_EQ_MovEquiposComponentes
        WHERE IdComponente = @idComponente AND Estado = 'VIGENTE'
        ORDER BY IdMovEquipoComponente DESC
      `);
      if (vigente.length > 0) {
        throw new Error('El componente ya está vinculado a otro equipo');
      }

      const result = await req({
        idEquipo,
        idComponente,
        obs: obs || null,
        origenVinculo: origenVinculo || null,
        motivo: motivo || null,
        idIntervencion: idIntervencion || null,
      }).query(`
        INSERT INTO Tab_EQ_MovEquiposComponentes
          (IdMaeEquipo, IdComponente, FecAsigComponente, Obs, Estado, OrigenVinculo, Motivo, FecInstalacion, IdIntervencion)
        OUTPUT INSERTED.IdMovEquipoComponente
        VALUES (@idEquipo, @idComponente, GETDATE(), @obs, 'VIGENTE', @origenVinculo, @motivo, GETDATE(), @idIntervencion)
      `);

      await req({ id: idComponente }).query(`
        UPDATE Tab_EQ_Componentes
        SET Estado = 'ASIGNADO'
        WHERE IdComponente = @id
      `);

      return result[0]?.IdMovEquipoComponente;
    });
  },

  async desasignarDeEquipo(idMov, motivo, nuevoEstado) {
    const comp = await query(DB, 'SELECT IdComponente FROM Tab_EQ_MovEquiposComponentes WHERE IdMovEquipoComponente = @id', { id: idMov });
    await query(DB, "UPDATE Tab_EQ_MovEquiposComponentes SET Estado = 'BAJA', FecBajaComponente = GETDATE(), Motivo = @motivo WHERE IdMovEquipoComponente = @id", { id: idMov, motivo: motivo || null });
    if (comp[0]) {
      await query(DB, "UPDATE Tab_EQ_Componentes SET Estado = @estado WHERE IdComponente = @id", {
        id: comp[0].IdComponente,
        estado: nuevoEstado || 'DISPONIBLE',
      });
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
