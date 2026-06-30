import { Router } from 'express';
import { AuthService } from '../services/auth.service.js';
import { UsuariosRepository } from '../repositories/usuarios.repository.js';
import { AuditRepository } from '../repositories/audit.repository.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema } from '../middleware/validators.js';

const router = Router();

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { usuario, password } = req.body;
    const result = await AuthService.login(usuario, password, req);
    res.json(result);
  } catch (e) { next(e); }
});

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const usuario = await UsuariosRepository.getById(req.usuario.id);
    if (!usuario) return res.status(401).json({ error: 'Usuario no encontrado' });
    res.json({
      id: usuario.IdUsuario,
      logon: usuario.User_Logon,
      nombre: usuario.User_Fullname,
      email: usuario.User_Email,
      rol: usuario.Rol,
    });
  } catch (e) { next(e); }
});

router.get('/audit', authMiddleware, roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    const { usuario, limite } = req.query;
    const result = usuario
      ? await AuditRepository.intentosPorUsuario(usuario, parseInt(limite) || 20)
      : await AuditRepository.ultimosIntentos(parseInt(limite) || 50);
    res.json(result);
  } catch (e) { next(e); }
});

export default router;
