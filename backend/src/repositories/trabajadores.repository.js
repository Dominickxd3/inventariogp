import { query, execute } from '../config/db.js';

const DB = 'InventarioGP';

export const TrabajadoresRepository = {
  async search(filtros = {}) {
    const page = Math.max(1, parseInt(filtros.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(filtros.pageSize) || 50));
    const offset = (page - 1) * pageSize;

    let where = 'WHERE 1=1';
    const params = {};
    if (filtros.search) {
      where += ' AND (DOI LIKE @search OR Trabajador LIKE @search)';
      params.search = `%${filtros.search}%`;
    }
    if (filtros.area) {
      where += ' AND t.Area = @area';
      params.area = filtros.area;
    }
    if (filtros.activos !== 'false') { where += ' AND t.Activo = @activo'; params.activo = '1'; }

    const joinAsig = 'LEFT JOIN Tab_EQ_MovEquiposAsignaciones a ON t.IdTrabajador = a.IdReferente AND a.Estado = \'VIGENTE\'';

    const countSql = `SELECT COUNT(DISTINCT t.IdTrabajador) as total FROM Tab_EQ_Trabajadores t ${joinAsig} ${where}`;
    const [{ total }] = await query(DB, countSql, params);

    const dataSql = `
      SELECT DISTINCT t.IdTrabajador, t.IdTrabajadorERP, t.DOI, t.Trabajador, t.Ocupacion, t.Area, t.Activo,
        CASE WHEN a.IdMaeEquipo IS NOT NULL THEN 1 ELSE 0 END as ConEquipos
      FROM Tab_EQ_Trabajadores t
      ${joinAsig}
      ${where}
      ORDER BY t.Trabajador
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `;
    params.offset = offset;
    params.pageSize = pageSize;
    const rows = await query(DB, dataSql, params);

    return { rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async getStats() {
    const [stats] = await query(DB, `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN tiene_asig = 1 THEN 1 ELSE 0 END) as con_equipos,
        SUM(CASE WHEN tiene_asig = 0 THEN 1 ELSE 0 END) as sin_equipos
      FROM (
        SELECT DISTINCT t.IdTrabajador,
          CASE WHEN a.IdMaeEquipo IS NOT NULL THEN 1 ELSE 0 END as tiene_asig
        FROM Tab_EQ_Trabajadores t
        LEFT JOIN Tab_EQ_MovEquiposAsignaciones a ON t.IdTrabajador = a.IdReferente AND a.Estado = 'VIGENTE'
        WHERE t.Activo = '1'
      ) sub
    `);
    return stats;
  },

  async getAreas() {
    return query(DB, `
      SELECT DISTINCT Area FROM Tab_EQ_Trabajadores
      WHERE Area IS NOT NULL AND Area != '' AND Activo = @activo
      ORDER BY Area
    `, { activo: '1' });
  },

  async getById(id) {
    const rows = await query(DB, `
      SELECT IdTrabajador, IdTrabajadorERP, DOI, Trabajador, Ocupacion, Area, Activo
      FROM Tab_EQ_Trabajadores WHERE IdTrabajador = @id
    `, { id });
    return rows[0] || null;
  },

  async getByDNI(dni) {
    const rows = await query(DB, `
      SELECT IdTrabajador, IdTrabajadorERP, DOI, Trabajador, Ocupacion, Area, Activo
      FROM Tab_EQ_Trabajadores WHERE DOI = @dni
    `, { dni });
    return rows[0] || null;
  },

  async sync() {
    await execute(DB, 'sp_sync_trabajadores_erp');
    return { success: true, message: 'Trabajadores sincronizados' };
  },
};
