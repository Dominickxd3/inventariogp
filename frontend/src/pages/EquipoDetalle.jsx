import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { EstadoBadge } from '../components/Badge';
import { formatDate } from '../lib/utils';
import { ArrowLeft, QrCode } from 'lucide-react';
import { useState } from 'react';
import Modal from '../components/Modal';

export default function EquipoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showQR, setShowQR] = useState(null);

  const { data: equipo, isLoading } = useQuery({
    queryKey: ['equipo', id],
    queryFn: () => api.equipos.get(id),
  });

  const { data: historial } = useQuery({
    queryKey: ['historial-equipo', id],
    queryFn: () => api.asignaciones.historialEquipo(id),
  });

  if (isLoading) return <div className="text-center py-12 text-gray-400">Cargando...</div>;
  if (!equipo) return <div className="text-center py-12 text-gray-400">Equipo no encontrado</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{equipo.CodEquipo}</h1>
            <p className="text-gray-500 mt-1">{equipo.DesTipodeEquipo}</p>
          </div>
          <EstadoBadge estado={equipo.Estado} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          <div>
            <p className="text-xs text-gray-400">Código de Barra</p>
            <p className="text-sm font-medium">{equipo.CodBarra || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Fecha de Creación</p>
            <p className="text-sm font-medium">{formatDate(equipo.FecCreacion)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Observaciones</p>
            <p className="text-sm font-medium">{equipo.Obs || '-'}</p>
          </div>
        </div>

        <button
          onClick={async () => {
            const qr = await api.equipos.qr(equipo.IdMaeEquipo);
            setShowQR(qr);
          }}
          className="mt-4 flex items-center gap-2 px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg"
        >
          <QrCode className="w-4 h-4" /> Generar QR
        </button>
      </div>

      {equipo.asignacion && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Asignación Actual</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400">Trabajador</p>
              <p className="text-sm font-medium">{equipo.asignacion.TrabajadorNombre || 'Sin datos'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">DNI</p>
              <p className="text-sm font-medium">{equipo.asignacion.DNI || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Área</p>
              <p className="text-sm font-medium">{equipo.asignacion.AreaName || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Cargo</p>
              <p className="text-sm font-medium">{equipo.asignacion.NomCargo || '-'}</p>
            </div>
          </div>
        </div>
      )}

      {equipo.componentes?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Componentes Asignados</h2>
          <div className="space-y-2">
            {equipo.componentes.map((c) => (
              <div key={c.IdMovEquipoComponente} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{c.DesComponente || c.CodComponente}</p>
                  <p className="text-xs text-gray-400">{c.DesTipodeComponente}</p>
                </div>
                {c.Serie && <span className="text-xs text-gray-500">Serie: {c.Serie}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Historial de Asignaciones</h2>
        {historial?.length > 0 ? (
          <div className="space-y-3">
            {historial.map((h) => (
              <div key={h.IdMovEquipoAsignacion} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{h.Trabajador || `ID: ${h.IdReferente}`}</p>
                  <p className="text-xs text-gray-400">{formatDate(h.FecAsignacion)} - {formatDate(h.FecCese) || 'Actual'}</p>
                </div>
                <EstadoBadge estado={h.Estado} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Sin historial de asignaciones</p>
        )}
      </div>

      <Modal open={!!showQR} onClose={() => setShowQR(null)} title="Código QR" size="sm">
        {showQR && (
          <div className="text-center space-y-4">
            <img src={showQR.qr} alt="QR" className="mx-auto" />
            <p className="text-sm text-gray-500">Escanea para ver información del equipo</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
