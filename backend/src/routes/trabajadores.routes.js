import { Router } from 'express';
import { TrabajadoresRepository } from '../repositories/trabajadores.repository.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const trabajadores = await TrabajadoresRepository.search(req.query);
    res.json(trabajadores);
  } catch (e) { next(e); }
});

router.post('/sync', authMiddleware, roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    const result = await TrabajadoresRepository.sync();
    res.json(result);
  } catch (e) { next(e); }
});

router.get('/areas', async (req, res, next) => {
  try {
    const areas = await TrabajadoresRepository.getAreas();
    res.json(areas);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const t = await TrabajadoresRepository.getById(parseInt(req.params.id));
    if (!t) return res.status(404).json({ error: 'Trabajador no encontrado' });
    res.json(t);
  } catch (e) { next(e); }
});

router.get('/dni/:dni', async (req, res, next) => {
  try {
    const t = await TrabajadoresRepository.getByDNI(req.params.dni);
    if (!t) return res.status(404).json({ error: 'Trabajador no encontrado' });
    res.json(t);
  } catch (e) { next(e); }
});

export default router;
