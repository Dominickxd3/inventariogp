import { Router } from 'express';
import { AsignacionesService } from '../services/asignaciones.service.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const result = await AsignacionesService.list(req.query);
    res.json(result);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const a = await AsignacionesService.getById(parseInt(req.params.id));
    if (!a) return res.status(404).json({ error: 'Asignación no encontrada' });
    res.json(a);
  } catch (e) { next(e); }
});

router.post('/', roleMiddleware('ADMIN', 'TECNICO'), async (req, res, next) => {
  try {
    const data = { ...req.body, IdUsuario: req.usuario.id };
    const id = await AsignacionesService.asignar(data);
    res.status(201).json({ id, message: 'Equipo asignado correctamente' });
  } catch (e) { next(e); }
});

router.post('/bulk', roleMiddleware('ADMIN', 'TECNICO'), async (req, res, next) => {
  try {
    const results = await AsignacionesService.asignarMulti(req.body, req.usuario.id);
    res.status(201).json({ success: true, results });
  } catch (e) { next(e); }
});

router.post('/con-accesorios', roleMiddleware('ADMIN', 'TECNICO'), async (req, res, next) => {
  try {
    const result = await AsignacionesService.asignarConAccesorios({
      ...req.body,
      IdUsuario: req.usuario.id,
    });
    res.status(201).json({ success: true, ...result });
  } catch (e) { next(e); }
});

router.post('/:id/cesar', roleMiddleware('ADMIN', 'TECNICO'), async (req, res, next) => {
  try {
    await AsignacionesService.cesar(parseInt(req.params.id), req.usuario.id);
    res.json({ message: 'Asignación finalizada' });
  } catch (e) { next(e); }
});

router.post('/cesar-trabajador/:idTrabajador', roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    const result = await AsignacionesService.cesarActivasByTrabajador(parseInt(req.params.idTrabajador), req.usuario.id);
    res.json(result);
  } catch (e) { next(e); }
});

router.get('/:id/acta', async (req, res, next) => {
  try {
    const a = await AsignacionesService.getActa(parseInt(req.params.id));
    if (!a) return res.status(404).json({ error: 'Asignación no encontrada' });
    res.send(a);
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

router.get('/trabajador/:idTrabajador/activas', async (req, res, next) => {
  try {
    const activas = await AsignacionesService.getActivasByTrabajador(parseInt(req.params.idTrabajador));
    res.json(activas);
  } catch (e) { next(e); }
});

export default router;
