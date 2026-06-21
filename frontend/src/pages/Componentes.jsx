import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { EstadoBadge } from '../components/Badge';
import DataTable from '../components/DataTable';
import SearchInput from '../components/SearchInput';
import Modal from '../components/Modal';
import { Plus } from 'lucide-react';

const columns = [
  { key: 'CodComponente', label: 'Código' },
  { key: 'DesComponente', label: 'Descripción' },
  { key: 'DesTipodeComponente', label: 'Tipo' },
  { key: 'Marca', label: 'Marca' },
  { key: 'Modelo', label: 'Modelo' },
  { key: 'Serie', label: 'Serie' },
  { key: 'Estado', label: 'Estado', render: (r) => <EstadoBadge estado={r.Estado} /> },
];

export default function Componentes() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['componentes', search],
    queryFn: () => api.componentes.list({ search }),
  });

  const { data: tipos } = useQuery({
    queryKey: ['componentes-tipos'],
    queryFn: api.componentes.tipos.list,
  });

  const createMutation = useMutation({
    mutationFn: api.componentes.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['componentes'] }); setShowModal(false); },
  });

  const [form, setForm] = useState({ CodComponente: '', DesComponente: '', IdTipodeComponente: '', Marca: '', Modelo: '', Serie: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Componentes / Accesorios</h1>
        <button onClick={() => { setForm({ CodComponente: '', DesComponente: '', IdTipodeComponente: '', Marca: '', Modelo: '', Serie: '' }); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> Nuevo Componente
        </button>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Buscar componente..." />

      <DataTable columns={columns} data={data} />

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo Componente">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
              <input value={form.CodComponente} onChange={(e) => setForm({ ...form, CodComponente: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select value={form.IdTipodeComponente} onChange={(e) => setForm({ ...form, IdTipodeComponente: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required>
                <option value="">Seleccionar...</option>
                {tipos?.map((t) => <option key={t.IdTipodeComponente} value={t.IdTipodeComponente}>{t.DesTipodeComponente}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input value={form.DesComponente} onChange={(e) => setForm({ ...form, DesComponente: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <input value={form.Marca} onChange={(e) => setForm({ ...form, Marca: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
              <input value={form.Modelo} onChange={(e) => setForm({ ...form, Modelo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serie</label>
              <input value={form.Serie} onChange={(e) => setForm({ ...form, Serie: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            Guardar Componente
          </button>
        </form>
      </Modal>
    </div>
  );
}
