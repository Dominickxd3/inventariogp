import { Router } from 'express';
import { EquiposService } from '../services/equipos.service.js';
import { IncidenciasService } from '../services/incidencias.service.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

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

router.post('/rapido', async (req, res, next) => {
  try {
    const equipo = await EquiposService.createQuick({
      ...req.body,
      IdUsuario: req.usuario?.id || 1,
    });
    res.status(201).json({ success: true, equipo });
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

router.get('/:id/caracteristicas', async (req, res, next) => {
  try {
    const caracteristicas = await EquiposService.getCaracteristicas(parseInt(req.params.id));
    res.json(caracteristicas);
  } catch (e) { next(e); }
});

router.put('/:id/caracteristicas', authMiddleware, roleMiddleware('ADMIN', 'TECNICO'), async (req, res, next) => {
  try {
    const caracteristicas = await EquiposService.saveCaracteristicas(
      parseInt(req.params.id),
      req.body.caracteristicas || [],
      req.usuario?.id
    );
    res.json({ success: true, caracteristicas });
  } catch (e) { next(e); }
});

router.get('/:id/componentes', async (req, res, next) => {
  try {
    const componentes = await EquiposService.getComponentesDelEquipo(parseInt(req.params.id));
    res.json(componentes);
  } catch (e) { next(e); }
});

router.post('/:id/componentes', authMiddleware, roleMiddleware('ADMIN', 'TECNICO'), async (req, res, next) => {
  try {
    const id = await EquiposService.agregarComponenteAEquipo(
      parseInt(req.params.id),
      req.body.IdComponente,
      req.body.Obs,
      req.usuario?.id || 1,
      req.body.OrigenVinculo,
      req.body.Motivo,
      req.body.IdIntervencion
    );
    res.status(201).json({ success: true, id });
  } catch (e) { next(e); }
});

router.delete('/:id/componentes/:idMovComponente', authMiddleware, roleMiddleware('ADMIN', 'TECNICO'), async (req, res, next) => {
  try {
    await EquiposService.quitarComponenteDeEquipo(
      parseInt(req.params.id),
      parseInt(req.params.idMovComponente),
      req.usuario?.id || 1,
      req.body.Motivo,
      req.body.NuevoEstado || 'DISPONIBLE'
    );
    res.json({ success: true });
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

router.get('/:id/incidencias', authMiddleware, async (req, res, next) => {
  try {
    const incidencias = await IncidenciasService.getByEquipo(parseInt(req.params.id));
    res.json(incidencias);
  } catch (e) { next(e); }
});

router.get('/:id/intervenciones', authMiddleware, async (req, res, next) => {
  try {
    const intervenciones = await EquiposService.getIntervenciones(parseInt(req.params.id));
    res.json(intervenciones);
  } catch (e) { next(e); }
});

router.post('/:id/intervenciones', authMiddleware, roleMiddleware('ADMIN', 'TECNICO'), async (req, res, next) => {
  try {
    const id = await EquiposService.crearIntervencion(
      parseInt(req.params.id),
      req.body,
      req.usuario?.id
    );
    res.status(201).json({ success: true, id });
  } catch (e) { next(e); }
});

export default router;
