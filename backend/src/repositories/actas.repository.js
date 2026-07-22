import { query, executeQuery, withTransaction, createRequest } from '../config/db.js';
import { actasConfig } from '../config/actas.js';

const DB = actasConfig.dbName;

export const ActasRepository = {
  async insert(data) {
    return withTransaction(DB, async (trx) => {
      const r = await createRequest(trx, {
        idMovEquipoAsignacion: data.IdMovEquipoAsignacion,
        tipoActa: data.TipoActa,
        codigoActa: data.CodigoActa,
        estadoActa: data.EstadoActa,
        snapshotJson: data.SnapshotJson,
        tokenHash: data.TokenHash,
        fechaExpiracion: data.FechaExpiracion,
        pdfOriginalRuta: data.PdfOriginalRuta,
        pdfOriginalHash: data.PdfOriginalHash,
        idUsuarioGenera: data.IdUsuarioGenera,
      }).query(`
        INSERT INTO Tab_EQ_ActasAsignacion
          (IdMovEquipoAsignacion, TipoActa, CodigoActa, EstadoActa,
           SnapshotJson, TokenHash, FechaExpiracion,
           PdfOriginalRuta, PdfOriginalHash,
           IdUsuarioGenera, FechaGeneracion)
        OUTPUT INSERTED.IdActa
        VALUES
          (@idMovEquipoAsignacion, @tipoActa, @codigoActa, @estadoActa,
           @snapshotJson, @tokenHash, @fechaExpiracion,
           @pdfOriginalRuta, @pdfOriginalHash,
           @idUsuarioGenera, GETDATE())
      `);
      return r.recordset[0].IdActa;
    });
  },

  async getById(id) {
    const rows = await query(DB, `
      SELECT * FROM Tab_EQ_ActasAsignacion WHERE IdActa = @id
    `, { id });
    return rows[0] || null;
  },

  async getByAssignmentAndType(idMovEquipoAsignacion, tipoActa) {
    const rows = await query(DB, `
      SELECT * FROM Tab_EQ_ActasAsignacion
      WHERE IdMovEquipoAsignacion = @idMovEquipoAsignacion AND TipoActa = @tipoActa
      ORDER BY IdActa DESC
    `, { idMovEquipoAsignacion, tipoActa });
    return rows[0] || null;
  },

  async getByTokenHash(tokenHash) {
    const rows = await query(DB, `
      SELECT * FROM Tab_EQ_ActasAsignacion WHERE TokenHash = @tokenHash
    `, { tokenHash });
    return rows[0] || null;
  },

  async list(filtros) {
    let where = 'WHERE 1=1';
    const params = {};
    if (filtros.estado) {
      where += ' AND a.EstadoActa = @estado';
      params.estado = filtros.estado;
    }
    if (filtros.tipoActa) {
      where += ' AND a.TipoActa = @tipoActa';
      params.tipoActa = filtros.tipoActa;
    }
    if (filtros.trabajador) {
      where += ' AND (t.Trabajador LIKE @trabajador OR t.DOI LIKE @trabajador)';
      params.trabajador = `%${filtros.trabajador}%`;
    }
    if (filtros.equipo) {
      where += ' AND e.CodEquipo LIKE @equipo';
      params.equipo = `%${filtros.equipo}%`;
    }

    const page = Math.max(1, parseInt(filtros.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(filtros.pageSize || '25', 10)));
    const offset = (page - 1) * pageSize;

    const countResult = await query(DB, `
      SELECT COUNT(*) as total
      FROM Tab_EQ_ActasAsignacion a
      LEFT JOIN Tab_EQ_MovEquiposAsignaciones ma ON a.IdMovEquipoAsignacion = ma.IdMovEquipoAsignacion
      LEFT JOIN Tab_EQ_Trabajadores t ON ma.IdReferente = t.IdTrabajador
      LEFT JOIN Tab_EQ_MaeEquipos e ON ma.IdMaeEquipo = e.IdMaeEquipo
      ${where}
    `, params);
    const total = countResult[0]?.total || 0;

    const rows = await query(DB, `
      SELECT a.*, ma.IdMaeEquipo, ma.IdReferente,
             t.Trabajador as TrabajadorNombre, t.DOI,
             e.CodEquipo, tp.DesTipodeEquipo
      FROM Tab_EQ_ActasAsignacion a
      LEFT JOIN Tab_EQ_MovEquiposAsignaciones ma ON a.IdMovEquipoAsignacion = ma.IdMovEquipoAsignacion
      LEFT JOIN Tab_EQ_Trabajadores t ON ma.IdReferente = t.IdTrabajador
      LEFT JOIN Tab_EQ_MaeEquipos e ON ma.IdMaeEquipo = e.IdMaeEquipo
      LEFT JOIN Tab_EQ_TipodeEquipos tp ON e.IdTipodeEquipo = tp.IdTipodeEquipo
      ${where}
      ORDER BY a.IdActa DESC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `, { ...params, offset, pageSize });

    return {
      data: rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  async updateSigned(idActa, data) {
    const r = await executeQuery(DB, `
      UPDATE Tab_EQ_ActasAsignacion
      SET EstadoActa = 'FIRMADA',
          FechaFirma = @fechaFirma,
          FirmaRuta = @firmaRuta,
          FirmaHash = @firmaHash,
          PdfFirmadoRuta = @pdfFirmadoRuta,
          PdfFirmadoHash = @pdfFirmadoHash
      WHERE IdActa = @idActa
        AND EstadoActa = 'PENDIENTE_FIRMA'
        AND TokenHash = @tokenHash
    `, {
      idActa,
      tokenHash: data.TokenHash,
      fechaFirma: data.FechaFirma,
      firmaRuta: data.FirmaRuta,
      firmaHash: data.FirmaHash,
      pdfFirmadoRuta: data.PdfFirmadoRuta,
      pdfFirmadoHash: data.PdfFirmadoHash,
    });
    return r.rowsAffected?.[0] ?? 0;
  },

  async updateExpired() {
    await executeQuery(DB, `
      UPDATE Tab_EQ_ActasAsignacion
      SET EstadoActa = 'VENCIDA'
      WHERE EstadoActa = 'PENDIENTE_FIRMA'
        AND FechaExpiracion < GETDATE()
    `);
  },

  async updateVencida(idActa) {
    const r = await executeQuery(DB, `
      UPDATE Tab_EQ_ActasAsignacion
      SET EstadoActa = 'VENCIDA'
      WHERE IdActa = @idActa AND EstadoActa = 'PENDIENTE_FIRMA'
    `, { idActa });
    return r.rowsAffected?.[0] ?? 0;
  },

  async regenerateToken(idActa, tokenHash, fechaExpiracion) {
    const r = await executeQuery(DB, `
      UPDATE Tab_EQ_ActasAsignacion
      SET TokenHash = @tokenHash, FechaExpiracion = @fechaExpiracion,
          EstadoActa = 'PENDIENTE_FIRMA'
      WHERE IdActa = @idActa
        AND EstadoActa IN ('PENDIENTE_FIRMA', 'VENCIDA')
    `, { idActa, tokenHash, fechaExpiracion });
    return r.rowsAffected?.[0] ?? 0;
  },

  async annul(idActa, motivo) {
    const r = await executeQuery(DB, `
      UPDATE Tab_EQ_ActasAsignacion
      SET EstadoActa = 'ANULADA', MotivoAnulacion = @motivo, FechaAnulacion = GETDATE()
      WHERE IdActa = @idActa
        AND EstadoActa NOT IN ('FIRMADA', 'ANULADA')
    `, { idActa, motivo });
    return r.rowsAffected?.[0] ?? 0;
  },

  async getStatus(idMovEquipoAsignacion) {
    const rows = await query(DB, `
      SELECT IdActa, TipoActa, CodigoActa, EstadoActa,
             FechaGeneracion, FechaFirma, FechaExpiracion,
             PdfOriginalRuta, PdfFirmadoRuta
      FROM Tab_EQ_ActasAsignacion
      WHERE IdMovEquipoAsignacion = @idMovEquipoAsignacion
      ORDER BY IdActa DESC
    `, { idMovEquipoAsignacion });
    return rows;
  },
};
