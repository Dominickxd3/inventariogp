import { Router } from 'express';
import { IncidenciasService } from '../services/incidencias.service.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const list = await IncidenciasService.list(req.query);
    res.json(list);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const i = await IncidenciasService.getById(parseInt(req.params.id));
    if (!i) return res.status(404).json({ error: 'Incidencia no encontrada' });
    res.json(i);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const id = await IncidenciasService.create(req.body);
    res.status(201).json({ id, message: 'Incidencia registrada' });
  } catch (e) { next(e); }
});

router.post('/:id/cerrar', async (req, res, next) => {
  try {
    await IncidenciasService.cerrar(parseInt(req.params.id));
    res.json({ message: 'Incidencia cerrada' });
  } catch (e) { next(e); }
});

export default router;
