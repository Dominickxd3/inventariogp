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
    if (filtros.search) { sql += " AND (c.CodComponente LIKE @search OR c.DesComponente LIKE @search OR EXISTS (SELECT 1 FROM Tab_Componente_Caracteristicas cc WHERE cc.IdComponente = c.IdComponente AND cc.Valor LIKE @search))"; params.search = `%${filtros.search}%`; }
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

  async getByCodigo(cod) {
    const rows = await query(DB, `
      SELECT c.*, tc.DesTipodeComponente, tc.Categoria
      FROM Tab_EQ_Componentes c
      LEFT JOIN Tab_EQ_TipodeComponentes tc ON c.IdTipodeComponente = tc.IdTipodeComponente
      WHERE c.CodComponente = @cod
    `, { cod });
    return rows[0] || null;
  },

  async searchCatalogo(nombre, q) {
    return query(DB, `
      SELECT v.IdValor, v.NombreValor
      FROM Mae_CatalogoValores v
      JOIN Mae_Catalogos c ON v.IdCatalogo = c.IdCatalogo
      WHERE c.NombreCatalogo = @nombre AND v.NombreValor LIKE '%' + @q + '%' AND v.Activo = 1
      ORDER BY v.NombreValor
    `, { nombre, q });
  },

  async findCatalogoValor(idCatalogo, nombreValor) {
    const rows = await query(DB, `
      SELECT TOP 1 IdValor, NombreValor
      FROM Mae_CatalogoValores
      WHERE IdCatalogo = @idCatalogo AND LTRIM(RTRIM(NombreValor)) = LTRIM(RTRIM(@nombreValor))
    `, { idCatalogo, nombreValor });
    return rows[0] || null;
  },

  async listValoresPlantilla(idPlantilla, q = '') {
    const params = { idPlantilla };
    let filtro = "LTRIM(RTRIM(Valor)) <> ''";
    if (q.trim()) {
      filtro += ' AND Valor LIKE @q';
      params.q = `%${q.trim()}%`;
    }
    return query(DB, `
      SELECT DISTINCT LTRIM(RTRIM(Valor)) AS Valor
      FROM Tab_Componente_Caracteristicas
      WHERE IdPlantilla = @idPlantilla AND ${filtro}
      ORDER BY Valor
    `, params);
  },

  async create(data, { idUsuario = null, caracteristicas = [] } = {}) {
    return withTransaction('InventarioGP', async (tx) => {
      const req = createRequest(tx, {
        idTipo: data.IdTipodeComponente,
        cod: data.CodComponente,
        desc: data.DesComponente || null,
        obs: data.Obs || null,
        idUsuario,
      });

      const result = await req.query(`
        INSERT INTO Tab_EQ_Componentes
          (IdTipodeComponente, CodComponente, DesComponente, Obs, Estado, FechaRegistro, IdUsuarioCrea)
        OUTPUT INSERTED.IdComponente
        VALUES (@idTipo, @cod, @desc, @obs, 'DISPONIBLE', GETDATE(), @idUsuario)
      `);
      const newId = result.recordset[0]?.IdComponente;
      if (newId == null) throw new Error('No se pudo crear el componente');

      for (const c of caracteristicas) {
        await createRequest(tx, {
          idComponente: newId,
          idPlantilla: c.IdPlantilla,
          clave: c.Clave || '',
          valor: c.Valor ?? '',
          idValorCatalogo: c.IdValorCatalogo || null,
          idUsuario,
        }).query(`
          INSERT INTO Tab_Componente_Caracteristicas (IdComponente, IdPlantilla, Clave, Valor, IdValorCatalogo, IdUsuarioCrea)
          VALUES (@idComponente, @idPlantilla, @clave, @valor, @idValorCatalogo, @idUsuario)
        `);
      }

      if (idUsuario) {
        await createRequest(tx, {
          idComponente: newId,
          idUsuario,
          detalle: JSON.stringify({ tipo: data.IdTipodeComponente, codigo: data.CodComponente || null }),
        }).query(`
          INSERT INTO Tab_EQ_ComponentesEventos (IdComponente, EstadoAnterior, EstadoNuevo, IdUsuario, FechaEvento, Motivo, IdReferencia, TablaReferencia, Detalle)
          VALUES (@idComponente, NULL, 'DISPONIBLE', @idUsuario, GETDATE(), NULL, @idComponente, 'Tab_EQ_Componentes', @detalle)
        `);
      }

      return newId;
    });
  },

  async update(id, data) {
    await query(DB, `
      UPDATE Tab_EQ_Componentes
      SET IdTipodeComponente = @idTipo, DesComponente = @desc, Obs = @obs
      WHERE IdComponente = @id
    `, {
      id,
      idTipo: data.IdTipodeComponente,
      desc: data.DesComponente,
      obs: data.Obs,
    });
  },

  async listTipos() {
    return query(DB, "SELECT IdTipodeComponente, DesTipodeComponente, Categoria, Estado FROM Tab_EQ_TipodeComponentes WHERE Estado = 'ACTIVO' OR Estado IS NULL ORDER BY DesTipodeComponente");
  },

  async getTipoById(id) {
    const rows = await query(DB, "SELECT IdTipodeComponente, DesTipodeComponente, Categoria, Estado FROM Tab_EQ_TipodeComponentes WHERE IdTipodeComponente = @id", { id });
    return rows[0] || null;
  },

async getBySerie(serie) {
    const rows = await query(DB, `
      SELECT TOP 1 c.*
      FROM Tab_EQ_Componentes c
      WHERE EXISTS (
        SELECT 1 FROM Tab_Componente_Caracteristicas cc
        WHERE cc.IdComponente = c.IdComponente
          AND cc.Clave = 'Serie'
          AND LTRIM(RTRIM(cc.Valor)) = LTRIM(RTRIM(@serie))
      )
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

  async listMarcas(q = '') {
    const params = {};
    let sql = `
      SELECT DISTINCT LTRIM(RTRIM(Valor)) AS Marca
      FROM Tab_Componente_Caracteristicas
      WHERE Clave = 'Marca' AND Valor IS NOT NULL AND LTRIM(RTRIM(Valor)) <> ''
    `;
    if (q.trim()) {
      sql += ' AND Valor LIKE @q';
      params.q = `%${q.trim()}%`;
    }
    return query(DB, sql + ' ORDER BY Marca', params);
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
      INSERT INTO Tab_EQ_TipodeComponentes (CodTipodeComponente, DesTipodeComponente, Categoria, Estado)
      OUTPUT INSERTED.IdTipodeComponente
      VALUES (@cod, @desc, @categoria, 'ACTIVO')
    `, {
      cod: data.CodTipodeComponente || 'GEN',
      desc: data.DesTipodeComponente,
      categoria: data.Categoria || null,
    });
    return result[0]?.IdTipodeComponente;
  },

  // Componentes asignados a un equipo
async getByEquipo(idEquipo) {
    return query(DB, `
      SELECT mc.*, c.CodComponente, c.DesComponente,
             cc.MarcaCar AS Marca,
             cc.ModeloCar AS Modelo,
             tc.DesTipodeComponente
      FROM Tab_EQ_MovEquiposComponentes mc
      JOIN Tab_EQ_Componentes c ON mc.IdComponente = c.IdComponente
      LEFT JOIN (
        SELECT cc.IdComponente,
               MAX(CASE WHEN cc.Clave = 'Marca' THEN cc.Valor END) AS MarcaCar,
               MAX(CASE WHEN cc.Clave = 'Modelo' THEN cc.Valor END) AS ModeloCar
        FROM Tab_Componente_Caracteristicas cc
        GROUP BY cc.IdComponente
      ) cc ON cc.IdComponente = c.IdComponente
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

  async getDetalleById(id) {
    const rows = await query(DB, `
      SELECT
        c.IdComponente, c.CodComponente, c.DesComponente,
        c.Obs, c.Estado, c.FechaRegistro,
        tc.IdTipodeComponente,
        tc.DesTipodeComponente AS TipoComponente,
        tc.Categoria
      FROM Tab_EQ_Componentes c
      LEFT JOIN Tab_EQ_TipodeComponentes tc ON c.IdTipodeComponente = tc.IdTipodeComponente
      WHERE c.IdComponente = @id
    `, { id });
    const componente = rows[0] || null;
    if (!componente) return { componente: null, usoActual: null, timeline: [] };

    const usoActual = await this._getUsoActual(id, componente.Estado);
    const timeline = await this._getTimeline(id);

    return { componente, usoActual, timeline };
  },

  async _getUsoActual(idComponente, estado) {
    if (estado === 'BAJA') {
      return { tipo: 'BAJA', equipo: null, trabajador: null };
    }

    const enEquipo = await query(DB, `
      SELECT TOP 1 e.IdMaeEquipo, e.CodEquipo, te.DesTipodeEquipo AS TipoEquipo,
             e.Estado AS EstadoEquipo, mc.FecAsigComponente AS FechaInstalacion
      FROM Tab_EQ_MovEquiposComponentes mc
      JOIN Tab_EQ_MaeEquipos e ON mc.IdMaeEquipo = e.IdMaeEquipo
      LEFT JOIN Tab_EQ_TipodeEquipos te ON e.IdTipodeEquipo = te.IdTipodeEquipo
      WHERE mc.IdComponente = @id AND mc.Estado = 'VIGENTE'
      ORDER BY mc.IdMovEquipoComponente DESC
    `, { id: idComponente });
    if (enEquipo.length) {
      const e = enEquipo[0];
      return {
        tipo: 'EQUIPO',
        equipo: {
          IdMaeEquipo: e.IdMaeEquipo,
          CodEquipo: e.CodEquipo,
          TipoEquipo: e.TipoEquipo,
          EstadoEquipo: e.EstadoEquipo,
          FechaInstalacion: e.FechaInstalacion,
        },
        trabajador: null,
      };
    }

    const enTrabajador = await query(DB, `
      SELECT TOP 1 m.IdReferente, t.Trabajador AS NombreTrabajador,
             t.DOI AS DNI, t.Area, t.Ocupacion AS Cargo,
             m.FecAsignacion AS FechaAsignacion
      FROM Tab_EQ_MovAccesoriosTrabajador m
      JOIN Tab_EQ_Trabajadores t ON m.IdReferente = t.IdTrabajador
      WHERE m.IdComponente = @id AND m.Estado = 'VIGENTE'
      ORDER BY m.IdMovAccesorio DESC
    `, { id: idComponente });
    if (enTrabajador.length) {
      const t = enTrabajador[0];
      return {
        tipo: 'TRABAJADOR',
        equipo: null,
        trabajador: {
          IdReferente: t.IdReferente,
          NombreTrabajador: t.NombreTrabajador,
          DNI: t.DNI,
          Area: t.Area,
          Cargo: t.Cargo,
          FechaAsignacion: t.FechaAsignacion,
        },
      };
    }

    return { tipo: 'DISPONIBLE', equipo: null, trabajador: null };
  },

  async _getTimeline(idComponente) {
    const entries = [];

    const movEquipos = await query(DB, `
      SELECT 'VINCULADO_EQUIPO' AS Tipo, mc.IdMovEquipoComponente AS IdMov,
             mc.FecAsigComponente AS Fecha, mc.Obs AS Descripcion,
             e.CodEquipo
      FROM Tab_EQ_MovEquiposComponentes mc
      JOIN Tab_EQ_MaeEquipos e ON mc.IdMaeEquipo = e.IdMaeEquipo
      WHERE mc.IdComponente = @id AND mc.Estado = 'VIGENTE'
      ORDER BY mc.FecAsigComponente DESC
    `, { id: idComponente });
    for (const r of movEquipos) {
      entries.push({
        fecha: r.Fecha,
        tipo: 'VINCULADO_EQUIPO',
        titulo: 'Vinculado a equipo',
        descripcion: `Componente vinculado al equipo ${r.CodEquipo}`,
      });
    }

    const movEquiposBaja = await query(DB, `
      SELECT 'DESVINCULADO_EQUIPO' AS Tipo, mc.IdMovEquipoComponente AS IdMov,
             mc.FecBajaComponente AS Fecha, mc.Motivo AS Descripcion,
             e.CodEquipo
      FROM Tab_EQ_MovEquiposComponentes mc
      JOIN Tab_EQ_MaeEquipos e ON mc.IdMaeEquipo = e.IdMaeEquipo
      WHERE mc.IdComponente = @id AND mc.Estado = 'BAJA'
        AND mc.FecBajaComponente IS NOT NULL
      ORDER BY mc.FecBajaComponente DESC
    `, { id: idComponente });
    for (const r of movEquiposBaja) {
      entries.push({
        fecha: r.Fecha,
        tipo: 'DESVINCULADO_EQUIPO',
        titulo: 'Desvinculado de equipo',
        descripcion: `Componente retirado del equipo ${r.CodEquipo}${r.Descripcion ? ` — ${r.Descripcion}` : ''}`,
      });
    }

    const movAcc = await query(DB, `
      SELECT 'ASIGNADO_TRABAJADOR' AS Tipo, m.IdMovAccesorio AS IdMov,
             m.FecAsignacion AS Fecha, NULL AS Descripcion,
             t.Trabajador AS Nombre
      FROM Tab_EQ_MovAccesoriosTrabajador m
      JOIN Tab_EQ_Trabajadores t ON m.IdReferente = t.IdTrabajador
      WHERE m.IdComponente = @id AND m.Estado = 'VIGENTE'
      ORDER BY m.FecAsignacion DESC
    `, { id: idComponente });
    for (const r of movAcc) {
      entries.push({
        fecha: r.Fecha,
        tipo: 'ASIGNADO_TRABAJADOR',
        titulo: 'Asignado a trabajador',
        descripcion: `Asignado a ${r.Nombre}`,
      });
    }

    const movAccCesado = await query(DB, `
      SELECT 'CESADO_TRABAJADOR' AS Tipo, m.IdMovAccesorio AS IdMov,
             m.FecCese AS Fecha, NULL AS Descripcion,
             t.Trabajador AS Nombre
      FROM Tab_EQ_MovAccesoriosTrabajador m
      JOIN Tab_EQ_Trabajadores t ON m.IdReferente = t.IdTrabajador
      WHERE m.IdComponente = @id AND m.Estado = 'CESADO'
        AND m.FecCese IS NOT NULL
      ORDER BY m.FecCese DESC
    `, { id: idComponente });
    for (const r of movAccCesado) {
      entries.push({
        fecha: r.Fecha,
        tipo: 'CESADO_TRABAJADOR',
        titulo: 'Cesado de trabajador',
        descripcion: `Cesado de ${r.Nombre}`,
      });
    }

    // Intervenciones técnicas (no falla si la tabla no existe)
    try {
      const intervenciones = await query(DB, `
        SELECT 'INTERVENCION' AS Tipo, i.IdIntervencion AS IdMov,
               i.FecIntervencion AS Fecha, i.Descripcion,
               e.CodEquipo,
               CASE WHEN i.IdComponenteInstalado = @id THEN 'instalado' ELSE 'retirado' END AS Rol
        FROM Tab_EQ_IntervencionesTecnicas i
        JOIN Tab_EQ_MaeEquipos e ON i.IdMaeEquipo = e.IdMaeEquipo
        WHERE i.IdComponenteInstalado = @id OR i.IdComponenteRetirado = @id
        ORDER BY i.FecIntervencion DESC
      `, { id: idComponente });
      for (const r of intervenciones) {
        entries.push({
          fecha: r.Fecha,
          tipo: 'INTERVENCION',
          titulo: 'Intervención técnica',
          descripcion: `Componente ${r.Rol} durante intervención en equipo ${r.CodEquipo} — ${r.Descripcion}`,
        });
      }
    } catch (_) {
      // Tabla o columnas no existen, se omite
    }

    entries.sort((a, b) => {
      const da = a.fecha ? new Date(a.fecha) : new Date(0);
      const db = b.fecha ? new Date(b.fecha) : new Date(0);
      return db - da;
    });

    return entries;
  },

  async listAccesoriosPorTrabajador(idTrabajador) {
    return query(DB, `
      SELECT m.*, c.CodComponente, c.DesComponente,
             cc.MarcaCar AS Marca,
             cc.ModeloCar AS Modelo,
             tc.DesTipodeComponente
      FROM Tab_EQ_MovAccesoriosTrabajador m
      JOIN Tab_EQ_Componentes c ON m.IdComponente = c.IdComponente
      LEFT JOIN (
        SELECT cc.IdComponente,
               MAX(CASE WHEN cc.Clave = 'Marca' THEN cc.Valor END) AS MarcaCar,
               MAX(CASE WHEN cc.Clave = 'Modelo' THEN cc.Valor END) AS ModeloCar
        FROM Tab_Componente_Caracteristicas cc
        GROUP BY cc.IdComponente
      ) cc ON cc.IdComponente = c.IdComponente
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

  async getPlantillaByComponenteTipo(idTipo) {
    return query(DB, `
      SELECT cp.IdPlantilla, cp.Clave, cp.Etiqueta, cp.TipoDato, cp.Requerido, cp.Orden, cp.Ejemplo,
             cp.MostrarEnDescripcion, cp.OrdenDescripcion, cp.Unidad, cp.IdCatalogo,
             mc.NombreCatalogo AS CatalogoNombre
      FROM Tab_Componente_PlantillaCaracteristicas cp
      LEFT JOIN Mae_Catalogos mc ON cp.IdCatalogo = mc.IdCatalogo
      WHERE cp.IdTipodeComponente = @idTipo AND cp.Activo = 1
      ORDER BY Orden
    `, { idTipo });
  },

  async getCaracteristicasComponente(idComponente) {
    return query(DB, `
      SELECT c.IdCaracteristica, c.IdPlantilla, c.Clave, c.Valor, c.IdValorCatalogo, p.Etiqueta
      FROM Tab_Componente_Caracteristicas c
      LEFT JOIN Tab_Componente_PlantillaCaracteristicas p ON c.IdPlantilla = p.IdPlantilla
      WHERE c.IdComponente = @id
    `, { id: idComponente });
  },

  async getCaracteristicasByLote(idsCsv) {
    return query(DB, `
      SELECT c.IdComponente, c.Clave, c.Valor
      FROM Tab_Componente_Caracteristicas c
      WHERE c.IdComponente IN (${idsCsv})
    `);
  },

  async deleteCaracteristicasPorComponente(idComponente, transaction) {
    const req = createRequest(transaction, { id: idComponente });
    await req.query('DELETE FROM Tab_Componente_Caracteristicas WHERE IdComponente = @id');
  },

  async insertCaracteristicaComponente(idComponente, idPlantilla, clave, valor, idValorCatalogo, idUsuario, transaction) {
    const req = createRequest(transaction, { idComponente, idPlantilla, clave, valor, idValorCatalogo, idUsuario });
    await req.query(`
      INSERT INTO Tab_Componente_Caracteristicas (IdComponente, IdPlantilla, Clave, Valor, IdValorCatalogo, IdUsuarioCrea)
      VALUES (@idComponente, @idPlantilla, @clave, @valor, @idValorCatalogo, @idUsuario)
    `);
  },
};
