import { query } from '../config/db.js';

export const TrabajadoresRepository = {
  async search(filtros = {}) {
    let sql = `
      SELECT
        PersonalId, PeriodoId, CompanyId, CompanyName, BOId, BOName,
        SubDivisionId, NomSubDivision, Areaid, AreaName,
        DNI, CodEmpleado, APaterno, AMaterno, Nombres,
        APaterno + ' ' + AMaterno + ', ' + Nombres as NombreCompleto,
        FIngreso, Cesado, FCesado,
        IdCargo, NomCargo, Correo, Genero, Direccion, Telefono1,
        CentralId, NomCentral, GerenciaId, NomGerencia
      FROM Personal_periodo
      WHERE 1=1
    `;
    const params = {};
    if (filtros.search) {
      sql += ' AND (DNI LIKE @search OR CodEmpleado LIKE @search OR APaterno LIKE @search OR AMaterno LIKE @search OR Nombres LIKE @search)';
      params.search = `%${filtros.search}%`;
    }
    if (filtros.activos !== 'false') sql += ' AND Cesado IS NULL';
    sql += ' ORDER BY APaterno, AMaterno, Nombres';
    return query('SIGA_ASISTENCIA', sql, params);
  },

  async getById(id) {
    const rows = await query('SIGA_ASISTENCIA', `
      SELECT * FROM Personal_periodo WHERE PersonalId = @id
    `, { id });
    return rows[0] || null;
  },

  async getByDNI(dni) {
    const rows = await query('SIGA_ASISTENCIA', `
      SELECT * FROM Personal_periodo WHERE DNI = @dni
    `, { dni });
    return rows[0] || null;
  },

  async getAreas() {
    return query('SIGA_ASISTENCIA', `
      SELECT DISTINCT Areaid, AreaName FROM Personal_periodo
      WHERE AreaName IS NOT NULL ORDER BY AreaName
    `);
  },

  async getGerencias() {
    return query('SIGA_ASISTENCIA', `
      SELECT DISTINCT GerenciaId, NomGerencia FROM Personal_periodo
      WHERE NomGerencia IS NOT NULL ORDER BY NomGerencia
    `);
  },
};
