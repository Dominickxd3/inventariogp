import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { EstadoBadge } from '../components/Badge';
import DataTable from '../components/DataTable';
import SearchInput from '../components/SearchInput';
import Modal from '../components/Modal';
import { Plus, QrCode, Eye, Trash2, Scan, Monitor, CheckCircle, Clock, AlertTriangle, Archive, X } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const columns = [
  { key: 'CodEquipo', label: 'Código' },
  { key: 'DesTipodeEquipo', label: 'Tipo' },
  { key: 'CodBarra', label: 'Código de Barra' },
  { key: 'Estado', label: 'Estado', render: (row) => <EstadoBadge estado={row.Estado} /> },
  { key: 'FecCreacion', label: 'Registro', render: (r) => formatDate(r.FecCreacion) },
];

const cardConfig = [
  { key: 'total', label: 'Total', color: 'bg-gray-50 text-gray-700 border-gray-200', icon: Monitor },
  { key: 'disponibles', label: 'Disponibles', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
  { key: 'asignados', label: 'Asignados', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Monitor },
  { key: 'mantenimiento', label: 'Mantenimiento', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock },
  { key: 'incidencia', label: 'Incidencia', color: 'bg-red-50 text-red-700 border-red-200', icon: AlertTriangle },
  { key: 'baja', label: 'Baja', color: 'bg-gray-50 text-gray-700 border-gray-200', icon: Archive },
];

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cardConfig.map((c) => (
        <div key={c.key} className="h-24 rounded-xl border border-gray-200 bg-gray-100 animate-pulse" />
      ))}
    </div>
  );
}

export default function Equipos() {
  const [search, setSearch] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [idTipoFiltro, setIdTipoFiltro] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [showModal, setShowModal] = useState(false);
  const [showQR, setShowQR] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [scanCode, setScanCode] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['equipos-dashboard'],
    queryFn: api.equipos.dashboard,
  });

  const { data: pageData, isLoading } = useQuery({
    queryKey: ['equipos', search, estadoFiltro, idTipoFiltro, page, pageSize],
    queryFn: () => api.equipos.list({ search, estado: estadoFiltro, idTipo: idTipoFiltro, page, pageSize }),
  });

  const { data: tipos } = useQuery({
    queryKey: ['equipos-tipos'],
    queryFn: api.equipos.tipos.list,
  });

  const createMutation = useMutation({
    mutationFn: api.equipos.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      queryClient.invalidateQueries({ queryKey: ['equipos-dashboard'] });
      setShowModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.equipos.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      queryClient.invalidateQueries({ queryKey: ['equipos-dashboard'] });
      setDeleteTarget(null);
    },
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

  const handleScan = async (e) => {
    e.preventDefault();
    if (!scanCode.trim()) return;
    try {
      const equipo = await api.equipos.scan(scanCode.trim());
      navigate(`/equipos/${equipo.IdMaeEquipo}`);
    } catch {
      alert('Equipo no encontrado');
    }
  };

  const equipos = pageData?.rows;
  const pagination = pageData ? {
    page: pageData.page,
    pageSize: pageData.pageSize,
    total: pageData.total,
    totalPages: pageData.totalPages,
    onPageChange: (p) => { setPage(p); window.scrollTo(0, 0); },
    onPageSizeChange: (s) => { setPageSize(s); setPage(1); },
  } : undefined;

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

      {dashLoading ? <DashboardSkeleton /> : dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {cardConfig.map(({ key, label, color, icon: Icon }) => (
            <div key={key} className={`rounded-xl border p-4 ${color}`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
                <Icon className="w-4 h-4 opacity-50" />
              </div>
              <p className="text-2xl font-bold mt-1">{dashboard[key] ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar por código o código de barra..." />
        <select value={estadoFiltro} onChange={(e) => { setEstadoFiltro(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          <option value="">Todos los estados</option>
          {['DISPONIBLE', 'ASIGNADO', 'MANTENIMIENTO', 'INCIDENCIA', 'BAJA'].map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <select value={idTipoFiltro} onChange={(e) => { setIdTipoFiltro(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          <option value="">Todos los tipos</option>
          {tipos?.map((t) => (
            <option key={t.IdTipodeEquipo} value={t.IdTipodeEquipo}>{t.DesTipodeEquipo}</option>
          ))}
        </select>
        <form onSubmit={handleScan} className="flex gap-2">
          <input
            type="text" value={scanCode} onChange={(e) => setScanCode(e.target.value)}
            placeholder="Escanear código..." className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-40"
          />
          <button type="submit" className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
            <Scan className="w-4 h-4" />
          </button>
        </form>
      </div>

      <DataTable
        columns={[
          ...columns,
          {
            key: 'acciones',
            label: 'Acciones',
            sortable: false,
            render: (row) => (
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => navigate(`/equipos/${row.IdMaeEquipo}`)}
                  className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => qrMutation.mutate(row.IdMaeEquipo)}
                  className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600">
                  <QrCode className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteTarget(row)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ),
          },
        ]}
        data={equipos}
        onRowClick={(row) => navigate(`/equipos/${row.IdMaeEquipo}`)}
        pagination={pagination}
      />

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo Equipo">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
            <input value={form.CodEquipo} onChange={(e) => setForm({ ...form, CodEquipo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Equipo</label>
            <select value={form.IdTipodeEquipo} onChange={(e) => setForm({ ...form, IdTipodeEquipo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" required>
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
            <textarea value={form.Obs} onChange={(e) => setForm({ ...form, Obs: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" rows={3} />
          </div>
          <button type="submit" disabled={createMutation.isPending}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
            {createMutation.isPending ? 'Guardando...' : 'Guardar Equipo'}
          </button>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirmar eliminación" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Estás seguro de eliminar el equipo <strong>{deleteTarget?.CodEquipo}</strong>?
            {deleteTarget?.Estado === 'ASIGNADO' && (
              <span className="block mt-2 text-red-500">No se puede eliminar un equipo con asignación activa.</span>
            )}
          </p>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button onClick={() => deleteMutation.mutate(deleteTarget.IdMaeEquipo)} disabled={deleteMutation.isPending}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </Modal>

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
