import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';
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

function drawWatermark(page, layout, text) {
  const { x, y, size, opacity } = layout.watermark;
  page.drawText(text, {
    x, y,
    size,
    opacity,
    color: rgb(0.8, 0.8, 0.8),
  });
}

function drawFooter(page, layout) {
  const { footerText, footerY } = layout;
  page.drawText(footerText, {
    x: 70,
    y: footerY,
    size: 8,
    color: rgb(0.4, 0.4, 0.4),
  });
}

export async function generarActaPdf(snapshot) {
  const layout = getLayout(snapshot.tipoActa, snapshot.plantilla);

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const font = await loadFont(pdfDoc);
  const page = pdfDoc.addPage([layout.pageSize.width, layout.pageSize.height]);

  const draw = (text, x, y, size = 11, color = rgb(0, 0, 0)) => {
    page.drawText(String(text || ''), { x, y, size, font, color });
  };

  const title = snapshot.tipoActa === 'ENTREGA'
    ? 'CARGO DE ENTREGA DE EQUIPO'
    : 'CARGO DE DEVOLUCIÓN DE EQUIPO';

  draw(title, 70, 750, 14);

  draw('Grupo Pecuario S.A.C.', 70, 730, 11);
  draw('RUC: 20513967234', 70, 715, 10);

  draw('DATOS DEL TRABAJADOR', 70, 670, 11);
  draw(`Trabajador: ${snapshot.trabajador.nombre}`, layout.trabajador.x, layout.trabajador.y, layout.trabajador.size);
  draw(`DNI: ${snapshot.trabajador.dni}`, layout.dni.x, layout.dni.y, layout.dni.size);

  draw('DATOS DEL EQUIPO', 70, 550, 11);
  draw(`Marca: ${snapshot.equipo.marca || '—'}`, layout.marca.x, layout.marca.y, layout.marca.size);
  draw(`Modelo: ${snapshot.equipo.modelo || '—'}`, layout.modelo.x, layout.modelo.y, layout.modelo.size);
  draw(`Color: ${snapshot.equipo.color || '—'}`, layout.color.x, layout.color.y, layout.color.size);
  draw(`RAM: ${snapshot.equipo.ram || '—'}`, layout.ram.x, layout.ram.y, layout.ram.size);
  draw(`Capacidad: ${snapshot.equipo.capacidad || '—'}`, layout.capacidad.x, layout.capacidad.y, layout.capacidad.size);
  draw(`Serie: ${snapshot.equipo.serie || '—'}`, layout.serie.x, layout.serie.y, layout.serie.size);

  if (snapshot.accesorios?.length) {
    draw('ACCESORIOS:', 70, layout.accesorios.y + 14, 11);
    snapshot.accesorios.forEach((acc, i) => {
      const lineY = layout.accesorios.y - (i * layout.accesorios.lineHeight);
      if (lineY > 280) {
        draw(`• ${acc.codigo || ''} ${acc.descripcion || ''}`, layout.accesorios.x, lineY, layout.accesorios.size);
      }
    });
  }

  const fechaStr = new Date(snapshot.fechaDocumento).toLocaleDateString('es-PE', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  draw(`Fecha: ${fechaStr}`, layout.fecha.x, layout.fecha.y, layout.fecha.size);

  draw('FIRMA DEL TRABAJADOR', layout.firmaLinea.x, 180, 10);
  page.drawLine({
    start: { x: layout.firmaLinea.x, y: layout.firmaLinea.yLine },
    end: { x: layout.firmaLinea.x + layout.firmaLinea.width, y: layout.firmaLinea.yLine },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  draw(snapshot.trabajador.nombre, layout.nombreFirma.x, layout.nombreFirma.y, layout.nombreFirma.size);
  draw(`DNI: ${snapshot.trabajador.dni}`, layout.dniFirma.x, layout.dniFirma.y, layout.dniFirma.size);

  drawWatermark(page, layout, 'GRUPO PECUARIO S.A.C.');
  drawFooter(page, layout);

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

export async function incrustarFirma(pdfOriginalBytes, firmaBase64, layout) {
  const pdfDoc = await PDFDocument.load(pdfOriginalBytes);
  pdfDoc.registerFontkit(fontkit);
  const font = await loadFont(pdfDoc);
  const pages = pdfDoc.getPages();
  const page = pages[0];

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
