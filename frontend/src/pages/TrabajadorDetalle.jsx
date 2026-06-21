import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { EstadoBadge } from '../components/Badge';
import { formatDate } from '../lib/utils';
import { ArrowLeft } from 'lucide-react';

export default function TrabajadorDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: trabajador, isLoading } = useQuery({
    queryKey: ['trabajador', id],
    queryFn: () => api.trabajadores.get(id),
  });

  const { data: historial } = useQuery({
    queryKey: ['historial-trabajador', id],
    queryFn: () => api.asignaciones.historialTrabajador(id),
  });

  if (isLoading) return <div className="text-center py-12 text-gray-400">Cargando...</div>;
  if (!trabajador) return <div className="text-center py-12 text-gray-400">Trabajador no encontrado</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {trabajador.APaterno} {trabajador.AMaterno}, {trabajador.Nombres}
        </h1>
        <p className="text-gray-500 mt-1">{trabajador.NomCargo}</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          <div>
            <p className="text-xs text-gray-400">DNI</p>
            <p className="text-sm font-medium">{trabajador.DNI}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Código Empleado</p>
            <p className="text-sm font-medium">{trabajador.CodEmpleado}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Área</p>
            <p className="text-sm font-medium">{trabajador.AreaName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Gerencia</p>
            <p className="text-sm font-medium">{trabajador.NomGerencia}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Correo</p>
            <p className="text-sm font-medium">{trabajador.Correo || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">F. Ingreso</p>
            <p className="text-sm font-medium">{formatDate(trabajador.FIngreso)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Equipos Asignados</h2>
        {historial?.length > 0 ? (
          <div className="space-y-3">
            {historial.map((h) => (
              <div
                key={h.IdMovEquipoAsignacion}
                className="flex items-center justify-between py-2 border-b last:border-0 cursor-pointer hover:bg-gray-50"
                onClick={() => navigate(`/equipos/${h.IdMaeEquipo}`)}
              >
                <div>
                  <p className="text-sm font-medium">{h.CodEquipo} - {h.DesTipodeEquipo}</p>
                  <p className="text-xs text-gray-400">{formatDate(h.FecAsignacion)}</p>
                </div>
                <EstadoBadge estado={h.Estado} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Sin equipos asignados</p>
        )}
      </div>
    </div>
  );
}
