import { Router } from 'express';
import { AsignacionesService } from '../services/asignaciones.service.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const list = await AsignacionesService.list(req.query);
    res.json(list);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const a = await AsignacionesService.getById(parseInt(req.params.id));
    if (!a) return res.status(404).json({ error: 'Asignación no encontrada' });
    res.json(a);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const id = await AsignacionesService.asignar(req.body);
    res.status(201).json({ id, message: 'Equipo asignado correctamente' });
  } catch (e) { next(e); }
});

router.post('/:id/cesar', async (req, res, next) => {
  try {
    await AsignacionesService.cesar(parseInt(req.params.id));
    res.json({ message: 'Asignación finalizada' });
  } catch (e) { next(e); }
});

router.get('/equipo/:idEquipo', async (req, res, next) => {
  try {
    const historial = await AsignacionesService.getHistorialByEquipo(parseInt(req.params.idEquipo));
    res.json(historial);
  } catch (e) { next(e); }
});

router.get('/trabajador/:idTrabajador', async (req, res, next) => {
  try {
    const historial = await AsignacionesService.getHistorialByTrabajador(parseInt(req.params.idTrabajador));
    res.json(historial);
  } catch (e) { next(e); }
});

export default router;
