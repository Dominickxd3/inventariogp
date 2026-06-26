import { query, withTransaction, createRequest } from '../config/db.js';

const DB = 'InventarioGP';

export const ComponentesRepository = {
  async listAll(filtros = {}) {
    let sql = `
      SELECT c.*, tc.DesTipodeComponente, tc.Categoria
      FROM Tab_EQ_Componentes c
      LEFT JOIN Tab_EQ_TipodeComponentes tc ON c.IdTipodeComponente = tc.IdTipodeComponente
      WHERE 1=1
    `;
    const params = {};
    if (filtros.estado) { sql += ' AND c.Estado = @estado'; params.estado = filtros.estado; }
    if (filtros.categoria) { sql += ' AND tc.Categoria = @categoria'; params.categoria = filtros.categoria; }
    if (filtros.idTipo) { sql += ' AND c.IdTipodeComponente = @idTipo'; params.idTipo = filtros.idTipo; }
    if (filtros.search) { sql += " AND (c.CodComponente LIKE @search OR c.DesComponente LIKE @search OR c.Marca LIKE @search OR c.Modelo LIKE @search OR c.Serie LIKE @search OR c.Capacidad LIKE @search)"; params.search = `%${filtros.search}%`; }
    sql += ' ORDER BY c.DesComponente';
    return query(DB, sql, params);
  },

  async getById(id) {
    const rows = await query(DB, `
      SELECT c.*, tc.DesTipodeComponente, tc.Categoria
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
      SET IdTipodeComponente = @idTipo, DesComponente = @desc,
          Marca = @marca, Modelo = @modelo, Serie = @serie, Lote = @lote,
          Capacidad = @capacidad, Obs = @obs
      WHERE IdComponente = @id
    `, {
      id,
      idTipo: data.IdTipodeComponente,
      desc: data.DesComponente,
      marca: data.Marca,
      modelo: data.Modelo,
      serie: data.Serie,
      lote: data.Lote,
      capacidad: data.Capacidad,
      obs: data.Obs,
    });
  },

  async listTipos() {
    return query(DB, "SELECT *, COALESCE(Categoria, 'OTRO') AS Categoria FROM Tab_EQ_TipodeComponentes WHERE Estado = 'ACTIVO' ORDER BY DesTipodeComponente");
  },

  async getTipoById(id) {
    const rows = await query(DB, "SELECT *, COALESCE(Categoria, 'OTRO') AS Categoria FROM Tab_EQ_TipodeComponentes WHERE IdTipodeComponente = @id", { id });
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

  async listAccDisponibles() {
    return query(DB, `
      SELECT c.*, tc.DesTipodeComponente
      FROM Tab_EQ_Componentes c
      JOIN Tab_EQ_TipodeComponentes tc ON c.IdTipodeComponente = tc.IdTipodeComponente
      WHERE c.Estado = 'DISPONIBLE' AND tc.Categoria = 'ACCESORIO'
      ORDER BY tc.DesTipodeComponente, c.CodComponente
    `);
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
      const trxRows = async (sqlText, params = {}) => {
        const r = await createRequest(trx, params).query(sqlText);
        return r.recordset || [];
      };
      const trxExec = async (sqlText, params = {}) => {
        await createRequest(trx, params).query(sqlText);
      };

      const eq = await trxRows('SELECT IdMaeEquipo FROM Tab_EQ_MaeEquipos WHERE IdMaeEquipo = @id', { id: idEquipo });
      if (!eq.length) throw new Error('El equipo no existe');

      const comp = await trxRows('SELECT IdComponente, Estado FROM Tab_EQ_Componentes WHERE IdComponente = @id', { id: idComponente });
      if (!comp.length) throw new Error('El componente no existe');
      if (comp[0].Estado !== 'DISPONIBLE') throw new Error('El componente no está disponible');

      const vigente = await trxRows(`
        SELECT TOP 1 IdMovEquipoComponente, IdMaeEquipo
        FROM Tab_EQ_MovEquiposComponentes
        WHERE IdComponente = @idComponente AND Estado = 'VIGENTE'
        ORDER BY IdMovEquipoComponente DESC
      `, { idComponente });
      if (vigente.length > 0) {
        throw new Error('El componente ya está vinculado a otro equipo');
      }

      const insertResult = await trxRows(`
        INSERT INTO Tab_EQ_MovEquiposComponentes
          (IdMaeEquipo, IdComponente, FecAsigComponente, Obs, Estado, OrigenVinculo, Motivo, FecInstalacion, IdIntervencion)
        OUTPUT INSERTED.IdMovEquipoComponente
        VALUES (@idEquipo, @idComponente, GETDATE(), @obs, 'VIGENTE', @origenVinculo, @motivo, GETDATE(), @idIntervencion)
      `, {
        idEquipo,
        idComponente,
        obs: obs || null,
        origenVinculo: origenVinculo || null,
        motivo: motivo || null,
        idIntervencion: idIntervencion || null,
      });

      await trxExec(`UPDATE Tab_EQ_Componentes SET Estado = 'ASIGNADO' WHERE IdComponente = @id`, { id: idComponente });

      return insertResult[0]?.IdMovEquipoComponente;
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

  async baja(id) {
    await query(DB, "UPDATE Tab_EQ_Componentes SET Estado = 'BAJA' WHERE IdComponente = @id", { id });
  },

  async getUsoActual(idComponente) {
    const enEquipo = await query(DB, `
      SELECT TOP 1 e.IdMaeEquipo, e.CodEquipo, e.CodBarra,
             mc.IdMovEquipoComponente, mc.FecAsigComponente, mc.Estado AS RelEstado
      FROM Tab_EQ_MovEquiposComponentes mc
      JOIN Tab_EQ_MaeEquipos e ON mc.IdMaeEquipo = e.IdMaeEquipo
      WHERE mc.IdComponente = @id AND mc.Estado = 'VIGENTE'
      ORDER BY mc.IdMovEquipoComponente DESC
    `, { id: idComponente });
    if (enEquipo.length) return { tipo: 'EQUIPO', detalle: enEquipo[0] };

    const enTrabajador = await query(DB, `
      SELECT TOP 1 t.IdTrabajador, t.Trabajador AS NombreTrabajador,
             m.IdMovAccesorio, m.FecAsignacion
      FROM Tab_EQ_MovAccesoriosTrabajador m
      JOIN Tab_EQ_Trabajadores t ON m.IdReferente = t.IdTrabajador
      WHERE m.IdComponente = @id AND m.Estado = 'VIGENTE'
      ORDER BY m.IdMovAccesorio DESC
    `, { id: idComponente });
    if (enTrabajador.length) return { tipo: 'TRABAJADOR', detalle: enTrabajador[0] };

    return null;
  },

  async getTimeline(idComponente) {
    const movEquipos = await query(DB, `
      SELECT 'EQUIPO' AS Tipo, mc.IdMovEquipoComponente AS IdMov,
             mc.FecAsigComponente AS FechaInicio, mc.FecBajaComponente AS FechaFin,
             mc.Estado, mc.Obs, mc.Motivo, mc.OrigenVinculo,
             e.CodEquipo, e.CodBarra AS DesEquipo
      FROM Tab_EQ_MovEquiposComponentes mc
      JOIN Tab_EQ_MaeEquipos e ON mc.IdMaeEquipo = e.IdMaeEquipo
      WHERE mc.IdComponente = @id
      ORDER BY mc.FecAsigComponente DESC
    `, { id: idComponente });

    const movAcc = await query(DB, `
      SELECT 'TRABAJADOR' AS Tipo, m.IdMovAccesorio AS IdMov,
             m.FecAsignacion AS FechaInicio, m.FecCese AS FechaFin,
             m.Estado, m.Obs, NULL AS Motivo, NULL AS OrigenVinculo,
             NULL AS CodEquipo, t.Trabajador AS DesEquipo
      FROM Tab_EQ_MovAccesoriosTrabajador m
      JOIN Tab_EQ_Trabajadores t ON m.IdReferente = t.IdTrabajador
      WHERE m.IdComponente = @id
      ORDER BY m.FecAsignacion DESC
    `, { id: idComponente });

    return [...movEquipos, ...movAcc].sort((a, b) => {
      const da = a.FechaInicio ? new Date(a.FechaInicio) : new Date(0);
      const db = b.FechaInicio ? new Date(b.FechaInicio) : new Date(0);
      return db - da;
    });
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
