import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatDate } from '../lib/utils';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '#components/ui/select.jsx';

export default function IncidenciaSelect({ idEquipo, value, onChange, label }) {
  const { data: incidencias } = useQuery({
    queryKey: ['incidencias-equipo-select', idEquipo],
    queryFn: () => api.equipos.incidencias.list(idEquipo),
    enabled: !!idEquipo,
  });

  const sorted = (incidencias || [])
    .slice()
    .sort((a, b) => {
      if (a.Estado === 'ABIERTO' && b.Estado !== 'ABIERTO') return -1;
      if (a.Estado !== 'ABIERTO' && b.Estado === 'ABIERTO') return 1;
      return new Date(b.FecRegistro || 0) - new Date(a.FecRegistro || 0);
    });

  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium">{label}</label>}
      <Select value={value ? String(value) : ''} onValueChange={(v) => onChange(v ? parseInt(v) : null)}>
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar incidencia" />
        </SelectTrigger>
        <SelectContent>
          {sorted.length > 0 ? sorted.map((inc) => (
            <SelectItem key={inc.IdIncidencia} value={String(inc.IdIncidencia)}>
              <span className="flex items-center gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${inc.Estado === 'ABIERTO' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {inc.Estado}
                </span>
                {inc.TipoIncidencia} - {inc.Descripcion?.substring(0, 60)}
                {inc.FecIncidencia ? ` - ${formatDate(inc.FecIncidencia)}` : ''}
              </span>
            </SelectItem>
          )) : (
            <SelectItem value="" disabled>Sin incidencias registradas</SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
