import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const actasConfig = {
  storagePath: process.env.ACTAS_STORAGE_PATH || path.join(__dirname, '..', '..', 'assets', 'actas'),
  publicUrl: process.env.ACTAS_PUBLIC_URL || 'http://localhost:5173',
  linkTtlHours: parseInt(process.env.ACTAS_LINK_TTL_HOURS || '72', 10),
  signatureMaxBytes: parseInt(process.env.ACTAS_SIGNATURE_MAX_BYTES || '500000', 10),
  dbName: process.env.DB_INVENTARIO || 'InventarioGP',
  // Rutas de red para el PDF firmado de ENTREGA, por tipo de equipo
  firmaPdfEntregaRuta: {
    LAPTOP: process.env.ACTAS_FIRMA_PDF_ENTREGA_RUTA_LAPTOP || '\\\\10.10.1.1\\10.Sistemas\\Documentos\\CARGO DE ENTREGA\\20260815 LAPTOPS',
    CELULAR: process.env.ACTAS_FIRMA_PDF_ENTREGA_RUTA_CELULAR || '\\\\10.10.1.1\\10.Sistemas\\Documentos\\CARGO DE ENTREGA\\20260815 - CELULARES',
    default: process.env.ACTAS_FIRMA_PDF_ENTREGA_RUTA || '',
  },
  // Rutas de red para el PDF firmado de DEVOLUCIÓN, por tipo de equipo
  firmaPdfDevolucionRuta: {
    LAPTOP: process.env.ACTAS_FIRMA_PDF_DEVOLUCION_RUTA_LAPTOP || '\\\\10.10.1.1\\10.Sistemas\\Documentos\\CARGO DE DEVOLUCION\\CARGO DEVOLUCIÓN LAPTOP',
    CELULAR: process.env.ACTAS_FIRMA_PDF_DEVOLUCION_RUTA_CELULAR || '\\\\10.10.1.1\\10.Sistemas\\Documentos\\CARGO DE DEVOLUCION\\20251810 - CARGO DE DEVOLUCIÓN DE EQUIPO CELULAR',
    default: process.env.ACTAS_FIRMA_PDF_DEVOLUCION_RUTA || '',
  },
};
