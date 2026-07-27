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

function calcularTamano(texto, font, campo) {
  let size = campo.size;
  const minSize = campo.minSize ?? 6;
  if (!campo.maxWidth) return size;
  while (size > minSize && font.widthOfTextAtSize(texto, size) > campo.maxWidth) {
    size -= 0.5;
  }
  return size;
}

function escribirInteligente(page, font, texto, campo) {
  if (!texto || !campo) return;
  const valor = String(texto);
  const size = calcularTamano(valor, font, campo);
  page.drawText(valor, {
    x: campo.x,
    y: campo.y,
    size,
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
    const size = calcularTamano(texto, font, layout);
    page.drawText(texto, {
      x: layout.x,
      y,
      size,
      font,
      maxWidth: layout.maxWidth,
    });
  }
}

export async function generarActaPdf(snapshot) {
  const rutaPlantilla = obtenerPlantilla(snapshot.tipoActa);
  const plantillaBytes = await fs.readFile(rutaPlantilla);

  const pdfDoc = await PDFDocument.load(plantillaBytes);
  const page = pdfDoc.getPage(0);
  const font = await cargarFuente(pdfDoc);
  const layout = getLayout(snapshot.tipoActa, snapshot.plantilla);

  const e = (v, c) => escribirInteligente(page, font, v, c);

  e(snapshot.trabajador.nombre, layout.asignado);
  e(snapshot.equipo.marca, layout.marca);
  e(snapshot.equipo.modelo, layout.modelo);
  e(snapshot.equipo.color, layout.color);
  e(snapshot.equipo.ram, layout.ram);
  e(snapshot.equipo.capacidad, layout.capacidad);
  e(snapshot.equipo.serie, layout.serie);

  e(formatearFecha(snapshot.fechaDocumento), layout.fecha);

  e(snapshot.trabajador.nombre, layout.nombreFirmante);
  e(snapshot.trabajador.dni, layout.dniFirmante);

  dibujarAccesorios(page, font, snapshot.accesorios, layout.accesorios);

  if (snapshot.tipoActa === 'DEVOLUCION') {
    e(snapshot.trabajador.nombre, layout.recibiDe);
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
