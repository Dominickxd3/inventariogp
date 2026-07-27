import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'node:fs/promises';
import { actasConfig } from '../config/actas.js';
import { getLayout } from '../config/actas-layouts.js';

async function cargarFuente(pdfDoc) {
  pdfDoc.registerFontkit(fontkit);
  const bytes = await fs.readFile(actasConfig.fontPath);
  return pdfDoc.embedFont(bytes, { subset: true });
}

function obtenerPlantilla(tipoActa) {
  return tipoActa === 'ENTREGA'
    ? actasConfig.templateEntrega
    : actasConfig.templateDevolucion;
}

function formatearFecha(fecha) {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(fecha));
}

function dibujarAccesorios(page, font, accesorios = [], layout) {
  for (let i = 0; i < accesorios.length; i++) {
    const a = accesorios[i];
    const descripcion = [a.descripcion, a.marca, a.modelo].filter(Boolean).join(' ');
    const texto = `${a.codigo || ''}  ${descripcion}`;
    const y = layout.y - i * layout.lineHeight;
    if (y < layout.minY) break;
    page.drawText(texto, { x: layout.x, y, size: layout.size, font, maxWidth: layout.maxWidth });
  }
}

export async function generarActaPdf(snapshot) {
  const rutaPlantilla = obtenerPlantilla(snapshot.tipoActa);
  const plantillaBytes = await fs.readFile(rutaPlantilla);

  const pdfDoc = await PDFDocument.load(plantillaBytes);
  const page = pdfDoc.getPage(0);
  const font = await cargarFuente(pdfDoc);
  const layout = getLayout(snapshot.tipoActa, snapshot.plantilla);

  const escribir = (valor, campo) => {
    if (!valor || !campo) return;
    page.drawText(String(valor), {
      x: campo.x,
      y: campo.y,
      size: campo.size,
      font,
      color: rgb(0, 0, 0),
      maxWidth: campo.maxWidth ?? 400,
    });
  };

  escribir(snapshot.trabajador.nombre, layout.asignado);
  escribir(snapshot.equipo.marca, layout.marca);
  escribir(snapshot.equipo.modelo, layout.modelo);
  escribir(snapshot.equipo.color, layout.color);
  escribir(snapshot.equipo.ram, layout.ram);
  escribir(snapshot.equipo.capacidad, layout.capacidad);
  escribir(snapshot.equipo.serie, layout.serie);

  escribir(snapshot.trabajador.nombre, layout.nombreFirmante);

  escribir(snapshot.trabajador.dni, layout.dniFirmante);

  escribir(formatearFecha(snapshot.fechaDocumento), layout.fecha);

  dibujarAccesorios(page, font, snapshot.accesorios, layout.accesorios);

  if (snapshot.tipoActa === 'DEVOLUCION') {
    escribir(snapshot.trabajador.nombre, layout.recibiDe);
  }

  return pdfDoc.save();
}

export async function incrustarFirma(pdfOriginalBytes, firmaBase64, tipoActa) {
  const pdfDoc = await PDFDocument.load(pdfOriginalBytes);
  const page = pdfDoc.getPage(0);

  const firmaBuffer = Buffer.from(firmaBase64.replace(/^data:image\/png;base64,/, ''), 'base64');
  let firmaImage;
  try {
    firmaImage = await pdfDoc.embedPng(firmaBuffer);
  } catch {
    throw Object.assign(new Error('La firma no es una imagen PNG válida'), { statusCode: 422 });
  }

  const posicion =
    tipoActa === 'DEVOLUCION'
      ? { x: 334, y: 264, width: 175, height: 52 }
      : { x: 70, y: 150, width: 175, height: 55 };

  page.drawImage(firmaImage, posicion);

  return pdfDoc.save();
}
