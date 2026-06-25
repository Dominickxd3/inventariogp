import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Laptop, Users, ClipboardList, AlertTriangle, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '../lib/utils';
import { EstadoBadge } from '../components/Badge';

const cards = [
  { key: 'total', label: 'Total Equipos', icon: Laptop, color: 'bg-blue-500' },
  { key: 'disponibles', label: 'Disponibles', icon: Package, color: 'bg-green-500' },
  { key: 'asignados', label: 'Asignados', icon: Users, color: 'bg-indigo-500' },
  { key: 'incidencia', label: 'En Incidencia', icon: AlertTriangle, color: 'bg-red-500' },
];

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.equipos.dashboard,
    refetchInterval: 30000,
  });

  const { data: ultimasAsignaciones } = useQuery({
    queryKey: ['dashboard-ultimas-asignaciones'],
    queryFn: () => api.asignaciones.list({ pageSize: 5 }),
    refetchInterval: 30000,
  });

  if (isLoading) return <div className="text-center py-12 text-gray-400">Cargando...</div>;

  const rows = ultimasAsignaciones?.rows || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.key} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {data?.[card.key] ?? 0}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-4">Equipos por Tipo</h2>
          <div className="space-y-3">
            {data?.porTipo?.map((item) => (
              <div key={item.DesTipodeEquipo} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{item.DesTipodeEquipo}</span>
                <span className="text-sm font-semibold text-foreground">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-4">Resumen de Estado</h2>
          <div className="space-y-4">
            {[
              { label: 'Disponibles', value: data?.disponibles ?? 0, color: 'bg-green-500' },
              { label: 'Asignados', value: data?.asignados ?? 0, color: 'bg-blue-500' },
              { label: 'Incidencia', value: data?.incidencia ?? 0, color: 'bg-red-500' },
              { label: 'Baja', value: data?.baja ?? 0, color: 'bg-gray-500' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold text-foreground">{item.value}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${data?.total ? (item.value / data.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Últimas Asignaciones</h2>
          <Link to="/asignaciones" className="text-sm text-primary hover:underline">Ver todas</Link>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No hay asignaciones registradas</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.IdMovEquipoAsignacion} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {r.CodEquipo} — {r.DesTipodeEquipo}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.TrabajadorNombre || 'Trabajador no encontrado'}
                    {' — '}{formatDate(r.FecAsignacion)}
                  </p>
                </div>
                <EstadoBadge estado={r.Estado} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
