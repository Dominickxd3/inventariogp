import { mapAsignacionToCargoLaptop } from '../documents/mappers/cargo-laptop.js'
import { mapAsignacionToCargoDevolucion } from '../documents/mappers/cargo-devolucion-laptop.js'
import { EMPRESA, RESPONSABLE } from '../config/empresa.js'

const DOCUMENTOS_PDF_URL = process.env.DOCUMENTOS_PDF_URL || 'http://localhost:3000'

async function callApi(endpoint, body) {
  const url = `${DOCUMENTOS_PDF_URL}${endpoint}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Error generando PDF (${res.status}): ${text.slice(0, 200)}`)
  }

  const bytes = await res.arrayBuffer()
  return Buffer.from(bytes)
}

function buildEntregaBody(snapshot, firmaBase64) {
  const doc = mapAsignacionToCargoLaptop(snapshot, EMPRESA)
  return {
    empresaNombre: doc.empresa.nombre,
    empresaRuc: doc.empresa.ruc,
    empresaDireccion: doc.empresa.direccion,
    empresaTelefonos: doc.empresa.telefonos,
    nombre: doc.empleado.nombre,
    dni: doc.empleado.dni,
    marca: doc.equipo.marca,
    modelo: doc.equipo.modelo,
    color: doc.equipo.color,
    ram: doc.equipo.ram,
    capacidad: doc.equipo.capacidad,
    serie: doc.equipo.serie,
    accesorios: doc.equipo.accesorios,
    fecha: doc.fecha,
    ...(firmaBase64 ? { firma: firmaBase64 } : {}),
  }
}

function buildDevolucionBody(snapshot, firmaBase64) {
  const doc = mapAsignacionToCargoDevolucion(snapshot, EMPRESA, RESPONSABLE)
  return {
    empresaNombre: doc.empresa.nombre,
    empresaRuc: doc.empresa.ruc,
    empresaDireccion: doc.empresa.direccion,
    empresaTelefonos: doc.empresa.telefonos,
    empresaCorreo1: doc.empresa.correo1 || '',
    empresaCorreo2: doc.empresa.correo2 || '',
    nombre: doc.empleado.nombre,
    dni: doc.empleado.dni,
    responsableNombre: doc.responsable.nombre,
    responsableDni: doc.responsable.dni,
    marca: doc.equipo.marca,
    modelo: doc.equipo.modelo,
    color: doc.equipo.color,
    ram: doc.equipo.ram,
    capacidad: doc.equipo.capacidad,
    serie: doc.equipo.serie,
    accesorios: doc.equipo.accesorios,
    fecha: doc.fecha,
    ...(firmaBase64 ? { firma: firmaBase64 } : {}),
  }
}

export async function generarActaPdf(datosActa) {
  const endpoint = datosActa.tipoActa === 'ENTREGA' ? '/api/pdf' : '/api/pdf/devolucion'
  const body = datosActa.tipoActa === 'ENTREGA'
    ? buildEntregaBody(datosActa.snapshot)
    : buildDevolucionBody(datosActa.snapshot)

  return callApi(endpoint, body)
}

export async function incrustarFirma(datosActa, firmaBase64) {
  const endpoint = datosActa.tipoActa === 'ENTREGA' ? '/api/pdf' : '/api/pdf/devolucion'
  const body = datosActa.tipoActa === 'ENTREGA'
    ? buildEntregaBody(datosActa.snapshot, firmaBase64)
    : buildDevolucionBody(datosActa.snapshot, firmaBase64)

  return callApi(endpoint, body)
}
