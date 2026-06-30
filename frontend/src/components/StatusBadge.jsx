const statusStyles = {
  DISPONIBLE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  ASIGNADO: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  MANTENIMIENTO: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  INCIDENCIA: 'bg-red-50 text-red-700 ring-red-600/20',
  BAJA: 'bg-gray-50 text-gray-600 ring-gray-500/20',
  VIGENTE: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  CESADO: 'bg-gray-50 text-gray-600 ring-gray-500/20',
  ACTIVO: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  ABIERTO: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  CERRADO: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  ROBO: 'bg-red-50 text-red-700 ring-red-600/20',
  PERDIDA: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  DAÑO: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  DEVOLUCION: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
};

export function StatusBadge({ status, variant = 'default' }) {
  const style = statusStyles[status] || 'bg-gray-50 text-gray-600 ring-gray-500/20';
  if (variant === 'dot') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm">
        <span className={`inline-block w-2 h-2 rounded-full ${style.split(' ')[0]}`} />
        <span className="text-gray-700">{status}</span>
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}>
      {status}
    </span>
  );
}

export const estadoColor = (estado) => statusStyles[estado]?.split(' ')[0] || 'bg-gray-100';
