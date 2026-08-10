import { generatePdf, logoBase64, firmaResponsableBase64 } from '../documents/generate-pdf.js'
import cargoLaptopHtml from '../documents/templates/cargo-laptop.js'
import cargoDevolucionLaptopHtml from '../documents/templates/cargo-devolucion-laptop.js'
import { mapAsignacionToCargoLaptop } from '../documents/mappers/cargo-laptop.js'
import { mapAsignacionToCargoDevolucion } from '../documents/mappers/cargo-devolucion-laptop.js'
import { EMPRESA, RESPONSABLE } from '../config/empresa.js'

function buildHtml(snapshot, firmaBase64) {
  const logoSrc = logoBase64 || '/logo.png'

  if (snapshot.tipoActa === 'DEVOLUCION') {
    const doc = mapAsignacionToCargoDevolucion(snapshot, EMPRESA, RESPONSABLE)
    return cargoDevolucionLaptopHtml({
      ...doc,
      logoSrc,
      firmaResponsableSrc: firmaResponsableBase64 || '/firmasistemas.png',
      ...(firmaBase64 ? { firma: firmaBase64 } : {}),
    })
  }

  const doc = mapAsignacionToCargoLaptop(snapshot, EMPRESA)
  return cargoLaptopHtml({
    ...doc,
    logoSrc,
    ...(firmaBase64 ? { firma: firmaBase64 } : {}),
  })
}

export async function generarActaPdf(datosActa) {
  const html = buildHtml(datosActa.snapshot)
  return generatePdf(html)
}

export async function incrustarFirma(datosActa, firmaBase64) {
  const html = buildHtml(datosActa.snapshot, firmaBase64)
  return generatePdf(html)
}
