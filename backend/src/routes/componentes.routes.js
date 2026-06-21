import { Router } from 'express';
import { ComponentesRepository } from '../repositories/componentes.repository.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const list = await ComponentesRepository.listAll(req.query);
    res.json(list);
  } catch (e) { next(e); }
});

router.get('/tipos', async (req, res, next) => {
  try {
    const tipos = await ComponentesRepository.listTipos();
    res.json(tipos);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const c = await ComponentesRepository.getById(parseInt(req.params.id));
    if (!c) return res.status(404).json({ error: 'Componente no encontrado' });
    res.json(c);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const id = await ComponentesRepository.create(req.body);
    res.status(201).json({ id });
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    await ComponentesRepository.update(parseInt(req.params.id), req.body);
    res.json({ message: 'Componente actualizado' });
  } catch (e) { next(e); }
});

router.post('/tipos', async (req, res, next) => {
  try {
    const id = await ComponentesRepository.createTipo(req.body);
    res.status(201).json({ id });
  } catch (e) { next(e); }
});

export default router;
