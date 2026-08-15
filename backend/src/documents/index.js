import { generatePdf } from './generate-pdf.js'
import { renderCargoLaptopHtml, renderCargoDevolucionHtml } from './render.js'
import { mapAsignacionToCargoLaptop } from './mappers/cargo-laptop.js'
import { mapAsignacionToCargoDevolucion } from './mappers/cargo-devolucion-laptop.js'
import { EMPRESA, RESPONSABLE } from '../config/empresa.js'

function buildHtml(snapshot, firmaBase64, firmaPosicion) {
  if (snapshot.tipoActa === 'DEVOLUCION') {
    const doc = mapAsignacionToCargoDevolucion(snapshot, EMPRESA, RESPONSABLE)
    return renderCargoDevolucionHtml({
      ...doc,
      ...(firmaBase64 ? { firmaSrc: firmaBase64 } : {}),
      ...(firmaPosicion ? { firmaPosicion } : {}),
    })
  }
  const doc = mapAsignacionToCargoLaptop(snapshot, EMPRESA)
  return renderCargoLaptopHtml({
    ...doc,
    ...(firmaBase64 ? { firmaSrc: firmaBase64 } : {}),
    ...(firmaPosicion ? { firmaPosicion } : {}),
  })
}

export async function generarActaPdf(datosActa) {
  const html = buildHtml(datosActa.snapshot)
  return generatePdf(html)
}

export async function incrustarFirma(datosActa, firmaBase64, firmaPosicion) {
  const html = buildHtml(datosActa.snapshot, firmaBase64, firmaPosicion)
  return generatePdf(html)
}
