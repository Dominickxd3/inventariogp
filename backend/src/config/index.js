import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  db: {
    server: process.env.DB_SERVER || '10.10.1.6',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Grupecsac0606',
    inventario: process.env.DB_INVENTARIO || 'InventarioGP',
    siga: process.env.DB_SIGA || 'SIGA_ASISTENCIA',
    gp2024: process.env.DB_GP2024 || 'dbGP_2024_GP',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'grupecsac-inventario-secret-key-2026',
  },
};
