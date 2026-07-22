import { Router } from 'express';
import { AsignacionesService } from '../services/asignaciones.service.js';
import { ActasService } from '../services/actas.service.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asignacionCreateSchema, asignacionCesarSchema } from '../middleware/validators.js';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const result = await AsignacionesService.list(req.query);
    res.json(result);
  } catch (e) { next(e); }
});

router.get('/:id/detalle', async (req, res, next) => {
  try {
    const data = await AsignacionesService.getDetalle(Number(req.params.id));
    res.json(data);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const a = await AsignacionesService.getById(parseInt(req.params.id));
    if (!a) return res.status(404).json({ error: 'Asignación no encontrada' });
    res.json(a);
  } catch (e) { next(e); }
});

router.post('/', roleMiddleware('ADMIN', 'TECNICO'), validate(asignacionCreateSchema), async (req, res, next) => {
  try {
    const data = { ...req.body, IdUsuario: req.usuario.id };
    const id = await AsignacionesService.asignar(data);

    const actaResult = await ActasService.generarAutomatica({
      idMovEquipoAsignacion: id,
      tipoActa: 'ENTREGA',
      idUsuarioGenera: req.usuario.id,
    });

    if (actaResult.success) {
      res.status(201).json({
        id,
        message: 'Equipo asignado correctamente',
        acta: actaResult.acta,
      });
    } else {
      res.status(201).json({
        id,
        message: 'Equipo asignado correctamente',
        asignacionCreada: true,
        actaGenerada: false,
        warning: `La asignación fue creada, pero el acta no pudo generarse: ${actaResult.error}`,
      });
    }
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

    const actaResult = await ActasService.generarAutomatica({
      idMovEquipoAsignacion: result.idAsig,
      tipoActa: 'ENTREGA',
      idUsuarioGenera: req.usuario.id,
    });

    if (actaResult.success) {
      res.status(201).json({ success: true, ...result, acta: actaResult.acta });
    } else {
      res.status(201).json({
        success: true,
        ...result,
        asignacionCreada: true,
        actaGenerada: false,
        warning: `La asignación fue creada, pero el acta no pudo generarse: ${actaResult.error}`,
      });
    }
  } catch (e) { next(e); }
});

router.post('/:id/cesar', roleMiddleware('ADMIN', 'TECNICO'), validate(asignacionCesarSchema), async (req, res, next) => {
  try {
    await AsignacionesService.cesar(parseInt(req.params.id), req.usuario.id, req.body?.accesorios, req.body);

    const actaResult = await ActasService.generarAutomatica({
      idMovEquipoAsignacion: parseInt(req.params.id),
      tipoActa: 'DEVOLUCION',
      idUsuarioGenera: req.usuario.id,
    });

    if (actaResult.success) {
      res.json({ message: 'Asignación finalizada', acta: actaResult.acta });
    } else {
      res.json({
        message: 'Asignación finalizada',
        actaGenerada: false,
        warning: `La asignación fue cesada, pero el acta de devolución no pudo generarse: ${actaResult.error}`,
      });
    }
  } catch (e) { next(e); }
});

router.get('/:id/accesorios', async (req, res, next) => {
  try {
    const accs = await AsignacionesService.getAccsByAsignacion(parseInt(req.params.id));
    res.json(accs);
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

router.get('/:id/acta/estado', async (req, res, next) => {
  try {
    const actas = await ActasService.getStatusByAsignacion(parseInt(req.params.id));
    res.json(actas);
  } catch (e) { next(e); }
});

router.post('/:id/acta/reintentar', roleMiddleware('ADMIN', 'TECNICO'), async (req, res, next) => {
  try {
    const result = await ActasService.reintentar(parseInt(req.params.id), req.usuario.id);
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
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
