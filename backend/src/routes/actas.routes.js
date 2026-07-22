import { Router } from 'express';
import { ActasService } from '../services/actas.service.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { actaAnularSchema, actaRegenerarEnlaceSchema } from '../validators/actas.validators.js';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const result = await ActasService.list(req.query);
    res.json(result);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const a = await ActasService.getById(Number(req.params.id));
    if (!a) return res.status(404).json({ error: 'Acta no encontrada' });
    res.json(a);
  } catch (e) { next(e); }
});

router.get('/:id/pdf', async (req, res, next) => {
  try {
    const pdf = await ActasService.getPdf(Number(req.params.id));
    if (!pdf) return res.status(404).json({ error: 'PDF no encontrado' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${pdf.nombre}"`);
    res.sendFile(pdf.ruta);
  } catch (e) { next(e); }
});

router.post('/:id/regenerar-enlace', roleMiddleware('ADMIN', 'TECNICO'), async (req, res, next) => {
  try {
    const result = await ActasService.regenerarEnlace(Number(req.params.id), req.usuario.id);
    res.json(result);
  } catch (e) { next(e); }
});

router.post('/:id/anular', roleMiddleware('ADMIN'), validate(actaAnularSchema), async (req, res, next) => {
  try {
    const result = await ActasService.anular(Number(req.params.id), req.body.motivo, req.usuario.id);
    res.json(result);
  } catch (e) { next(e); }
});

export default router;
