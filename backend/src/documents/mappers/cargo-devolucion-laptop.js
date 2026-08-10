function formatearFecha(fecha) {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(fecha))
}

export function mapAsignacionToCargoDevolucion(snapshot, empresa, responsable) {
  const accs = (snapshot.accesorios || [])
    .map(a => [a.codigo, a.descripcion, a.marca].filter(Boolean).join(' '))
    .join(', ')

  return {
    empresa,
    empleado: {
      nombre: String(snapshot.trabajador?.nombre || ''),
      dni: String(snapshot.trabajador?.dni || ''),
    },
    responsable,
    equipo: {
      marca: String(snapshot.equipo?.marca || ''),
      modelo: String(snapshot.equipo?.modelo || ''),
      color: String(snapshot.equipo?.color || ''),
      ram: String(snapshot.equipo?.ram || ''),
      capacidad: String(snapshot.equipo?.capacidad || ''),
      serie: String(snapshot.equipo?.serie || ''),
      accesorios: accs,
    },
    fecha: formatearFecha(snapshot.fechaDocumento || new Date()),
  }
}
