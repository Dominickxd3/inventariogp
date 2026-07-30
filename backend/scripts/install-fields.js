import { PDFDocument } from 'pdf-lib';
import fs from 'node:fs/promises';

const CAMPOS_ENTREGA = [
  { nombre: 'txtAsignado', x: 155, y: 485, w: 280, h: 14, size: 10 },
  { nombre: 'txtMarca', x: 155, y: 463, w: 280, h: 14, size: 10 },
  { nombre: 'txtModelo', x: 155, y: 441, w: 280, h: 14, size: 10 },
  { nombre: 'txtColor', x: 155, y: 419, w: 280, h: 14, size: 10 },
  { nombre: 'txtRam', x: 155, y: 397, w: 280, h: 14, size: 10 },
  { nombre: 'txtCapacidad', x: 155, y: 375, w: 280, h: 14, size: 10 },
  { nombre: 'txtSerie', x: 155, y: 353, w: 280, h: 14, size: 10 },
  { nombre: 'txtAccesorios', x: 70, y: 260, w: 400, h: 70, size: 9, multiline: true },
  { nombre: 'txtFecha', x: 250, y: 215, w: 150, h: 14, size: 10 },
  { nombre: 'txtNombreFirmante', x: 115, y: 145, w: 220, h: 14, size: 10 },
  { nombre: 'txtDniFirmante', x: 115, y: 125, w: 120, h: 14, size: 10 },
  { nombre: 'imgFirma', x: 75, y: 160, w: 180, h: 50, esFirma: true },
];

const CAMPOS_DEVOLUCION = [
  { nombre: 'txtRecibiDe', x: 150, y: 650, w: 250, h: 14, size: 10 },
  { nombre: 'txtAsignado', x: 155, y: 485, w: 280, h: 14, size: 10 },
  { nombre: 'txtMarca', x: 155, y: 463, w: 280, h: 14, size: 10 },
  { nombre: 'txtModelo', x: 155, y: 441, w: 280, h: 14, size: 10 },
  { nombre: 'txtColor', x: 155, y: 419, w: 280, h: 14, size: 10 },
  { nombre: 'txtRam', x: 155, y: 397, w: 280, h: 14, size: 10 },
  { nombre: 'txtCapacidad', x: 155, y: 375, w: 280, h: 14, size: 10 },
  { nombre: 'txtSerie', x: 155, y: 353, w: 280, h: 14, size: 10 },
  { nombre: 'txtAccesorios', x: 70, y: 260, w: 400, h: 70, size: 9, multiline: true },
  { nombre: 'txtFecha', x: 250, y: 300, w: 150, h: 14, size: 10 },
  { nombre: 'txtNombreFirmante', x: 385, y: 160, w: 160, h: 14, size: 10 },
  { nombre: 'txtDniFirmante', x: 385, y: 140, w: 120, h: 14, size: 10 },
  { nombre: 'imgFirma', x: 350, y: 180, w: 180, h: 50, esFirma: true },
];

async function instalarCampos(rutaSrc, rutaDst, campos) {
  const bytes = await fs.readFile(rutaSrc);
  const pdfDoc = await PDFDocument.load(bytes);
  const page = pdfDoc.getPage(0);
  const form = pdfDoc.getForm();

  for (const c of campos) {
    if (c.esFirma) {
      const btn = form.createButton(c.nombre);
      btn.addToPage('', page, { x: c.x, y: c.y, width: c.w, height: c.h, backgroundColor: undefined, borderWidth: 0 });
    } else {
      const tf = form.createTextField(c.nombre);
      tf.addToPage(page, { x: c.x, y: c.y, width: c.w, height: c.h });
      if (c.multiline) {
        tf.enableMultiline();
        const opts = c.size <= 9 ? { fontSize: c.size } : {};
        tf.setFontSize(opts.fontSize || c.size);
      } else {
        tf.setFontSize(c.size);
      }
    }
  }

  const out = await pdfDoc.save();
  await fs.writeFile(rutaDst, Buffer.from(out));
  console.log(`Campos instalados: ${rutaDst} (${campos.length} campos)`);
}

const templatesDir = 'D:\\inventariogp\\backend\\assets\\actas\\templates';

await instalarCampos(
  `${templatesDir}\\entrega-laptop-v1.pdf`,
  `${templatesDir}\\entrega-laptop-v1.pdf`,
  CAMPOS_ENTREGA
);

await instalarCampos(
  `${templatesDir}\\devolucion-laptop-v1.pdf`,
  `${templatesDir}\\devolucion-laptop-v1.pdf`,
  CAMPOS_DEVOLUCION
);

console.log('Listo.');
