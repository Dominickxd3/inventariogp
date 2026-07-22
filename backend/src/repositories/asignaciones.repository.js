import { query } from '../config/db.js';

const DB = 'InventarioGP';

export const AsignacionesRepository = {
  async listAll(filtros = {}) {
    const page = Math.max(1, parseInt(filtros.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(filtros.pageSize) || 50));
    const offset = (page - 1) * pageSize;

    let where = 'WHERE 1=1';
    const params = {};

    if (filtros.estado) { where += ' AND a.Estado = @estado'; params.estado = filtros.estado; }
    if (filtros.idEquipo) { where += ' AND a.IdMaeEquipo = @idEquipo'; params.idEquipo = filtros.idEquipo; }
    if (filtros.idTrabajador) { where += ' AND a.IdReferente = @idTrabajador'; params.idTrabajador = filtros.idTrabajador; }
    if (filtros.idTipodeEquipo) { where += ' AND e.IdTipodeEquipo = @idTipodeEquipo'; params.idTipodeEquipo = filtros.idTipodeEquipo; }
    if (filtros.fechaDesde) { where += ' AND a.FecAsignacion >= @fechaDesde'; params.fechaDesde = filtros.fechaDesde; }
    if (filtros.fechaHasta) { where += ' AND a.FecAsignacion <= @fechaHasta'; params.fechaHasta = filtros.fechaHasta; }

    const countSql = `SELECT COUNT(*) as total FROM Tab_EQ_MovEquiposAsignaciones a ${where}`;
    const [{ total }] = await query(DB, countSql, params);

    const dataSql = `
      SELECT a.*, e.CodEquipo, e.CodBarra, te.DesTipodeEquipo,
             tr.Trabajador as TrabajadorNombre, tr.DOI, tr.Area, tr.Ocupacion
      FROM Tab_EQ_MovEquiposAsignaciones a
      JOIN Tab_EQ_MaeEquipos e ON a.IdMaeEquipo = e.IdMaeEquipo
      LEFT JOIN Tab_EQ_TipodeEquipos te ON e.IdTipodeEquipo = te.IdTipodeEquipo
      LEFT JOIN Tab_EQ_Trabajadores tr ON a.IdReferente = tr.IdTrabajador
      ${where}
      ORDER BY a.FecRegistro DESC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `;
    params.offset = offset;
    params.pageSize = pageSize;
    const rows = await query(DB, dataSql, params);

    return { rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async getById(id) {
    const rows = await query(DB, `
      SELECT a.*, e.CodEquipo, e.CodBarra, t.DesTipodeEquipo,
             tr.Trabajador as TrabajadorNombre, tr.DOI, tr.Area, tr.Ocupacion
      FROM Tab_EQ_MovEquiposAsignaciones a
      JOIN Tab_EQ_MaeEquipos e ON a.IdMaeEquipo = e.IdMaeEquipo
      LEFT JOIN Tab_EQ_TipodeEquipos t ON e.IdTipodeEquipo = t.IdTipodeEquipo
      LEFT JOIN Tab_EQ_Trabajadores tr ON a.IdReferente = tr.IdTrabajador
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

  async getDetalleById(id) {
    const rows = await query(DB, `
      SELECT a.*, e.CodEquipo, e.CodBarra, e.Estado as EstadoActual,
             t.DesTipodeEquipo as TipoEquipo,
             tr.Trabajador as NombreTrabajador, tr.DOI, tr.Area, tr.Ocupacion
      FROM Tab_EQ_MovEquiposAsignaciones a
      JOIN Tab_EQ_MaeEquipos e ON a.IdMaeEquipo = e.IdMaeEquipo
      LEFT JOIN Tab_EQ_TipodeEquipos t ON e.IdTipodeEquipo = t.IdTipodeEquipo
      LEFT JOIN Tab_EQ_Trabajadores tr ON a.IdReferente = tr.IdTrabajador
      WHERE a.IdMovEquipoAsignacion = @id
    `, { id });
    return rows[0] || null;
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

  async getAccsByAsignacion(id) {
    return query(DB, `
      SELECT m.*, c.CodComponente, c.DesComponente, c.Marca, c.Modelo,
             tc.DesTipodeComponente
      FROM Tab_EQ_MovAccesoriosTrabajador m
      JOIN Tab_EQ_Componentes c ON m.IdComponente = c.IdComponente
      LEFT JOIN Tab_EQ_TipodeComponentes tc ON c.IdTipodeComponente = tc.IdTipodeComponente
      WHERE m.IdMovEquipoAsignacion = @id
      ORDER BY m.FecAsignacion DESC
    `, { id });
  },
};
