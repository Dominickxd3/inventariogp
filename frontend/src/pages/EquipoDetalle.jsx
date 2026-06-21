import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { EstadoBadge } from '../components/Badge';
import { formatDate } from '../lib/utils';
import { ArrowLeft, QrCode, Pencil, Save, X, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Modal from '../components/Modal';

function Skeleton({ lines = 4 }) {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded" />
      <div className="h-4 w-32 bg-gray-200 rounded" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-16 bg-gray-200 rounded" />
            <div className="h-5 w-32 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EquipoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showQR, setShowQR] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});

  const { data: equipo, isLoading } = useQuery({
    queryKey: ['equipo', id],
    queryFn: () => api.equipos.get(id),
  });

  const { data: tipos } = useQuery({
    queryKey: ['equipos-tipos'],
    queryFn: api.equipos.tipos.list,
  });

  const { data: historial } = useQuery({
    queryKey: ['historial-equipo', id],
    queryFn: () => api.asignaciones.historialEquipo(id),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.equipos.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipo', id] });
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      queryClient.invalidateQueries({ queryKey: ['equipos-dashboard'] });
      setEditMode(false);
    },
  });

  const handleEditClick = () => {
    setForm({
      CodEquipo: equipo.CodEquipo,
      IdTipodeEquipo: equipo.IdTipodeEquipo,
      CodBarra: equipo.CodBarra || '',
      Obs: equipo.Obs || '',
      Estado: equipo.Estado,
    });
    setEditMode(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  if (isLoading) return (
    <div className="space-y-6 max-w-4xl">
      <div className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <Skeleton lines={3} />
      </div>
    </div>
  );

  if (!equipo) return <div className="text-center py-12 text-gray-400">Equipo no encontrado</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {!editMode ? (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{equipo.CodEquipo}</h1>
                <p className="text-gray-500 mt-1">{equipo.DesTipodeEquipo}</p>
              </div>
              <div className="flex items-center gap-2">
                <EstadoBadge estado={equipo.Estado} />
                <button onClick={handleEditClick}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
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

            <button onClick={async () => { const qr = await api.equipos.qr(equipo.IdMaeEquipo); setShowQR(qr); }}
              className="mt-4 flex items-center gap-2 px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg">
              <QrCode className="w-4 h-4" /> Generar QR
            </button>
          </>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Editar Equipo</h2>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditMode(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><X className="w-4 h-4" /></button>
                <button type="submit" disabled={updateMutation.isPending}
                  className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50">
                  <Save className="w-4 h-4" /> Guardar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                <input value={form.CodEquipo} onChange={(e) => setForm({ ...form, CodEquipo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código de Barra</label>
                <input value={form.CodBarra} onChange={(e) => setForm({ ...form, CodBarra: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Equipo</label>
                <select value={form.IdTipodeEquipo} onChange={(e) => setForm({ ...form, IdTipodeEquipo: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required>
                  {tipos?.map((t) => (
                    <option key={t.IdTipodeEquipo} value={t.IdTipodeEquipo}>{t.DesTipodeEquipo}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select value={form.Estado} onChange={(e) => setForm({ ...form, Estado: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  {['DISPONIBLE', 'ASIGNADO', 'MANTENIMIENTO', 'INCIDENCIA', 'BAJA'].map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                <textarea value={form.Obs} onChange={(e) => setForm({ ...form, Obs: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows={2} />
              </div>
            </div>
          </form>
        )}
      </div>

      {equipo.asignacion && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Asignación Actual</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <a href={showQR.url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-600 underline break-all block">{showQR.url}</a>
          </div>
        )}
      </Modal>
    </div>
  );
}
