export function formatDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function estadoColor(estado) {
  const map = {
    DISPONIBLE: 'bg-green-100 text-green-800',
    ASIGNADO: 'bg-blue-100 text-blue-800',
    MANTENIMIENTO: 'bg-yellow-100 text-yellow-800',
    INCIDENCIA: 'bg-red-100 text-red-800',
    BAJA: 'bg-gray-100 text-gray-800',
    VIGENTE: 'bg-blue-100 text-blue-800',
    CESADO: 'bg-gray-100 text-gray-800',
    ABIERTO: 'bg-yellow-100 text-yellow-800',
    CERRADO: 'bg-green-100 text-green-800',
  };
  return map[estado] || 'bg-gray-100 text-gray-800';
}

export function tipoIncidenciaColor(tipo) {
  const map = {
    ROBO: 'bg-red-100 text-red-800',
    PERDIDA: 'bg-yellow-100 text-yellow-800',
    DAÑO: 'bg-orange-100 text-orange-800',
    DEVOLUCION: 'bg-green-100 text-green-800',
  };
  return map[tipo] || 'bg-gray-100 text-gray-800';
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}
