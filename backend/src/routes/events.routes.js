import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { EventsService } from '../services/events.service.js';

const router = Router();

router.get('/', (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  try {
    jwt.verify(token, config.jwt.secret);
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
  EventsService.subscribe(req, res);
});

export default router;