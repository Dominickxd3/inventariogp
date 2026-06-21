import { Router } from 'express';
import { EquiposService } from '../services/equipos.service.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const equipos = await EquiposService.list(req.query);
    res.json(equipos);
  } catch (e) { next(e); }
});

router.get('/dashboard', async (req, res, next) => {
  try {
    const data = await EquiposService.dashboard();
    res.json(data);
  } catch (e) { next(e); }
});

router.get('/tipos', async (req, res, next) => {
  try {
    const tipos = await EquiposService.listTipos();
    res.json(tipos);
  } catch (e) { next(e); }
});

router.get('/scan/:codigo', async (req, res, next) => {
  try {
    const equipo = await EquiposService.getByCodigo(req.params.codigo);
    if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' });
    res.json(equipo);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const equipo = await EquiposService.getById(parseInt(req.params.id));
    if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' });
    res.json(equipo);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const equipo = await EquiposService.create(req.body);
    res.status(201).json(equipo);
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const equipo = await EquiposService.update(parseInt(req.params.id), req.body);
    res.json(equipo);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await EquiposService.delete(parseInt(req.params.id));
    res.status(204).end();
  } catch (e) { next(e); }
});

router.post('/:id/qr', async (req, res, next) => {
  try {
    const qr = await EquiposService.generarQR(parseInt(req.params.id));
    if (!qr) return res.status(404).json({ error: 'Equipo no encontrado' });
    res.json(qr);
  } catch (e) { next(e); }
});

router.post('/tipos', async (req, res, next) => {
  try {
    const id = await EquiposService.createTipo(req.body);
    res.status(201).json({ id });
  } catch (e) { next(e); }
});

router.post('/:id/estado', async (req, res, next) => {
  try {
    const equipo = await EquiposService.cambiarEstado(
      parseInt(req.params.id),
      req.body.estado,
      req.usuario?.id,
      req.body.obs
    );
    res.json(equipo);
  } catch (e) { next(e); }
});

router.get('/:id/historial-estados', async (req, res, next) => {
  try {
    const historial = await EquiposService.getHistorialEstados(parseInt(req.params.id));
    res.json(historial);
  } catch (e) { next(e); }
});

export default router;
