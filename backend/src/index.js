import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { closeAll } from './config/db.js';
import { loginLimiter } from './middleware/rateLimiter.js';

const DOCS_URL = process.env.DOCUMENTOS_PDF_URL || 'http://localhost:3000';
let docsReady = false;

async function checkDocsPdf() {
  try {
    const res = await fetch(`${DOCS_URL}/api/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'check', dni: '0000', fecha: 'check', marca: '', modelo: '', color: '', ram: '', capacidad: '', serie: '', accesorios: '' }),
      signal: AbortSignal.timeout(8000),
    });
    docsReady = res.ok || res.status === 500;
    console.log(`[docs] documentos_pdf ${docsReady ? 'conectado' : 'no disponible'} en ${DOCS_URL}`);
  } catch {
    console.warn(`[docs] No se pudo conectar con documentos_pdf en ${DOCS_URL}`);
  }
}

import equiposRoutes from './routes/equipos.routes.js';
import trabajadoresRoutes from './routes/trabajadores.routes.js';
import asignacionesRoutes from './routes/asignaciones.routes.js';
import incidenciasRoutes from './routes/incidencias.routes.js';
import componentesRoutes from './routes/componentes.routes.js';
import authRoutes from './routes/auth.routes.js';
import actasRoutes from './routes/actas.routes.js';
import actasPublicRoutes from './routes/actas-public.routes.js';

const app = express();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-origin' },
  contentSecurityPolicy: false, // Desactivado para que Vite/HMR funcione en dev
}));

// CORS restringido
app.use(cors({
  origin: config.cors.origins,
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));

// Logging sanitizado (no loguear bodies en producción)
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));

// Rate limiting global opcional (100 req/15min por IP)
// import { rateLimit } from 'express-rate-limit';
// app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Rate limit específico para login
app.use('/api/auth/login', loginLimiter);

app.use('/api/equipos', equiposRoutes);
app.use('/api/trabajadores', trabajadoresRoutes);
app.use('/api/asignaciones', asignacionesRoutes);
app.use('/api/incidencias', incidenciasRoutes);
app.use('/api/componentes', componentesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/actas', actasRoutes);
app.use('/api/public/actas', actasPublicRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`InventarioGP API corriendo en puerto ${config.port} [${config.env}]`);
  checkDocsPdf();
});

process.on('SIGINT', async () => {
  console.log('Cerrando conexiones...');
  await closeAll();
  server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeAll();
  server.close();
});
