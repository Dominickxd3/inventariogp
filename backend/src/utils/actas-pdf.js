import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'node:fs/promises';
import { actasConfig } from '../config/actas.js';

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

function textoAccesorios(accesorios = []) {
  if (!accesorios.length) return '';
  return accesorios
    .map(a => {
      const partes = [a.codigo, a.descripcion, a.marca, a.modelo].filter(Boolean);
      return partes.join('  ');
    })
    .join('\n');
}

export async function generarActaPdf(datosActa) {
  const rutaPlantilla = obtenerPlantilla(datosActa.tipoActa);
  const plantillaBytes = await fs.readFile(rutaPlantilla);

  const pdfDoc = await PDFDocument.load(plantillaBytes);
  const font = await cargarFuente(pdfDoc);
  const form = pdfDoc.getForm();

  form.getTextField('txtAsignado').setText(datosActa.trabajador.nombre);
  form.getTextField('txtMarca').setText(datosActa.equipo.marca);
  form.getTextField('txtModelo').setText(datosActa.equipo.modelo);
  form.getTextField('txtColor').setText(datosActa.equipo.color);
  form.getTextField('txtRam').setText(datosActa.equipo.ram);
  form.getTextField('txtCapacidad').setText(datosActa.equipo.capacidad);
  form.getTextField('txtSerie').setText(datosActa.equipo.serie);
  form.getTextField('txtAccesorios').setText(textoAccesorios(datosActa.accesorios));
  form.getTextField('txtFecha').setText(formatearFecha(datosActa.fecha));
  form.getTextField('txtNombreFirmante').setText(datosActa.trabajador.nombre);
  form.getTextField('txtDniFirmante').setText(datosActa.trabajador.dni);

  if (datosActa.tipoActa === 'DEVOLUCION') {
    form.getTextField('txtRecibiDe').setText(datosActa.trabajador.nombre);
  }

  form.updateFieldAppearances(font);

  return pdfDoc.save();
}

export async function incrustarFirma(pdfOriginalBytes, firmaBase64) {
  const pdfDoc = await PDFDocument.load(pdfOriginalBytes);
  const page = pdfDoc.getPage(0);
  const form = pdfDoc.getForm();

  const btn = form.getButton('imgFirma');
  const widget = btn.acroField.getWidgets()[0];
  const rect = widget.getRectangle();

  const firmaBuffer = Buffer.from(firmaBase64.replace(/^data:image\/png;base64,/, ''), 'base64');
  let firmaImage;
  try {
    firmaImage = await pdfDoc.embedPng(firmaBuffer);
  } catch {
    throw Object.assign(new Error('La firma no es una imagen PNG válida'), { statusCode: 422 });
  }

  page.drawImage(firmaImage, { x: rect.x, y: rect.y, width: rect.width, height: rect.height });

  form.flatten();

  return pdfDoc.save();
}
