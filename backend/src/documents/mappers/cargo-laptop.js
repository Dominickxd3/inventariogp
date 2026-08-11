function formatearFecha(fecha) {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(fecha))
}

export function mapAsignacionToCargoLaptop(snapshot, empresa) {
  const accs = (snapshot.accesorios || [])
    .map(a => [a.codigo, a.descripcion, a.marca].filter(Boolean).join(' '))
    .join(', ')

  const eq = snapshot.equipo || {}
  const fixFields = [
    ['marca', 'MARCA'],
    ['modelo', 'MODELO'],
    ['color', 'COLOR'],
    ['ram', 'RAM'],
    ['capacidad', 'CAPACIDAD'],
    ['imei', 'IMEI'],
    ['nroCelular', 'NRO CELULAR'],
  ]

  const caracteristicas = fixFields
    .filter(([k]) => eq[k])
    .map(([k, label]) => ({ clave: label, valor: String(eq[k]) }))

  return {
    empresa,
    empleado: {
      nombre: String(snapshot.trabajador?.nombre || ''),
      dni: String(snapshot.trabajador?.dni || ''),
    },
    equipo: {
      tipo: String(eq.tipoEquipo || ''),
      serie: String(eq.serie || ''),
      accesorios: accs,
      caracteristicas,
    },
    fecha: formatearFecha(snapshot.fechaDocumento || new Date()),
  }
}
