import { Router } from 'express';
import { ActasService } from '../services/actas.service.js';
import { validate } from '../middleware/validate.js';
import { actaValidarSchema, actaFirmarSchema } from '../validators/actas.validators.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/validar', loginLimiter, validate(actaValidarSchema), async (req, res, next) => {
  try {
    const result = await ActasService.validarEnlace(req.body.token, req.body.ultimosCuatroDni);
    res.json(result);
  } catch (e) {
    const status = e.statusCode || 500;
    if (status === 500) return next(e);
    res.status(status).json({ error: e.message });
  }
});

router.post('/firmar', loginLimiter, validate(actaFirmarSchema), async (req, res, next) => {
  try {
    const result = await ActasService.firmar(req.body.token, req.body.ultimosCuatroDni, req.body.firmaBase64);
    res.json(result);
  } catch (e) {
    const status = e.statusCode || 500;
    if (status === 500) return next(e);
    res.status(status).json({ error: e.message });
  }
});

export default router;
