import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { EstadoBadge, IncidenciaBadge } from '../components/Badge';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SearchInput from '../components/SearchInput';
import { Plus, CheckCircle } from 'lucide-react';
import { formatDate } from '../lib/utils';

const columns = [
  { key: 'CodEquipo', label: 'Equipo' },
  { key: 'DesTipodeEquipo', label: 'Tipo' },
  { key: 'Trabajador', label: 'Trabajador', render: (r) => r.Trabajador || '-' },
  {
    key: 'TipoIncidencia',
    label: 'Tipo',
    render: (r) => <IncidenciaBadge tipo={r.TipoIncidencia} />,
  },
  { key: 'FecIncidencia', label: 'Fecha', render: (r) => formatDate(r.FecIncidencia) },
  {
    key: 'Estado',
    label: 'Estado',
    render: (r) => <EstadoBadge estado={r.Estado} />,
  },
];

export default function Incidencias() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['incidencias', search],
    queryFn: () => api.incidencias.list({ search }),
  });

  const cerrarMutation = useMutation({
    mutationFn: api.incidencias.cerrar,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incidencias'] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Incidencias</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Nueva Incidencia
        </button>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Buscar por equipo o trabajador..." />

      <DataTable
        columns={[
          ...columns,
          {
            key: 'acciones',
            label: 'Acciones',
            sortable: false,
            render: (row) => (
              row.Estado === 'ABIERTO' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('¿Cerrar incidencia?')) cerrarMutation.mutate(row.IdIncidencia);
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded-lg"
                >
                  <CheckCircle className="w-3 h-3" /> Cerrar
                </button>
              )
            ),
          },
        ]}
        data={data}
      />

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Registrar Incidencia" size="lg">
        <IncidenciaForm onSuccess={() => { setShowModal(false); queryClient.invalidateQueries({ queryKey: ['incidencias'] }); }} />
      </Modal>
    </div>
  );
}

function IncidenciaForm({ onSuccess }) {
  const [searchEquipo, setSearchEquipo] = useState('');
  const [selectedEquipo, setSelectedEquipo] = useState(null);
  const [selectedTrabajador, setSelectedTrabajador] = useState(null);
  const [form, setForm] = useState({ TipoIncidencia: 'ROBO', Descripcion: '', FecIncidencia: new Date().toISOString().split('T')[0] });

  const { data: equipos } = useQuery({
    queryKey: ['equipos-search-incidencia', searchEquipo],
    queryFn: () => api.equipos.list({ search: searchEquipo }),
    enabled: searchEquipo.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: api.incidencias.create,
    onSuccess,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedEquipo) return;
    createMutation.mutate({
      IdMaeEquipo: selectedEquipo.IdMaeEquipo,
      IdReferente: selectedTrabajador?.PersonalId || null,
      ...form,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Equipo</label>
        <input type="text" value={searchEquipo} onChange={(e) => setSearchEquipo(e.target.value)}
          placeholder="Buscar equipo..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        {equipos && equipos.length > 0 && (
          <div className="mt-1 max-h-40 overflow-y-auto border rounded-lg">
            {equipos.map((e) => (
              <div key={e.IdMaeEquipo} onClick={() => { setSelectedEquipo(e); setSearchEquipo(`${e.CodEquipo} - ${e.DesTipodeEquipo}`); }}
                className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer">{e.CodEquipo} - {e.DesTipodeEquipo}</div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Incidencia</label>
          <select value={form.TipoIncidencia} onChange={(e) => setForm({ ...form, TipoIncidencia: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="ROBO">Robo</option>
            <option value="PERDIDA">Pérdida</option>
            <option value="DAÑO">Daño</option>
            <option value="DEVOLUCION">Devolución</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
          <input type="date" value={form.FecIncidencia} onChange={(e) => setForm({ ...form, FecIncidencia: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea value={form.Descripcion} onChange={(e) => setForm({ ...form, Descripcion: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows={4} required />
      </div>

      <button type="submit" disabled={createMutation.isPending}
        className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50">
        {createMutation.isPending ? 'Registrando...' : 'Registrar Incidencia'}
      </button>
    </form>
  );
}
