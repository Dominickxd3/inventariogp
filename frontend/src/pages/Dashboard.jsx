import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Laptop, Users, ClipboardList, AlertTriangle, Package } from 'lucide-react';

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

  if (isLoading) return <div className="text-center py-12 text-gray-400">Cargando...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.key} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
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
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Equipos por Tipo</h2>
          <div className="space-y-3">
            {data?.porTipo && Object.entries(data.porTipo).map(([tipo, count]) => (
              <div key={tipo} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{tipo}</span>
                <span className="text-sm font-semibold text-gray-800">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Resumen de Estado</h2>
          <div className="space-y-4">
            {[
              { label: 'Disponibles', value: data?.disponibles ?? 0, color: 'bg-green-500' },
              { label: 'Asignados', value: data?.asignados ?? 0, color: 'bg-blue-500' },
              { label: 'Incidencia', value: data?.incidencia ?? 0, color: 'bg-red-500' },
              { label: 'Baja', value: data?.baja ?? 0, color: 'bg-gray-500' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
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
    </div>
  );
}
