import 'dotenv/config';

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001'),
  db: {
    server: process.env.DB_SERVER || '127.0.0.1',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD,
    inventario: process.env.DB_INVENTARIO || 'InventarioGP',
    siga: process.env.DB_SIGA || 'SIGA_ASISTENCIA',
    gp2024: process.env.DB_GP2024 || 'dbGP_2024_GP',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
  cors: {
    origins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
      : ['http://localhost:5173', 'http://localhost:3000'],
  },
  actas: {
    storagePath: process.env.ACTAS_STORAGE_PATH || '',
    publicUrl: process.env.ACTAS_PUBLIC_URL || '',
    linkTtlHours: parseInt(process.env.ACTAS_LINK_TTL_HOURS || '72', 10),
    signatureMaxBytes: parseInt(process.env.ACTAS_SIGNATURE_MAX_BYTES || '500000', 10),
    fontPath: process.env.ACTAS_FONT_PATH || '',
  },
};
