import { Router } from 'express';
import { ComponentesService } from '../services/componentes.service.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const list = await ComponentesService.list(req.query);
    res.json(list);
  } catch (e) { next(e); }
});

router.get('/tipos', authMiddleware, async (req, res, next) => {
  try {
    const tipos = await ComponentesService.listTipos();
    res.json(tipos);
  } catch (e) { next(e); }
});

router.get('/accesorios-disponibles', authMiddleware, async (req, res, next) => {
  try {
    const list = await ComponentesService.listAccDisponibles();
    res.json(list);
  } catch (e) { next(e); }
});

router.get('/accesorios-por-trabajador/:idTrabajador', authMiddleware, async (req, res, next) => {
  try {
    const accs = await ComponentesService.listAccsPorTrabajador(parseInt(req.params.idTrabajador));
    res.json(accs);
  } catch (e) { next(e); }
});

router.get('/:id/detalle', authMiddleware, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID de componente inválido' });
    }
    const detalle = await ComponentesService.getDetalle(id);
    res.json(detalle);
  } catch (e) {
    console.error('[componentes.routes] Error en GET /:id/detalle:', e.message);
    next(e);
  }
});

router.post('/:id/baja', authMiddleware, roleMiddleware('ADMIN', 'TECNICO'), async (req, res, next) => {
  try {
    await ComponentesService.baja(parseInt(req.params.id));
    res.json({ message: 'Componente dado de baja' });
  } catch (e) { next(e); }
});

router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const c = await ComponentesService.getById(parseInt(req.params.id));
    res.json(c);
  } catch (e) { next(e); }
});

router.post('/', authMiddleware, roleMiddleware('ADMIN', 'TECNICO'), async (req, res, next) => {
  try {
    const id = await ComponentesService.create(req.body);
    res.status(201).json({ id });
  } catch (e) { next(e); }
});

router.post('/rapido', authMiddleware, roleMiddleware('ADMIN', 'TECNICO'), async (req, res, next) => {
  try {
    const id = await ComponentesService.createQuick(req.body);
    res.status(201).json({ id });
  } catch (e) { next(e); }
});

router.put('/:id', authMiddleware, roleMiddleware('ADMIN', 'TECNICO'), async (req, res, next) => {
  try {
    await ComponentesService.update(parseInt(req.params.id), req.body);
    res.json({ message: 'Componente actualizado' });
  } catch (e) { next(e); }
});

router.post('/tipos', authMiddleware, roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    const id = await ComponentesService.createTipo(req.body);
    res.status(201).json({ id });
  } catch (e) { next(e); }
});

export default router;
