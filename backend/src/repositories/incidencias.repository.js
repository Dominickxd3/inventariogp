import { query } from '../config/db.js';

const DB = 'InventarioGP';

export const IncidenciasRepository = {
  async listAll(filtros = {}) {
    let sql = `
      SELECT i.*, e.CodEquipo, e.CodBarra, t.DesTipodeEquipo,
             p.DNI, p.APaterno + ' ' + p.AMaterno + ', ' + p.Nombres as Trabajador
      FROM Tab_EQ_Incidencias i
      JOIN Tab_EQ_MaeEquipos e ON i.IdMaeEquipo = e.IdMaeEquipo
      LEFT JOIN Tab_EQ_TipodeEquipos t ON e.IdTipodeEquipo = t.IdTipodeEquipo
      LEFT JOIN SIGA_ASISTENCIA.dbo.Personal_periodo p ON i.IdReferente = p.PersonalId
      WHERE 1=1
    `;
    const params = {};
    if (filtros.estado) { sql += ' AND i.Estado = @estado'; params.estado = filtros.estado; }
    if (filtros.tipo) { sql += ' AND i.TipoIncidencia = @tipo'; params.tipo = filtros.tipo; }
    sql += ' ORDER BY i.FecRegistro DESC';
    return query(DB, sql, params);
  },

  async getById(id) {
    const rows = await query(DB, `
      SELECT i.*, e.CodEquipo, t.DesTipodeEquipo,
             p.DNI, p.APaterno + ' ' + p.AMaterno + ', ' + p.Nombres as Trabajador
      FROM Tab_EQ_Incidencias i
      JOIN Tab_EQ_MaeEquipos e ON i.IdMaeEquipo = e.IdMaeEquipo
      LEFT JOIN Tab_EQ_TipodeEquipos t ON e.IdTipodeEquipo = t.IdTipodeEquipo
      LEFT JOIN SIGA_ASISTENCIA.dbo.Personal_periodo p ON i.IdReferente = p.PersonalId
      WHERE i.IdIncidencia = @id
    `, { id });
    return rows[0] || null;
  },

  async create(data) {
    const result = await query(DB, `
      INSERT INTO Tab_EQ_Incidencias
        (IdMaeEquipo, IdReferente, TipoIncidencia, Descripcion, FecIncidencia, Estado)
      OUTPUT INSERTED.IdIncidencia
      VALUES (@idEquipo, @idTrabajador, @tipo, @desc, @fec, 'ABIERTO')
    `, {
      idEquipo: data.IdMaeEquipo,
      idTrabajador: data.IdReferente,
      tipo: data.TipoIncidencia,
      desc: data.Descripcion,
      fec: data.FecIncidencia || new Date().toISOString().split('T')[0],
    });
    return result[0]?.IdIncidencia;
  },

  async updateEstado(id, estado) {
    await query(DB, 'UPDATE Tab_EQ_Incidencias SET Estado = @estado WHERE IdIncidencia = @id', { id, estado });
  },
};
