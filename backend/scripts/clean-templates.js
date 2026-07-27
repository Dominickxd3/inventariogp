import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'node:fs/promises';

const FILES = [
  {
    src: 'D:\\inventariogp\\20250605 01 CARGO DE ENTREGA DE EQUIPO LAPTOP - FORMATO - copia.pdf',
    dst: 'D:\\inventariogp\\backend\\assets\\actas\\templates\\entrega-laptop-v1.pdf',
    areas: [
      // nombre trabajador
      { x: 60, y: 575, w: 450, h: 20 },
      // tabla: marca, modelo, color, ram, capacidad, serie
      { x: 60, y: 465, w: 450, h: 120 },
      // fecha
      { x: 60, y: 220, w: 380, h: 25 },
      // nombre firmante
      { x: 60, y: 153, w: 380, h: 20 },
      // DNI
      { x: 60, y: 135, w: 250, h: 18 },
    ],
  },
  {
    src: 'D:\\inventariogp\\20250430 01 CARGO DE DEVOLUCIÓN DE EQUIPO LAPTOP - FORMATO.pdf',
    dst: 'D:\\inventariogp\\backend\\assets\\actas\\templates\\devolucion-laptop-v1.pdf',
    areas: [
      // "RECIBÍ DE" + nombre
      { x: 60, y: 600, w: 220, h: 22 },
      // tabla: marca, modelo, color, ram, capacidad, serie
      { x: 60, y: 460, w: 450, h: 130 },
      // fecha
      { x: 60, y: 355, w: 380, h: 25 },
      // nombre firmante (derecha)
      { x: 320, y: 253, w: 170, h: 18 },
      // DNI firmante (derecha)
      { x: 320, y: 240, w: 170, h: 18 },
    ],
  },
];

for (const f of FILES) {
  const bytes = await fs.readFile(f.src);
  const pdfDoc = await PDFDocument.load(bytes);
  const page = pdfDoc.getPage(0);

  for (const area of f.areas) {
    page.drawRectangle({
      x: area.x,
      y: area.y,
      width: area.w,
      height: area.h,
      color: rgb(1, 1, 1),
    });
  }

  const out = await pdfDoc.save();
  await fs.writeFile(f.dst, Buffer.from(out));
  console.log(`✓ Limpiado: ${f.dst}`);
}
