import { generatePdf } from './generate-pdf.js'
import { renderCargoLaptopHtml, renderCargoDevolucionHtml } from './render.js'
import { mapAsignacionToCargoLaptop } from './mappers/cargo-laptop.js'
import { mapAsignacionToCargoDevolucion } from './mappers/cargo-devolucion-laptop.js'
import { EMPRESA, RESPONSABLE } from '../config/empresa.js'

function buildHtml(snapshot, firmaBase64) {
  if (snapshot.tipoActa === 'DEVOLUCION') {
    const doc = mapAsignacionToCargoDevolucion(snapshot, EMPRESA, RESPONSABLE)
    return renderCargoDevolucionHtml({
      ...doc,
      ...(firmaBase64 ? { firmaSrc: firmaBase64 } : {}),
    })
  }
  const doc = mapAsignacionToCargoLaptop(snapshot, EMPRESA)
  return renderCargoLaptopHtml({
    ...doc,
    ...(firmaBase64 ? { firmaSrc: firmaBase64 } : {}),
  })
}

export async function generarActaPdf(datosActa) {
  console.log('[PDF] BACKEND: generando acta', datosActa.tipoActa, datosActa.snapshot?.trabajador?.nombre)
  const html = buildHtml(datosActa.snapshot)
  return generatePdf(html)
}

export async function incrustarFirma(datosActa, firmaBase64) {
  console.log('[PDF] BACKEND: incrustando firma', datosActa.tipoActa, 'firmaSize:', firmaBase64?.length || 0)
  const html = buildHtml(datosActa.snapshot, firmaBase64)
  return generatePdf(html)
}
