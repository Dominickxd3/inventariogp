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

function escribir(page, font, texto, campo) {
  if (!texto || !campo) return;
  page.drawText(String(texto), {
    x: campo.x,
    y: campo.y,
    size: campo.size,
    font,
    color: rgb(0, 0, 0),
    maxWidth: campo.maxWidth ?? 400,
  });
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

export async function generarActaPdf(datosActa) {
  const rutaPlantilla = obtenerPlantilla(datosActa.tipoActa);
  const plantillaBytes = await fs.readFile(rutaPlantilla);

  const pdfDoc = await PDFDocument.load(plantillaBytes);
  const page = pdfDoc.getPage(0);
  const font = await cargarFuente(pdfDoc);
  const layout = getLayout(datosActa.tipoActa);

  const e = (v, c) => escribir(page, font, v, c);

  e(datosActa.trabajador.nombre, layout.asignado);
  e(datosActa.equipo.marca, layout.marca);
  e(datosActa.equipo.modelo, layout.modelo);
  e(datosActa.equipo.color, layout.color);
  e(datosActa.equipo.ram, layout.ram);
  e(datosActa.equipo.capacidad, layout.capacidad);
  e(datosActa.equipo.serie, layout.serie);

  e(formatearFecha(datosActa.fecha), layout.fecha);
  dibujarAccesorios(page, font, datosActa.accesorios, layout.accesorios);

  e(datosActa.trabajador.nombre, layout.nombreFirmante);
  e(datosActa.trabajador.dni, layout.dniFirmante);

  if (datosActa.tipoActa === 'DEVOLUCION') {
    e(datosActa.trabajador.nombre, layout.recibiDe);
  }

  return pdfDoc.save();
}

export async function incrustarFirma(pdfOriginalBytes, firmaBase64, layout) {
  const pdfDoc = await PDFDocument.load(pdfOriginalBytes);
  const page = pdfDoc.getPage(0);

  const firmaBuffer = Buffer.from(firmaBase64.replace(/^data:image\/png;base64,/, ''), 'base64');
  let firmaImage;
  try {
    firmaImage = await pdfDoc.embedPng(firmaBuffer);
  } catch {
    throw Object.assign(new Error('La firma no es una imagen PNG válida'), { statusCode: 422 });
  }

  page.drawImage(firmaImage, { x: layout.firma.x, y: layout.firma.y, width: layout.firma.width, height: layout.firma.height });

  return pdfDoc.save();
}
