import { Router } from 'express';
import { ComponentesService } from '../services/componentes.service.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  componenteCreateSchema,
  componenteUpdateSchema,
  componenteCreateTipoSchema,
} from '../middleware/validators.js';

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

router.get('/tipos/:id/plantilla', authMiddleware, async (req, res, next) => {
  try {
    const result = await ComponentesService.getPlantillaByTipo(Number(req.params.id));
    res.json(result || []);
  } catch (e) { next(e); }
});

router.get('/plantillas/:idPlantilla/valores', authMiddleware, async (req, res, next) => {
  try {
    const valores = await ComponentesService.listValoresPlantilla(Number(req.params.idPlantilla), req.query.q);
    res.json(valores);
  } catch (e) { next(e); }
});

router.get('/:id/caracteristicas', authMiddleware, async (req, res, next) => {
  try {
    const result = await ComponentesService.getCaracteristicas(Number(req.params.id));
    res.json(result || []);
  } catch (e) { next(e); }
});

router.put('/:id/caracteristicas', authMiddleware, roleMiddleware('ADMIN', 'TECNICO'), async (req, res, next) => {
  try {
    const result = await ComponentesService.saveCaracteristicas(
      Number(req.params.id),
      req.body.caracteristicas || [],
      req.usuario?.id,
    );
    res.json({ success: true, caracteristicas: result });
  } catch (e) { next(e); }
});

router.get('/accesorios-disponibles', authMiddleware, async (req, res, next) => {
  try {
    const list = await ComponentesService.listAccDisponibles();
    res.json(list);
  } catch (e) { next(e); }
});

router.get('/marcas', authMiddleware, async (req, res, next) => {
  try {
    const marcas = await ComponentesService.listMarcas(req.query.q);
    res.json(marcas);
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

router.post('/', authMiddleware, roleMiddleware('ADMIN', 'TECNICO'), validate(componenteCreateSchema), async (req, res, next) => {
  try {
    const id = await ComponentesService.create(req.body);
    res.status(201).json({ id });
  } catch (e) { next(e); }
});

router.post('/rapido', authMiddleware, roleMiddleware('ADMIN', 'TECNICO'), validate(componenteCreateSchema), async (req, res, next) => {
  try {
    const id = await ComponentesService.createQuick(req.body);
    res.status(201).json({ id });
  } catch (e) { next(e); }
});

router.put('/:id', authMiddleware, roleMiddleware('ADMIN', 'TECNICO'), validate(componenteUpdateSchema), async (req, res, next) => {
  try {
    await ComponentesService.update(parseInt(req.params.id), req.body);
    res.json({ message: 'Componente actualizado' });
  } catch (e) { next(e); }
});

router.post('/tipos', authMiddleware, roleMiddleware('ADMIN'), validate(componenteCreateTipoSchema), async (req, res, next) => {
  try {
    const id = await ComponentesService.createTipo(req.body);
    res.status(201).json({ id });
  } catch (e) { next(e); }
});

router.post('/:id/qr', authMiddleware, async (req, res, next) => {
  try {
    const comp = await ComponentesService.getById(parseInt(req.params.id));
    res.json({
      id: comp.IdComponente,
      codigo: comp.CodComponente,
      tipo: comp.DesTipodeComponente,
      marca: comp.Marca,
      modelo: comp.Modelo,
      url: `${req.protocol}://${req.get('host')}/api/componentes/${comp.IdComponente}`,
    });
  } catch (e) { next(e); }
});

router.get('/scan/:codigo', async (req, res, next) => {
  try {
    const detalle = await ComponentesService.getDetalleByCodigo(req.params.codigo);
    if (!detalle?.componente) return res.status(404).json({ error: 'Componente no encontrado' });
    res.json(detalle);
  } catch (e) { next(e); }
});

router.get('/catalogos/:nombre/search', authMiddleware, async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);
    const result = await ComponentesService.searchCatalogo(req.params.nombre, q);
    res.json(result);
  } catch (e) { next(e); }
});

export default router;
