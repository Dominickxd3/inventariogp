import { Router } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { query } from '../config/db.js';

const router = Router();
const DB = 'InventarioGP';

router.use(authMiddleware);

// Listar todos los catalogos con conteo
router.get('/', async (req, res, next) => {
  try {
    const rows = await query(DB, `
      SELECT c.IdCatalogo, c.NombreCatalogo, c.Descripcion,
             COUNT(v.IdValor) AS TotalValores
      FROM Mae_Catalogos c
      LEFT JOIN Mae_CatalogoValores v ON c.IdCatalogo = v.IdCatalogo AND v.Activo = 1
      WHERE c.Activo = 1
      GROUP BY c.IdCatalogo, c.NombreCatalogo, c.Descripcion
      ORDER BY c.NombreCatalogo
    `);
    res.json(rows);
  } catch (e) { next(e); }
});

// Valores de un catalogo
router.get('/:id/valores', async (req, res, next) => {
  try {
    const rows = await query(DB, `
      SELECT IdValor, NombreValor, Activo
      FROM Mae_CatalogoValores
      WHERE IdCatalogo = @id
      ORDER BY NombreValor
    `, { id: Number(req.params.id) });
    res.json(rows);
  } catch (e) { next(e); }
});

// Crear valor
router.post('/:id/valores', roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    const nombre = (req.body.NombreValor || '').trim().toUpperCase();
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });

    // Validar duplicado
    const dup = await query(DB, `
      SELECT IdValor, Activo FROM Mae_CatalogoValores
      WHERE IdCatalogo = @id AND NombreValor = @n
    `, { id: Number(req.params.id), n: nombre });

    if (dup.length > 0) {
      const v = dup[0];
      if (v.Activo) return res.status(409).json({ error: `"${nombre}" ya existe`, id: v.IdValor });
      // Reactivar inactivo
      await query(DB, 'UPDATE Mae_CatalogoValores SET Activo = 1 WHERE IdValor = @id', { id: v.IdValor });
      return res.json({ IdValor: v.IdValor, NombreValor: nombre, Activo: 1 });
    }

    const result = await query(DB, `
      INSERT INTO Mae_CatalogoValores (IdCatalogo, NombreValor) OUTPUT INSERTED.IdValor VALUES (@id, @n)
    `, { id: Number(req.params.id), n: nombre });
    res.status(201).json({ IdValor: result[0].IdValor, NombreValor: nombre, Activo: 1 });
  } catch (e) { next(e); }
});

// Editar valor
router.put('/:id/valores/:vid', roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    const nombre = (req.body.NombreValor || '').trim().toUpperCase();
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });

    const dup = await query(DB, `
      SELECT IdValor FROM Mae_CatalogoValores
      WHERE IdCatalogo = @id AND NombreValor = @n AND IdValor != @vid
    `, { id: Number(req.params.id), n: nombre, vid: Number(req.params.vid) });

    if (dup.length > 0) return res.status(409).json({ error: `"${nombre}" ya existe` });

    await query(DB, 'UPDATE Mae_CatalogoValores SET NombreValor = @n WHERE IdValor = @vid',
      { n: nombre, vid: Number(req.params.vid) });
    res.json({ success: true });
  } catch (e) { next(e); }
});

// Activar/Desactivar
router.patch('/:id/valores/:vid', roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    await query(DB, 'UPDATE Mae_CatalogoValores SET Activo = @a WHERE IdValor = @vid',
      { a: req.body.Activo ? 1 : 0, vid: Number(req.params.vid) });
    res.json({ success: true });
  } catch (e) { next(e); }
});

export default router;
