import { Router } from 'express';
import { TrabajadoresRepository } from '../repositories/trabajadores.repository.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const trabajadores = await TrabajadoresRepository.search(req.query);
    res.json(trabajadores);
  } catch (e) { next(e); }
});

router.get('/areas', async (req, res, next) => {
  try {
    const areas = await TrabajadoresRepository.getAreas();
    res.json(areas);
  } catch (e) { next(e); }
});

router.get('/gerencias', async (req, res, next) => {
  try {
    const gerencias = await TrabajadoresRepository.getGerencias();
    res.json(gerencias);
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
