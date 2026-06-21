import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { EstadoBadge } from '../components/Badge';
import DataTable from '../components/DataTable';
import SearchInput from '../components/SearchInput';
import Modal from '../components/Modal';
import { Plus, QrCode, Eye, Trash2 } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const columns = [
  { key: 'CodEquipo', label: 'Código' },
  { key: 'DesTipodeEquipo', label: 'Tipo' },
  { key: 'CodBarra', label: 'Código de Barra' },
  {
    key: 'Estado',
    label: 'Estado',
    render: (row) => <EstadoBadge estado={row.Estado} />,
  },
  { key: 'FecCreacion', label: 'Registro', render: (r) => formatDate(r.FecCreacion) },
];

export default function Equipos() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showQR, setShowQR] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: equipos, isLoading } = useQuery({
    queryKey: ['equipos', search],
    queryFn: () => api.equipos.list({ search }),
  });

  const { data: tipos } = useQuery({
    queryKey: ['equipos-tipos'],
    queryFn: api.equipos.tipos.list,
  });

  const createMutation = useMutation({
    mutationFn: api.equipos.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      setShowModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.equipos.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipos'] }),
  });

  const qrMutation = useMutation({
    mutationFn: api.equipos.qr,
    onSuccess: (data) => setShowQR(data),
  });

  const [form, setForm] = useState({ CodEquipo: '', IdTipodeEquipo: '', Obs: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Equipos</h1>
        <button
          onClick={() => { setForm({ CodEquipo: '', IdTipodeEquipo: '', Obs: '' }); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Nuevo Equipo
        </button>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Buscar por código o código de barra..." />

      <DataTable
        columns={[
          ...columns,
          {
            key: 'acciones',
            label: 'Acciones',
            sortable: false,
            render: (row) => (
              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); navigate(`/equipos/${row.IdMaeEquipo}`); }}
                  className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); qrMutation.mutate(row.IdMaeEquipo); }}
                  className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600">
                  <QrCode className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); if (confirm('¿Eliminar equipo?')) deleteMutation.mutate(row.IdMaeEquipo); }}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ),
          },
        ]}
        data={equipos}
        onRowClick={(row) => navigate(`/equipos/${row.IdMaeEquipo}`)}
      />

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo Equipo">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
            <input
              value={form.CodEquipo} onChange={(e) => setForm({ ...form, CodEquipo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Equipo</label>
            <select
              value={form.IdTipodeEquipo} onChange={(e) => setForm({ ...form, IdTipodeEquipo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" required
            >
              <option value="">Seleccionar...</option>
              {tipos?.map((t) => (
                <option key={t.IdTipodeEquipo} value={t.IdTipodeEquipo}>{t.DesTipodeEquipo}</option>
              ))}
            </select>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            El código QR se generará automáticamente al guardar el equipo
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea
              value={form.Obs} onChange={(e) => setForm({ ...form, Obs: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" rows={3}
            />
          </div>
          <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            Guardar Equipo
          </button>
        </form>
      </Modal>

      <Modal open={!!showQR} onClose={() => setShowQR(null)} title="Código QR" size="sm">
        {showQR && (
          <div className="text-center space-y-4">
            <img src={showQR.qr} alt="QR" className="mx-auto" />
            <p className="text-sm text-gray-500">Escanea para ver información del equipo</p>
            <p className="text-xs text-gray-400 break-all">{showQR.url}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
