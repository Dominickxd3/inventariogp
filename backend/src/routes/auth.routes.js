import { Router } from 'express';
import { AuthService } from '../services/auth.service.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    const { usuario, password } = req.body;
    if (!usuario || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    const result = await AuthService.login(usuario, password, req);
    res.json(result);
  } catch (e) { next(e); }
});

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const { UsuariosRepository } = await import('../repositories/usuarios.repository.js');
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
    const { AuditRepository } = await import('../repositories/audit.repository.js');
    const result = usuario
      ? await AuditRepository.intentosPorUsuario(usuario, parseInt(limite) || 20)
      : await AuditRepository.ultimosIntentos(parseInt(limite) || 50);
    res.json(result);
  } catch (e) { next(e); }
});

export default router;
