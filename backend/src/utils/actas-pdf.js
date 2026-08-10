const DOCUMENTOS_PDF_URL = process.env.DOCUMENTOS_PDF_URL || 'http://localhost:3002';

function formatearFecha(fecha) {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(fecha));
}

function buildBody(datosActa, firmaBase64) {
  const body = {
    nombre: datosActa.trabajador.nombre,
    dni: datosActa.trabajador.dni,
    marca: datosActa.equipo.marca || '',
    modelo: datosActa.equipo.modelo || '',
    color: datosActa.equipo.color || '',
    ram: datosActa.equipo.ram || '',
    capacidad: datosActa.equipo.capacidad || '',
    serie: datosActa.equipo.serie || '',
    accesorios: (datosActa.accesorios || [])
      .map(a => [a.codigo, a.descripcion].filter(Boolean).join(' '))
      .join(', '),
    fecha: formatearFecha(datosActa.fecha),
  };

  if (firmaBase64) {
    body.firma = firmaBase64;
  }

  return body;
}

function endpoint(tipoActa) {
  return tipoActa === 'ENTREGA' ? 'api/pdf' : 'api/pdf/devolucion';
}

async function fetchPdf(body, tipoActa) {
  const url = `${DOCUMENTOS_PDF_URL}/${endpoint(tipoActa)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Error generando PDF (${res.status}): ${text.slice(0, 200)}`);
  }

  const bytes = await res.arrayBuffer();
  return Buffer.from(bytes);
}

export async function generarActaPdf(datosActa) {
  return fetchPdf(buildBody(datosActa), datosActa.tipoActa);
}

export async function incrustarFirma(datosActa, firmaBase64) {
  return fetchPdf(buildBody(datosActa, firmaBase64), datosActa.tipoActa);
}
