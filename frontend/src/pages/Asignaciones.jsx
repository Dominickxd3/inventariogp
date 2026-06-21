import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { EstadoBadge } from '../components/Badge';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, XCircle } from 'lucide-react';
import { formatDate } from '../lib/utils';

const columns = [
  {
    key: 'TrabajadorNombre',
    label: 'Trabajador',
    render: (r) => r.TrabajadorNombre || `ID: ${r.IdReferente}`,
  },
  { key: 'CodEquipo', label: 'Equipo' },
  { key: 'DesTipodeEquipo', label: 'Tipo' },
  { key: 'AreaName', label: 'Área' },
  { key: 'FecAsignacion', label: 'Desde', render: (r) => formatDate(r.FecAsignacion) },
  {
    key: 'Estado',
    label: 'Estado',
    render: (r) => <EstadoBadge estado={r.Estado} />,
  },
];

export default function Asignaciones() {
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: asignaciones, isLoading } = useQuery({
    queryKey: ['asignaciones'],
    queryFn: () => api.asignaciones.list({ estado: 'VIGENTE' }),
  });

  const cesarMutation = useMutation({
    mutationFn: api.asignaciones.cesar,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['asignaciones'] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Asignaciones</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Nueva Asignación
        </button>
      </div>

      <DataTable
        columns={[
          ...columns,
          {
            key: 'acciones',
            label: 'Acciones',
            sortable: false,
            render: (row) => (
              row.Estado === 'VIGENTE' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('¿Cesar asignación?')) cesarMutation.mutate(row.IdMovEquipoAsignacion);
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <XCircle className="w-3 h-3" /> Cesar
                </button>
              )
            ),
          },
        ]}
        data={asignaciones}
      />

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva Asignación" size="lg">
        <AsignarForm onSuccess={() => { setShowModal(false); queryClient.invalidateQueries({ queryKey: ['asignaciones'] }); }} />
      </Modal>
    </div>
  );
}

function AsignarForm({ onSuccess }) {
  const [step, setStep] = useState(1);
  const [searchTrab, setSearchTrab] = useState('');
  const [searchEquipo, setSearchEquipo] = useState('');
  const [selectedTrab, setSelectedTrab] = useState(null);
  const [selectedEquipo, setSelectedEquipo] = useState(null);
  const [obs, setObs] = useState('');

  const { data: trabajadores } = useQuery({
    queryKey: ['trabajadores-search', searchTrab],
    queryFn: () => api.trabajadores.search({ search: searchTrab }),
    enabled: searchTrab.length > 2,
  });

  const { data: equipos } = useQuery({
    queryKey: ['equipos-disponibles', searchEquipo],
    queryFn: () => api.equipos.list({ estado: 'DISPONIBLE', search: searchEquipo }),
  });

  const asignarMutation = useMutation({
    mutationFn: api.asignaciones.create,
    onSuccess,
  });

  const handleAsignar = () => {
    if (!selectedTrab || !selectedEquipo) return;
    asignarMutation.mutate({
      IdMaeEquipo: selectedEquipo.IdMaeEquipo,
      IdReferente: selectedTrab.PersonalId,
      Obs: obs,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`flex-1 h-2 rounded-full ${step >= s ? 'bg-blue-500' : 'bg-gray-200'}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <h3 className="font-medium">Seleccionar Trabajador</h3>
          <input
            type="text" value={searchTrab} onChange={(e) => setSearchTrab(e.target.value)}
            placeholder="Buscar por DNI o nombre..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <div className="max-h-60 overflow-y-auto space-y-1">
            {trabajadores?.map((t) => (
              <div
                key={t.PersonalId}
                onClick={() => { setSelectedTrab(t); setStep(2); }}
                className={`p-3 rounded-lg cursor-pointer text-sm ${selectedTrab?.PersonalId === t.PersonalId ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}
              >
                <p className="font-medium">{t.APaterno} {t.AMaterno}, {t.Nombres}</p>
                <p className="text-gray-400 text-xs">{t.DNI} - {t.NomCargo}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <h3 className="font-medium">Seleccionar Equipo</h3>
          <input
            type="text" value={searchEquipo} onChange={(e) => setSearchEquipo(e.target.value)}
            placeholder="Buscar equipo..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <div className="max-h-60 overflow-y-auto space-y-1">
            {equipos?.map((e) => (
              <div
                key={e.IdMaeEquipo}
                onClick={() => { setSelectedEquipo(e); }}
                className={`p-3 rounded-lg cursor-pointer text-sm ${selectedEquipo?.IdMaeEquipo === e.IdMaeEquipo ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}
              >
                <p className="font-medium">{e.CodEquipo} - {e.DesTipodeEquipo}</p>
                <p className="text-gray-400 text-xs">{e.CodBarra || 'Sin código de barra'}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Atrás</button>
            <button onClick={() => setStep(3)} disabled={!selectedEquipo}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <h3 className="font-medium">Confirmar Asignación</h3>
          <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
            <p><strong>Trabajador:</strong> {selectedTrab?.APaterno} {selectedTrab?.AMaterno}, {selectedTrab?.Nombres}</p>
            <p><strong>Equipo:</strong> {selectedEquipo?.CodEquipo} - {selectedEquipo?.DesTipodeEquipo}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea value={obs} onChange={(e) => setObs(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows={2} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Atrás</button>
            <button onClick={handleAsignar} disabled={asignarMutation.isPending}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {asignarMutation.isPending ? 'Asignando...' : 'Confirmar Asignación'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
