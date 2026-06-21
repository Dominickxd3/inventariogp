import { estadoColor, tipoIncidenciaColor } from '../lib/utils';

export function EstadoBadge({ estado }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoColor(estado)}`}>
      {estado}
    </span>
  );
}

export function IncidenciaBadge({ tipo }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tipoIncidenciaColor(tipo)}`}>
      {tipo}
    </span>
  );
}
