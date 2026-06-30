import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';
import { formatDate } from '../lib/utils';
import { StatusBadge } from '../components/StatusBadge';
import { StatsCard } from '../components/StatsCard';
import { EmptyState } from '../components/EmptyState';
import { Laptop, Package, Users, AlertTriangle, Monitor, Clock, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#6b7280', '#8b5cf6'];

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted-foreground/10 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-card rounded-xl border border-border animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-card rounded-xl border border-border animate-pulse" />
          <div className="h-80 bg-card rounded-xl border border-border animate-pulse" />
        </div>
      </div>
    );
  }

  const rows = ultimasAsignaciones?.rows || [];

  const statusData = [
    { name: 'Disponibles', value: data?.disponibles ?? 0 },
    { name: 'Asignados', value: data?.asignados ?? 0 },
    { name: 'Incidencia', value: data?.incidencia ?? 0 },
    { name: 'Mantenimiento', value: data?.mantenimiento ?? 0 },
    { name: 'Baja', value: data?.baja ?? 0 },
  ].filter(d => d.value > 0);

  const tipoData = (data?.porTipo || []).map(item => ({
    name: item.DesTipodeEquipo,
    value: item.count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Resumen general del inventario</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Equipos" value={data?.total ?? 0} icon={Monitor} />
        <StatsCard title="Disponibles" value={data?.disponibles ?? 0} icon={Package} />
        <StatsCard title="Asignados" value={data?.asignados ?? 0} icon={Users} />
        <StatsCard title="En Incidencia" value={data?.incidencia ?? 0} icon={AlertTriangle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Equipos por Tipo */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-1">Equipos por Tipo</h2>
          <p className="text-xs text-muted-foreground mb-4">Distribución por categoría</p>
          {tipoData.length === 0 ? (
            <EmptyState title="Sin datos" description="No hay equipos registrados" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={tipoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {tipoData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e4e4e7',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex flex-wrap gap-3 mt-2">
            {tipoData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {item.name}: {item.value}
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart - Resumen de Estado */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-1">Resumen de Estado</h2>
          <p className="text-xs text-muted-foreground mb-4">Cantidad por estado</p>
          {statusData.length === 0 ? (
            <EmptyState title="Sin datos" description="No hay equipos registrados" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={statusData} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#71717a' }} />
                <YAxis tick={{ fontSize: 12, fill: '#71717a' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e4e4e7',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {statusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Últimas Asignaciones */}
      <div className="bg-card rounded-xl border border-border">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-semibold text-foreground">Últimas Asignaciones</h2>
            <p className="text-xs text-muted-foreground">Actividad reciente de asignaciones</p>
          </div>
          <Link
            to="/asignaciones"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium"
          >
            Ver todas <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Sin asignaciones" description="No hay asignaciones registradas recientemente" />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((r) => (
              <div key={r.IdMovEquipoAsignacion} className="flex items-center justify-between px-5 py-3.5 hover:bg-accent/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{r.CodEquipo}</span>
                    <span className="text-xs text-muted-foreground">—</span>
                    <span className="text-sm text-muted-foreground truncate">{r.DesTipodeEquipo}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {r.TrabajadorNombre || 'Trabajador no encontrado'} · {formatDate(r.FecAsignacion)}
                  </p>
                </div>
                <StatusBadge status={r.Estado} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
