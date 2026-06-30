import { Router } from 'express';
import { IncidenciasService } from '../services/incidencias.service.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { incidenciaCreateSchema } from '../middleware/validators.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try {
    if (req.query.idEquipo) {
      const list = await IncidenciasService.getByEquipo(parseInt(req.query.idEquipo));
      return res.json(list);
    }
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

router.post('/', authMiddleware, roleMiddleware('ADMIN', 'TECNICO'), validate(incidenciaCreateSchema), async (req, res, next) => {
  try {
    const data = { ...req.body, IdUsuario: req.usuario.id };
    const id = await IncidenciasService.create(data);
    res.status(201).json({ id, message: 'Incidencia registrada' });
  } catch (e) { next(e); }
});

router.post('/:id/cerrar', authMiddleware, roleMiddleware('ADMIN', 'TECNICO'), async (req, res, next) => {
  try {
    await IncidenciasService.cerrar(parseInt(req.params.id), req.usuario.id);
    res.json({ message: 'Incidencia cerrada' });
  } catch (e) { next(e); }
});

export default router;
