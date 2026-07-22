import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.join(__dirname, '..', '..', 'assets', 'actas', 'templates');

export const actasConfig = {
  storagePath: process.env.ACTAS_STORAGE_PATH || path.join(__dirname, '..', '..', 'assets', 'actas'),
  publicUrl: process.env.ACTAS_PUBLIC_URL || 'http://localhost:5173',
  linkTtlHours: parseInt(process.env.ACTAS_LINK_TTL_HOURS || '72', 10),
  signatureMaxBytes: parseInt(process.env.ACTAS_SIGNATURE_MAX_BYTES || '500000', 10),
  fontPath: process.env.ACTAS_FONT_PATH || 'C:\\Windows\\Fonts\\times.ttf',
  dbName: process.env.DB_INVENTARIO || 'InventarioGP',
  templateEntrega: process.env.ACTAS_TEMPLATE_ENTREGA_PATH || path.join(templatesDir, 'entrega-laptop-v1.pdf'),
  templateDevolucion: process.env.ACTAS_TEMPLATE_DEVOLUCION_PATH || path.join(templatesDir, 'devolucion-laptop-v1.pdf'),
  templatesDir,
};
