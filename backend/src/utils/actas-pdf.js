import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import { getLayout } from '../config/actas-layouts.js';
import { actasConfig } from '../config/actas.js';

async function loadFont(pdfDoc) {
  const fontPath = actasConfig.fontPath;
  if (!fs.existsSync(fontPath)) {
    throw new Error(`Fuente no encontrada en: ${fontPath}. Configura ACTAS_FONT_PATH`);
  }
  pdfDoc.registerFontkit(fontkit);
  const fontBytes = fs.readFileSync(fontPath);
  return pdfDoc.embedFont(fontBytes, { subset: true });
}

function getTemplatePath(tipoActa) {
  return tipoActa === 'ENTREGA' ? actasConfig.templateEntrega : actasConfig.templateDevolucion;
}

export async function generarActaPdf(snapshot) {
  const templatePath = getTemplatePath(snapshot.tipoActa);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Plantilla no encontrada: ${templatePath}`);
  }

  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  pdfDoc.registerFontkit(fontkit);
  const font = await loadFont(pdfDoc);
  const page = pdfDoc.getPages()[0];

  const draw = (text, x, y, size = 11, color = rgb(0, 0, 0)) => {
    page.drawText(String(text || ''), { x, y, size, font, color });
  };

  const layout = getLayout(snapshot.tipoActa, snapshot.plantilla);

  const nombre = snapshot.trabajador.nombre || '';
  const dni = snapshot.trabajador.dni || '';

  draw(nombre, layout.trabajador.x, layout.trabajador.y, layout.trabajador.size);
  draw(dni, layout.dni.x, layout.dni.y, layout.dni.size);

  const labels = ['Tipo', 'Marca', 'Modelo', 'Color', 'Memoria RAM', 'Almacenamiento', 'N° de Serie', 'Código'];
  const values = [
    snapshot.equipo.tipoEquipo || '—',
    snapshot.equipo.marca || '—',
    snapshot.equipo.modelo || '—',
    snapshot.equipo.color || '—',
    snapshot.equipo.ram || '—',
    snapshot.equipo.capacidad || '—',
    snapshot.equipo.serie || '—',
    snapshot.equipo.codigo || '—',
  ];

  const col2 = 220 + 68;
  let rowY = layout.tabla.row1Y;
  for (let i = 0; i < labels.length; i++) {
    draw(values[i], col2, rowY, 9, rgb(0.1, 0.1, 0.1));
    rowY -= layout.tabla.rowHeight;
  }

  if (snapshot.accesorios?.length) {
    let accY = layout.accesorios.startY;
    for (const acc of snapshot.accesorios) {
      if (accY < layout.accesorios.minY) break;
      draw(`${acc.codigo || ''}  ${acc.descripcion || ''}`, layout.accesorios.x, accY, 9, rgb(0.2, 0.2, 0.2));
      accY -= layout.accesorios.lineHeight;
    }
  }

  const fechaStr = new Date(snapshot.fechaDocumento).toLocaleDateString('es-PE', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  draw(`Fecha: ${fechaStr}`, layout.fecha.x, layout.fecha.y, 9, rgb(0.3, 0.3, 0.3));

  draw(nombre, layout.nombreFirma.x, layout.nombreFirma.y, layout.nombreFirma.size);
  draw(`DNI: ${dni}`, layout.dniFirma.x, layout.dniFirma.y, layout.dniFirma.size);

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

export async function incrustarFirma(pdfOriginalBytes, firmaBase64, layout) {
  const pdfDoc = await PDFDocument.load(pdfOriginalBytes);
  pdfDoc.registerFontkit(fontkit);
  const font = await loadFont(pdfDoc);
  const page = pdfDoc.getPages()[0];

  const firmaBuffer = Buffer.from(firmaBase64.replace(/^data:image\/png;base64,/, ''), 'base64');
  let firmaImage;
  try {
    firmaImage = await pdfDoc.embedPng(firmaBuffer);
  } catch {
    throw Object.assign(new Error('La firma no es una imagen PNG válida'), { statusCode: 422 });
  }

  page.drawImage(firmaImage, {
    x: layout.firmaLinea.x,
    y: layout.firmaLinea.yLine - 60,
    width: 180,
    height: 60,
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
