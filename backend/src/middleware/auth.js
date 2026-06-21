export function authMiddleware(req, res, next) {
  const token = req.headers['x-auth-token'];
  if (!token || token !== 'grupecsac-inventario-2026') {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
}
