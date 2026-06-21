import { Router } from 'express';
import { AuthService } from '../services/auth.service.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    const { usuario, password } = req.body;
    if (!usuario || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    const result = await AuthService.login(usuario, password);
    res.json(result);
  } catch (e) { next(e); }
});

router.post('/usuarios', authMiddleware, roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    const id = await AuthService.crearUsuario(req.body);
    res.status(201).json({ id, message: 'Usuario creado' });
  } catch (e) { next(e); }
});

router.get('/me', authMiddleware, (req, res) => {
  res.json(req.usuario);
});

export default router;
