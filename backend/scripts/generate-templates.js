import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '..', 'assets', 'actas', 'templates');
const FONT_PATH = 'C:\\Windows\\Fonts\\times.ttf';
const A4_W = 595.276;
const A4_H = 841.890;

if (!fs.existsSync(TEMPLATES_DIR)) fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
if (!fs.existsSync(FONT_PATH)) throw new Error(`Fuente no encontrada: ${FONT_PATH}`);

async function embedFont(pdfDoc) {
  pdfDoc.registerFontkit(fontkit);
  const bytes = fs.readFileSync(FONT_PATH);
  return pdfDoc.embedFont(bytes, { subset: true });
}

function drawText(page, text, x, y, font, size = 11, color = rgb(0, 0, 0), options = {}) {
  page.drawText(String(text || ''), { x, y, size, font, color, ...options });
}

function drawLine(page, x1, y1, x2, y2, thickness = 1, color = rgb(0, 0, 0)) {
  page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color });
}

function drawRect(page, x, y, w, h, color = rgb(0.9, 0.9, 0.9), borderColor = rgb(0.6, 0.6, 0.6)) {
  page.drawRectangle({ x, y, width: w, height: h, color, borderColor, borderWidth: 0.5 });
}

async function generateTemplate(title, filename) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const font = await embedFont(pdfDoc);
  const boldFont = font;
  const page = pdfDoc.addPage([A4_W, A4_H]);

  const ML = 60;
  const MR = A4_W - 60;
  const col1 = ML;
  const col2 = 220;

  // === LOGO placeholder ===
  drawRect(page, ML, A4_H - 120, 90, 60, rgb(0.05, 0.15, 0.35), rgb(0.05, 0.15, 0.35));
  drawText(page, 'GP', ML + 28, A4_H - 95, font, 24, rgb(1, 1, 1));

  // === HEADER ===
  drawText(page, 'GRUPO PECUARIO S.A.C.', 170, A4_H - 65, font, 14, rgb(0.05, 0.15, 0.35));
  drawText(page, 'RUC: 20513967234', 170, A4_H - 82, font, 10, rgb(0.3, 0.3, 0.3));

  // === TITLE ===
  const titleY = A4_H - 145;
  drawText(page, title, A4_W / 2, titleY, font, 15, rgb(0, 0, 0), { xAlign: 'center' });
  drawLine(page, ML + 40, titleY - 4, MR - 40, titleY - 4, 1.5, rgb(0.05, 0.15, 0.35));

  // === TRABAJADOR SECTION ===
  const sec1Y = A4_H - 210;
  drawRect(page, ML, sec1Y - 5, MR - ML, 18, rgb(0.05, 0.15, 0.35));
  drawText(page, 'DATOS DEL TRABAJADOR', ML + 8, sec1Y + 4, font, 10, rgb(1, 1, 1));

  // Labels
  const dataY = sec1Y - 30;
  drawText(page, 'Trabajador:', ML, dataY, font, 10, rgb(0.3, 0.3, 0.3));
  drawText(page, 'DNI:', col2, dataY, font, 10, rgb(0.3, 0.3, 0.3));

  // Underline for worker name and DNI
  drawLine(page, ML + 65, dataY - 2, col2 - 10, dataY - 2, 0.5, rgb(0.6, 0.6, 0.6));
  drawLine(page, col2 + 30, dataY - 2, MR, dataY - 2, 0.5, rgb(0.6, 0.6, 0.6));

  // === EQUIPO SECTION ===
  const sec2Y = A4_H - 290;
  drawRect(page, ML, sec2Y - 5, MR - ML, 18, rgb(0.05, 0.15, 0.35));
  drawText(page, 'DATOS DEL EQUIPO', ML + 8, sec2Y + 4, font, 10, rgb(1, 1, 1));

  // Table header
  const tblY = sec2Y - 30;
  drawRect(page, ML, tblY, MR - ML, 18, rgb(0.9, 0.92, 0.95));
  drawLine(page, MR / 2, tblY, MR / 2, tblY - 18, 0.5, rgb(0.6, 0.6, 0.6));
  drawLine(page, ML, tblY, MR, tblY, 0.5, rgb(0.6, 0.6, 0.6));
  drawText(page, 'Característica', ML + 8, tblY + 4, font, 9, rgb(0.2, 0.2, 0.2));
  drawText(page, 'Detalle', MR / 2 + 8, tblY + 4, font, 9, rgb(0.2, 0.2, 0.2));

  // Table rows (8 rows)
  const rows = ['Tipo', 'Marca', 'Modelo', 'Color', 'Memoria RAM', 'Almacenamiento', 'N° de Serie', 'Código'];
  let rowY = tblY - 18;
  for (const label of rows) {
    drawLine(page, ML, rowY, MR, rowY, 0.3, rgb(0.75, 0.75, 0.75));
    drawText(page, label, ML + 8, rowY + 4, font, 9, rgb(0.3, 0.3, 0.3));
    rowY -= 18;
  }
  drawLine(page, ML, rowY, MR, rowY, 0.5, rgb(0.6, 0.6, 0.6));
  drawLine(page, MR / 2, rowY, MR / 2, tblY, 0.5, rgb(0.6, 0.6, 0.6));
  drawLine(page, ML, rowY, ML, tblY, 0.5, rgb(0.6, 0.6, 0.6));
  drawLine(page, MR, rowY, MR, tblY, 0.5, rgb(0.6, 0.6, 0.6));

  // === ACCESORIOS SECTION ===
  const accY = rowY - 30;
  drawRect(page, ML, accY - 5, MR - ML, 18, rgb(0.05, 0.15, 0.35));
  drawText(page, 'ACCESORIOS', ML + 8, accY + 4, font, 10, rgb(1, 1, 1));
  drawText(page, '(Entregados al trabajador)', MR - 130, accY + 4, font, 8, rgb(0.8, 0.85, 0.9));

  // === DECLARATION ===
  const declY = accY - 55;
  drawText(page, 'Declaro haber recibido el equipo descrito en buen estado y acepto las condiciones de uso', ML, declY, font, 9, rgb(0.2, 0.2, 0.2));
  drawText(page, 'y responsabilidad sobre el cuidado del mismo. Entiendo que soy responsable por cualquier', ML, declY - 13, font, 9, rgb(0.2, 0.2, 0.2));
  drawText(page, 'daño, pérdida o extravío del equipo y accesorios asignados.', ML, declY - 26, font, 9, rgb(0.2, 0.2, 0.2));

  // === FIRMA SECTION ===
  const firmaY = declY - 60;
  drawText(page, 'FIRMA DEL TRABAJADOR', ML + 60, firmaY, font, 10, rgb(0.05, 0.15, 0.35));
  drawLine(page, ML + 60, firmaY - 5, ML + 60 + 250, firmaY - 5, 1, rgb(0, 0, 0));

  // === WATERMARK ===
  page.drawText('GRUPO PECUARIO S.A.C.', {
    x: 180,
    y: 400,
    size: 36,
    font,
    color: rgb(0.85, 0.85, 0.88),
    opacity: 0.2,
  });

  // === FOOTER ===
  drawLine(page, ML, 70, MR, 70, 0.3, rgb(0.6, 0.6, 0.6));
  drawText(page, 'Av. Canto Bello 200 Urb. Canto Bello Lima 36 - Telf. 3872967 - 922386045', A4_W / 2, 55, font, 7.5, rgb(0.5, 0.5, 0.5), { xAlign: 'center' });
  drawText(page, 'Documento generado electrónicamente por InventarioGP', A4_W / 2, 43, font, 7, rgb(0.6, 0.6, 0.6), { xAlign: 'center' });

  const pdfBytes = await pdfDoc.save();
  const outPath = path.join(TEMPLATES_DIR, filename);
  fs.writeFileSync(outPath, pdfBytes);
  console.log(`Template generado: ${outPath}`);
}

async function main() {
  await generateTemplate('CARGO DE ENTREGA DE EQUIPO', 'entrega-laptop-v1.pdf');
  await generateTemplate('CARGO DE DEVOLUCIÓN DE EQUIPO', 'devolucion-laptop-v1.pdf');
  console.log('Templates generados correctamente.');
}

main().catch(console.error);
