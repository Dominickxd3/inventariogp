import { generatePdf } from './generate-pdf.js'
import { renderCargoLaptopHtml, renderCargoDevolucionHtml } from './render.js'
import { readBase64 } from './read-logos.js'
import { mapAsignacionToCargoLaptop } from './mappers/cargo-laptop.js'
import { mapAsignacionToCargoDevolucion } from './mappers/cargo-devolucion-laptop.js'
import { EMPRESA, RESPONSABLE } from '../config/empresa.js'

const logoSrc = readBase64('logo.png')
const firmaResponsableSrc = readBase64('firmasistemas.png')

function buildHtml(snapshot, firmaBase64) {
  const logo = logoSrc || '/logo.png'

  if (snapshot.tipoActa === 'DEVOLUCION') {
    const doc = mapAsignacionToCargoDevolucion(snapshot, EMPRESA, RESPONSABLE)
    return renderCargoDevolucionHtml({
      ...doc,
      logoSrc: logo,
      firmaResponsableSrc: firmaResponsableSrc || '/firmasistemas.png',
      ...(firmaBase64 ? { firmaSrc: firmaBase64 } : {}),
    })
  }

  const doc = mapAsignacionToCargoLaptop(snapshot, EMPRESA)
  return renderCargoLaptopHtml({
    ...doc,
    logoSrc: logo,
    ...(firmaBase64 ? { firmaSrc: firmaBase64 } : {}),
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
