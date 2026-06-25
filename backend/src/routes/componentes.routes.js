import { Router } from 'express';
import { ComponentesService } from '../services/componentes.service.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const list = await ComponentesService.list(req.query);
    res.json(list);
  } catch (e) { next(e); }
});

router.get('/tipos', async (req, res, next) => {
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

router.get('/:id', async (req, res, next) => {
  try {
    const c = await ComponentesService.getById(parseInt(req.params.id));
    if (!c) return res.status(404).json({ error: 'Componente no encontrado' });
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
