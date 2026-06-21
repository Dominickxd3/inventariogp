import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { closeAll } from './config/db.js';

import equiposRoutes from './routes/equipos.routes.js';
import trabajadoresRoutes from './routes/trabajadores.routes.js';
import asignacionesRoutes from './routes/asignaciones.routes.js';
import incidenciasRoutes from './routes/incidencias.routes.js';
import componentesRoutes from './routes/componentes.routes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/equipos', equiposRoutes);
app.use('/api/trabajadores', trabajadoresRoutes);
app.use('/api/asignaciones', asignacionesRoutes);
app.use('/api/incidencias', incidenciasRoutes);
app.use('/api/componentes', componentesRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`🚀 InventarioGP API corriendo en http://localhost:${config.port}`);
  console.log(`📡 Conectado a SQL Server: ${config.db.server}`);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando conexiones...');
  await closeAll();
  server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeAll();
  server.close();
});
