import { Router } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { query } from '../config/db.js';
import { EventsService } from '../services/events.service.js';

const router = Router();
const DB = 'InventarioGP';

router.use(authMiddleware);

const normalizar = (s) => String(s || '')
  .trim()
  .toUpperCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, ' ');

async function buscarDuplicadoValor(idCatalogo, nombreNormalizado, excluirValorId = null) {
  const rows = await query(DB, `
    SELECT IdValor, Activo, NombreValor FROM Mae_CatalogoValores WHERE IdCatalogo = @id
  `, { id: idCatalogo });
  return rows.find(r => r.IdValor !== excluirValorId && normalizar(r.NombreValor) === nombreNormalizado) || null;
}

// Listar catálogos con conteos (incluye inactivos para poder reactivar)
router.get('/', async (req, res, next) => {
  try {
    const rows = await query(DB, `
      SELECT c.IdCatalogo, c.NombreCatalogo, c.Descripcion, c.Activo,
             SUM(CASE WHEN v.Activo = 1 THEN 1 ELSE 0 END) AS TotalValores,
             SUM(CASE WHEN v.Activo = 0 THEN 1 ELSE 0 END) AS TotalInactivos
      FROM Mae_Catalogos c
      LEFT JOIN Mae_CatalogoValores v ON c.IdCatalogo = v.IdCatalogo
      GROUP BY c.IdCatalogo, c.NombreCatalogo, c.Descripcion, c.Activo
      ORDER BY c.NombreCatalogo
    `);
    res.json(rows);
  } catch (e) { next(e); }
});

// Crear catálogo
router.post('/', roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    const nombre = normalizar(req.body.NombreCatalogo || '');
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
    const descripcion = (req.body.Descripcion || '').trim() || null;

    const catalogos = await query(DB, 'SELECT IdCatalogo, NombreCatalogo, Activo FROM Mae_Catalogos');
    const dup = catalogos.find(c => normalizar(c.NombreCatalogo) === nombre);
    if (dup) {
      if (dup.Activo) return res.status(409).json({ error: `El catálogo "${req.body.NombreCatalogo}" ya existe` });
      await query(DB, 'UPDATE Mae_Catalogos SET Activo = 1, Descripcion = @d WHERE IdCatalogo = @id', { d: descripcion, id: dup.IdCatalogo });
      EventsService.emit('catalogo.updated', { id: dup.IdCatalogo });
      return res.json({ IdCatalogo: dup.IdCatalogo, NombreCatalogo: dup.NombreCatalogo, Descripcion: descripcion, Activo: 1 });
    }

    const result = await query(DB, `
      INSERT INTO Mae_Catalogos (NombreCatalogo, Descripcion, Activo)
      OUTPUT INSERTED.IdCatalogo VALUES (@n, @d, 1)
    `, { n: req.body.NombreCatalogo.trim(), d: descripcion });
    EventsService.emit('catalogo.updated', { id: result[0].IdCatalogo });
    res.status(201).json({ IdCatalogo: result[0].IdCatalogo, NombreCatalogo: req.body.NombreCatalogo.trim(), Descripcion: descripcion, Activo: 1 });
  } catch (e) { next(e); }
});

// Editar catálogo
router.put('/:id', roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const nombre = normalizar(req.body.NombreCatalogo || '');
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
    const descripcion = (req.body.Descripcion || '').trim() || null;

    const catalogos = await query(DB, 'SELECT IdCatalogo, NombreCatalogo FROM Mae_Catalogos');
    const dup = catalogos.find(c => c.IdCatalogo !== id && normalizar(c.NombreCatalogo) === nombre);
    if (dup) return res.status(409).json({ error: `El catálogo "${req.body.NombreCatalogo}" ya existe` });

    await query(DB, 'UPDATE Mae_Catalogos SET NombreCatalogo = @n, Descripcion = @d WHERE IdCatalogo = @id', { n: req.body.NombreCatalogo.trim(), d: descripcion, id });
    EventsService.emit('catalogo.updated', { id });
    res.json({ success: true });
  } catch (e) { next(e); }
});

// Activar/Desactivar catálogo
router.patch('/:id', roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    await query(DB, 'UPDATE Mae_Catalogos SET Activo = @a WHERE IdCatalogo = @id', { a: req.body.Activo ? 1 : 0, id: Number(req.params.id) });
    EventsService.emit('catalogo.updated', { id: Number(req.params.id) });
    res.json({ success: true });
  } catch (e) { next(e); }
});

// Valores de un catálogo (búsqueda + paginación en servidor + referencias)
router.get('/:id/valores', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const q = (req.query.q || '').trim();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 50, 1), 100);
    const filtro = q ? 'AND v.NombreValor LIKE @like' : '';
    const like = `%${q}%`;

    const countRes = await query(DB, `
      SELECT COUNT(*) AS total FROM Mae_CatalogoValores v WHERE v.IdCatalogo = @id ${filtro}
    `, q ? { id, like } : { id });
    const total = countRes[0].total;

    const rows = await query(DB, `
      SELECT v.IdValor, v.NombreValor, v.Activo,
             (SELECT COUNT(*) FROM Tab_Componente_Caracteristicas cc WHERE cc.IdValorCatalogo = v.IdValor) AS Referencias
      FROM Mae_CatalogoValores v
      WHERE v.IdCatalogo = @id ${filtro}
      ORDER BY v.NombreValor
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `, {
      ...(q ? { id, like } : { id }),
      offset: (page - 1) * pageSize,
      pageSize,
    });

    res.json({
      rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    });
  } catch (e) { next(e); }
});

// Crear valor
router.post('/:id/valores', roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const nombre = (req.body.NombreValor || '').trim().toUpperCase();
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
    const norm = normalizar(nombre);

    const dup = await buscarDuplicadoValor(id, norm);
    if (dup) {
      if (dup.Activo) return res.status(409).json({ error: `"${nombre}" ya existe`, id: dup.IdValor });
      await query(DB, 'UPDATE Mae_CatalogoValores SET Activo = 1 WHERE IdValor = @id', { id: dup.IdValor });
      EventsService.emit('catalogo.valores.updated', { idCatalogo: id });
      return res.json({ IdValor: dup.IdValor, NombreValor: nombre, Activo: 1 });
    }

    const result = await query(DB, `
      INSERT INTO Mae_CatalogoValores (IdCatalogo, NombreValor) OUTPUT INSERTED.IdValor VALUES (@id, @n)
    `, { id, n: nombre });
    EventsService.emit('catalogo.valores.updated', { idCatalogo: id });
    res.status(201).json({ IdValor: result[0].IdValor, NombreValor: nombre, Activo: 1 });
  } catch (e) { next(e); }
});

// Editar valor
router.put('/:id/valores/:vid', roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const vid = Number(req.params.vid);
    const nombre = (req.body.NombreValor || '').trim().toUpperCase();
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
    const norm = normalizar(nombre);

    const dup = await buscarDuplicadoValor(id, norm, vid);
    if (dup) return res.status(409).json({ error: `"${nombre}" ya existe` });

    await query(DB, 'UPDATE Mae_CatalogoValores SET NombreValor = @n WHERE IdValor = @vid', { n: nombre, vid });
    EventsService.emit('catalogo.valores.updated', { idCatalogo: id });
    res.json({ success: true });
  } catch (e) { next(e); }
});

// Activar/Desactivar valor
router.patch('/:id/valores/:vid', roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    await query(DB, 'UPDATE Mae_CatalogoValores SET Activo = @a WHERE IdValor = @vid', { a: req.body.Activo ? 1 : 0, vid: Number(req.params.vid) });
    EventsService.emit('catalogo.valores.updated', { idCatalogo: Number(req.params.id) });
    res.json({ success: true });
  } catch (e) { next(e); }
});

export default router;