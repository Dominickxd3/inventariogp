import { query } from '../config/db.js';

const DB = 'InventarioGP';

export const EquiposRepository = {
  async listAll(filtros = {}) {
    const page = Math.max(1, parseInt(filtros.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(filtros.pageSize) || 50));
    const offset = (page - 1) * pageSize;

    let where = 'WHERE 1=1';
    const params = {};
    if (filtros.estado) { where += ' AND e.Estado = @estado'; params.estado = filtros.estado; }
    if (filtros.idTipo) { where += ' AND e.IdTipodeEquipo = @idTipo'; params.idTipo = parseInt(filtros.idTipo); }
    if (filtros.search) { where += " AND (e.CodEquipo LIKE @search OR e.CodBarra LIKE @search)"; params.search = `%${filtros.search}%`; }

    const countSql = `SELECT COUNT(*) as total FROM Tab_EQ_MaeEquipos e ${where}`;
    const [{ total }] = await query(DB, countSql, params);

    const dataSql = `
      SELECT e.*, t.DesTipodeEquipo
      FROM Tab_EQ_MaeEquipos e
      LEFT JOIN Tab_EQ_TipodeEquipos t ON e.IdTipodeEquipo = t.IdTipodeEquipo
      ${where}
      ORDER BY e.FecCreacion DESC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `;
    params.offset = offset;
    params.pageSize = pageSize;
    const rows = await query(DB, dataSql, params);

    return { rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async getDashboardStats() {
    const [stats] = await query(DB, `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN Estado = 'DISPONIBLE' THEN 1 ELSE 0 END) as disponibles,
        SUM(CASE WHEN Estado = 'ASIGNADO' THEN 1 ELSE 0 END) as asignados,
        SUM(CASE WHEN Estado = 'MANTENIMIENTO' THEN 1 ELSE 0 END) as mantenimiento,
        SUM(CASE WHEN Estado = 'INCIDENCIA' THEN 1 ELSE 0 END) as incidencia,
        SUM(CASE WHEN Estado = 'BAJA' THEN 1 ELSE 0 END) as baja
      FROM Tab_EQ_MaeEquipos
    `);
    const porTipo = await query(DB, `
      SELECT t.DesTipodeEquipo, COUNT(*) as count
      FROM Tab_EQ_MaeEquipos e
      LEFT JOIN Tab_EQ_TipodeEquipos t ON e.IdTipodeEquipo = t.IdTipodeEquipo
      GROUP BY t.DesTipodeEquipo
      ORDER BY count DESC
    `);
    return { ...stats, porTipo };
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

  async getByCodEquipo(codEquipo) {
    const rows = await query(DB, `
      SELECT e.*, t.DesTipodeEquipo
      FROM Tab_EQ_MaeEquipos e
      LEFT JOIN Tab_EQ_TipodeEquipos t ON e.IdTipodeEquipo = t.IdTipodeEquipo
      WHERE e.CodEquipo = @codEquipo
    `, { codEquipo });
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
      SET IdTipodeEquipo = @idTipo, CodBarra = @codBarra, Obs = @obs
      WHERE IdMaeEquipo = @id
    `, {
      id,
      idTipo: data.IdTipodeEquipo,
      codBarra: data.CodBarra,
      obs: data.Obs,
    });
  },

  async updateEstado(id, estado) {
    await query(DB, 'UPDATE Tab_EQ_MaeEquipos SET Estado = @estado WHERE IdMaeEquipo = @id', { id, estado });
  },

  async getTipoById(id) {
    const rows = await query(DB, 'SELECT * FROM Tab_EQ_TipodeEquipos WHERE IdTipodeEquipo = @id', { id });
    return rows[0] || null;
  },

  async getLastCodEquipoByPrefix(prefix) {
    const rows = await query(DB, `
      SELECT TOP 1 CodEquipo
      FROM Tab_EQ_MaeEquipos
      WHERE CodEquipo LIKE @prefix + '-%'
      ORDER BY CAST(SUBSTRING(CodEquipo, LEN(@prefix) + 2, 20) AS INT) DESC
    `, { prefix });
    return rows[0]?.CodEquipo || null;
  },

  async createQuick({ codEquipo, idTipo, codBarra, obs, estado, idUsuario }) {
    const result = await query(DB, `
      DECLARE @IdMaeEquipo int;
      BEGIN TRY
        BEGIN TRANSACTION;
          INSERT INTO Tab_EQ_MaeEquipos (CodEquipo, IdTipodeEquipo, CodBarra, Obs, Estado)
          VALUES (@codEquipo, @idTipo, @codBarra, @obs, @estado);
          SET @IdMaeEquipo = SCOPE_IDENTITY();
          INSERT INTO Tab_EQ_MovEstadosEquipos (IdMaeEquipo, EstadoAnterior, EstadoNuevo, IdUsuario, Obs)
          VALUES (@IdMaeEquipo, NULL, @estado, @idUsuario, 'Equipo creado - registro rápido');
        COMMIT TRANSACTION;
        SELECT @IdMaeEquipo as IdMaeEquipo;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
      END CATCH
    `, {
      codEquipo, idTipo,
      codBarra: codBarra || null,
      obs: obs || null,
      estado,
      idUsuario: idUsuario || null,
    });
    return result[0]?.IdMaeEquipo;
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
      SELECT e.*, u.User_Fullname AS NombreUsuario
      FROM Tab_EQ_MovEstadosEquipos e
      LEFT JOIN Tab_SYS_Usuarios u ON e.IdUsuario = u.IdUsuario
      WHERE e.IdMaeEquipo = @id
      ORDER BY e.FecCambio DESC
    `, { id: idEquipo });
  },

  // Plantillas de características por tipo de equipo
  async getPlantillaByTipo(idTipo) {
    return query(DB, `
      SELECT IdPlantilla, Clave, Etiqueta, TipoDato, Requerido, Orden
      FROM Tab_EQ_PlantillaCaracteristicas
      WHERE IdTipodeEquipo = @idTipo AND Activo = 1
      ORDER BY Orden
    `, { idTipo });
  },

  // Características técnicas (con IdPlantilla)
  async getCaracteristicas(idEquipo) {
    return query(DB, `
      SELECT IdCaracteristica, IdPlantilla, Clave, Valor
      FROM Tab_EQ_CaracteristicasEquipo
      WHERE IdMaeEquipo = @id
    `, { id: idEquipo });
  },

  async deleteCaracteristicasPorEquipo(idEquipo) {
    await query(DB, 'DELETE FROM Tab_EQ_CaracteristicasEquipo WHERE IdMaeEquipo = @id', { id: idEquipo });
  },

  async insertCaracteristica(idEquipo, clave, valor, idUsuario) {
    await query(DB, `
      INSERT INTO Tab_EQ_CaracteristicasEquipo (IdMaeEquipo, Clave, Valor, IdUsuarioCrea)
      VALUES (@idEquipo, @clave, @valor, @idUsuario)
    `, { idEquipo, clave, valor: valor || null, idUsuario: idUsuario || null });
  },

  async getTiposAsignables() {
    const accesorios = ['TECLADO', 'MOUSE', 'CARGADOR', 'CABLE', 'ADAPTADOR', 'MOCHILA', 'AUDIFONOS'];
    return query(DB, `
      SELECT * FROM Tab_EQ_TipodeEquipos
      WHERE Estado = 'ACTIVO'
        AND UPPER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(DesTipodeEquipo, 'Í', 'I'), 'É', 'E'), 'Ó', 'O'), 'Á', 'A'), 'Ú', 'U'))
          NOT IN (${accesorios.map((_, i) => `@acc${i}`).join(', ')})
      ORDER BY DesTipodeEquipo
    `, Object.fromEntries(accesorios.map((a, i) => [`acc${i}`, a])));
  },

  async getTimeline(idEquipo) {
    return query(DB, `
      SELECT Fecha, Tipo, Descripcion, Usuario FROM (
        SELECT
          e.FecCreacion AS Fecha,
          'CREACION' AS Tipo,
          'Equipo creado' AS Descripcion,
          CAST(NULL AS varchar(100)) AS Usuario,
          e.FecCreacion AS Orden
        FROM Tab_EQ_MaeEquipos e WHERE e.IdMaeEquipo = @id
        UNION ALL
        SELECT
          h.FecCambio,
          'ESTADO',
          CONCAT('Cambio de ', ISNULL(h.EstadoAnterior, '(nuevo)'), ' a ', h.EstadoNuevo),
          u.User_Fullname,
          h.FecCambio
        FROM Tab_EQ_MovEstadosEquipos h
        LEFT JOIN Tab_SYS_Usuarios u ON h.IdUsuario = u.IdUsuario
        WHERE h.IdMaeEquipo = @id
        UNION ALL
        SELECT
          a.FecAsignacion,
          'ASIGNACION',
          ISNULL(CONCAT('Asignado a ', tr.Trabajador), CONCAT('Asignado a ID: ', a.IdReferente)),
          u.User_Fullname,
          a.FecAsignacion
        FROM Tab_EQ_MovEquiposAsignaciones a
        LEFT JOIN Tab_EQ_Trabajadores tr ON a.IdReferente = tr.IdTrabajador
        LEFT JOIN Tab_SYS_Usuarios u ON a.IdUsuarioCrea = u.IdUsuario
        WHERE a.IdMaeEquipo = @id
        UNION ALL
        SELECT
          a.FecCese,
          'CESE',
          ISNULL(CONCAT('Cese de asignación: ', tr.Trabajador), CONCAT('Cese de asignación ID: ', a.IdReferente)),
          u.User_Fullname,
          a.FecCese
        FROM Tab_EQ_MovEquiposAsignaciones a
        LEFT JOIN Tab_EQ_Trabajadores tr ON a.IdReferente = tr.IdTrabajador
        LEFT JOIN Tab_SYS_Usuarios u ON a.IdUsuarioModifica = u.IdUsuario
        WHERE a.IdMaeEquipo = @id AND a.FecCese IS NOT NULL
        UNION ALL
        SELECT
          i.FecIncidencia,
          'INCIDENCIA',
          CONCAT(i.TipoIncidencia, ': ', i.Descripcion),
          u.User_Fullname,
          i.FecIncidencia
        FROM Tab_EQ_Incidencias i
        LEFT JOIN Tab_SYS_Usuarios u ON i.IdUsuario = u.IdUsuario
        WHERE i.IdMaeEquipo = @id
        UNION ALL
        SELECT
          iv.FecIntervencion,
          'INTERVENCION',
          CONCAT(iv.TipoIntervencion, ': ', iv.Descripcion),
          u.User_Fullname,
          iv.FecIntervencion
        FROM Tab_EQ_IntervencionesTecnicas iv
        LEFT JOIN Tab_SYS_Usuarios u ON iv.IdUsuario = u.IdUsuario
        WHERE iv.IdMaeEquipo = @id
        UNION ALL
        SELECT
          mc.FecCreacion,
          'COMPONENTE',
          CONCAT('Componente ', mc.CodComponente, ' vinculado'),
          u.User_Fullname,
          mc.FecCreacion
        FROM Tab_EQ_MovEquiposComponentes mc
        LEFT JOIN Tab_SYS_Usuarios u ON mc.IdUsuarioCrea = u.IdUsuario
        WHERE mc.IdMaeEquipo = @id AND mc.FecBaja IS NULL
        UNION ALL
        SELECT
          mc.FecBaja,
          'COMPONENTE',
          CONCAT('Componente ', mc.CodComponente, ' desvinculado'),
          u.User_Fullname,
          mc.FecBaja
        FROM Tab_EQ_MovEquiposComponentes mc
        LEFT JOIN Tab_SYS_Usuarios u ON mc.IdUsuarioModifica = u.IdUsuario
        WHERE mc.IdMaeEquipo = @id AND mc.FecBaja IS NOT NULL
      ) t
      ORDER BY Orden DESC
    `, { id: idEquipo });
  },

  async upsertCaracteristicaPlantilla(idEquipo, idPlantilla, valor, idUsuario) {
    const existing = await query(DB, `
      SELECT IdCaracteristica FROM Tab_EQ_CaracteristicasEquipo
      WHERE IdMaeEquipo = @idEquipo AND IdPlantilla = @idPlantilla
    `, { idEquipo, idPlantilla });
    if (existing.length > 0) {
      await query(DB, `
        UPDATE Tab_EQ_CaracteristicasEquipo
        SET Valor = @valor, IdUsuarioModifica = @idUsuario, FecModificacion = GETDATE()
        WHERE IdCaracteristica = @id
      `, { id: existing[0].IdCaracteristica, valor: valor || null, idUsuario: idUsuario || null });
    } else {
      await query(DB, `
        INSERT INTO Tab_EQ_CaracteristicasEquipo (IdMaeEquipo, IdPlantilla, Clave, Valor, IdUsuarioCrea)
        VALUES (@idEquipo, @idPlantilla, (SELECT Clave FROM Tab_EQ_PlantillaCaracteristicas WHERE IdPlantilla = @idPlantilla), @valor, @idUsuario)
      `, { idEquipo, idPlantilla, valor: valor || null, idUsuario: idUsuario || null });
    }
  },
};
