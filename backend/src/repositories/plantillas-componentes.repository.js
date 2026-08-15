import { query, withTransaction, createRequest } from '../config/db.js';

const DB = 'InventarioGP';

export const PlantillasComponentesRepository = {
  async list() {
    return query(DB, `
      SELECT p.IdPlantillaComp, p.Nombre, p.Descripcion, p.Estado, p.FechaRegistro,
             COUNT(d.IdPlantillaCompDetalle) AS TotalComponentes
      FROM Tab_EQ_PlantillaComponentes p
      LEFT JOIN Tab_EQ_PlantillaCompDetalle d ON d.IdPlantillaComp = p.IdPlantillaComp
      WHERE p.Estado = 'ACTIVO'
      GROUP BY p.IdPlantillaComp, p.Nombre, p.Descripcion, p.Estado, p.FechaRegistro
      ORDER BY p.Nombre
    `);
  },

  async getById(id) {
    const header = await query(DB, `
      SELECT IdPlantillaComp, Nombre, Descripcion, Estado
      FROM Tab_EQ_PlantillaComponentes WHERE IdPlantillaComp = @id
    `, { id });
    if (!header.length) return null;
    const detalle = await query(DB, `
      SELECT d.IdPlantillaCompDetalle, d.IdPlantillaComp, d.IdTipodeComponente,
             d.Marca, d.Modelo, d.Capacidad, d.Orden,
             tc.DesTipodeComponente, tc.Categoria
      FROM Tab_EQ_PlantillaCompDetalle d
      LEFT JOIN Tab_EQ_TipodeComponentes tc ON tc.IdTipodeComponente = d.IdTipodeComponente
      WHERE d.IdPlantillaComp = @id
      ORDER BY d.Orden
    `, { id });
    return { ...header[0], componentes: detalle };
  },

  async create(nombre, descripcion, componentes, idUsuario) {
    return withTransaction(DB, async (tx) => {
      const req = createRequest(tx, {
        nombre,
        descripcion: descripcion || null,
        idUsuario: idUsuario || null,
      });
      const result = await req.query(`
        INSERT INTO Tab_EQ_PlantillaComponentes (Nombre, Descripcion, Estado, FechaRegistro)
        OUTPUT INSERTED.IdPlantillaComp
        VALUES (@nombre, @descripcion, 'ACTIVO', GETDATE())
      `);
      const id = result.recordset[0].IdPlantillaComp;
      for (let i = 0; i < componentes.length; i++) {
        const c = componentes[i];
        await createRequest(tx, {
          idPlantilla: id,
          idTipo: c.IdTipodeComponente,
          marca: c.Marca || null,
          modelo: c.Modelo || null,
          capacidad: c.Capacidad || null,
          orden: i,
        }).query(`
          INSERT INTO Tab_EQ_PlantillaCompDetalle
            (IdPlantillaComp, IdTipodeComponente, Marca, Modelo, Capacidad, Orden)
          VALUES (@idPlantilla, @idTipo, @marca, @modelo, @capacidad, @orden)
        `);
      }
      return id;
    });
  },

  async update(id, nombre, descripcion, componentes) {
    return withTransaction(DB, async (tx) => {
      await createRequest(tx, { id, nombre, descripcion: descripcion || null })
        .query(`UPDATE Tab_EQ_PlantillaComponentes SET Nombre = @nombre, Descripcion = @descripcion WHERE IdPlantillaComp = @id`);
      await createRequest(tx, { id }).query(`DELETE FROM Tab_EQ_PlantillaCompDetalle WHERE IdPlantillaComp = @id`);
      for (let i = 0; i < componentes.length; i++) {
        const c = componentes[i];
        await createRequest(tx, {
          idPlantilla: id,
          idTipo: c.IdTipodeComponente,
          marca: c.Marca || null,
          modelo: c.Modelo || null,
          capacidad: c.Capacidad || null,
          orden: i,
        }).query(`
          INSERT INTO Tab_EQ_PlantillaCompDetalle
            (IdPlantillaComp, IdTipodeComponente, Marca, Modelo, Capacidad, Orden)
          VALUES (@idPlantilla, @idTipo, @marca, @modelo, @capacidad, @orden)
        `);
      }
    });
  },

  async remove(id) {
    await withTransaction(DB, async (tx) => {
      await createRequest(tx, { id }).query(`DELETE FROM Tab_EQ_PlantillaCompDetalle WHERE IdPlantillaComp = @id`);
      await createRequest(tx, { id }).query(`DELETE FROM Tab_EQ_PlantillaComponentes WHERE IdPlantillaComp = @id`);
    });
  },
};
