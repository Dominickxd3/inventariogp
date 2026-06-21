import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { EstadoBadge } from '../components/Badge';
import DataTable from '../components/DataTable';
import SearchInput from '../components/SearchInput';
import { Button } from '#components/ui/button.jsx';
import { Input } from '#components/ui/input.jsx';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '#components/ui/select.jsx';
import {
  Card, CardContent,
} from '#components/ui/card.jsx';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from '#components/ui/dialog.jsx';
import { Badge } from '#components/ui/badge.jsx';
import { Skeleton } from '#components/ui/skeleton.jsx';
import { Plus, QrCode, Eye, Trash2, Monitor, CheckCircle, Clock, AlertTriangle, Archive, X } from 'lucide-react';
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
  { key: 'total', label: 'Total', icon: Monitor },
  { key: 'disponibles', label: 'Disponibles', icon: CheckCircle },
  { key: 'asignados', label: 'Asignados', icon: Monitor },
  { key: 'mantenimiento', label: 'Mantenimiento', icon: Clock },
  { key: 'incidencia', label: 'Incidencia', icon: AlertTriangle },
  { key: 'baja', label: 'Baja', icon: Archive },
];

export default function Equipos() {
  const [search, setSearch] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [idTipoFiltro, setIdTipoFiltro] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [showCreateOpen, setShowCreateOpen] = useState(false);
  const [showDeleteOpen, setShowDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showQROpen, setShowQROpen] = useState(false);
  const [qrData, setQrData] = useState(null);
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
      setShowCreateOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.equipos.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      queryClient.invalidateQueries({ queryKey: ['equipos-dashboard'] });
      setShowDeleteOpen(false);
      setDeleteTarget(null);
    },
  });

  const qrMutation = useMutation({
    mutationFn: api.equipos.qr,
    onSuccess: (data) => { setQrData(data); setShowQROpen(true); },
  });

  const [form, setForm] = useState({ CodEquipo: '', IdTipodeEquipo: '', CodBarra: '', Obs: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(form);
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

  const confirmDelete = (row) => {
    setDeleteTarget(row);
    setShowDeleteOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Equipos</h1>
        <Button onClick={() => { setForm({ CodEquipo: '', IdTipodeEquipo: '', CodBarra: '', Obs: '' }); setShowCreateOpen(true); }}>
          <Plus className="w-4 h-4" /> Nuevo Equipo
        </Button>
      </div>

      {dashLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {cardConfig.map((c) => <Skeleton key={c.key} className="h-24 rounded-xl" />)}
        </div>
      ) : dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {cardConfig.map(({ key, label, icon: Icon }) => (
            <Card key={key}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
                  <Icon className="w-4 h-4 opacity-50" />
                </div>
                <p className="text-2xl font-bold mt-1 text-foreground">{dashboard[key] ?? 0}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar por código o código de barra..." />
        <Select value={estadoFiltro} onValueChange={(v) => { setEstadoFiltro(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Todos los estados" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los estados</SelectItem>
            {['DISPONIBLE', 'ASIGNADO', 'MANTENIMIENTO', 'INCIDENCIA', 'BAJA'].map((e) => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={idTipoFiltro} onValueChange={(v) => { setIdTipoFiltro(v); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Todos los tipos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los tipos</SelectItem>
            {tipos?.map((t) => (
              <SelectItem key={t.IdTipodeEquipo} value={String(t.IdTipodeEquipo)}>{t.DesTipodeEquipo}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                <Button variant="ghost" size="icon" onClick={() => navigate(`/equipos/${row.IdMaeEquipo}`)}>
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => qrMutation.mutate(row.IdMaeEquipo)}>
                  <QrCode className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => confirmDelete(row)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ),
          },
        ]}
        data={equipos}
        onRowClick={(row) => navigate(`/equipos/${row.IdMaeEquipo}`)}
        pagination={pagination}
      />

      <Dialog open={showCreateOpen} onOpenChange={setShowCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Equipo</DialogTitle>
            <DialogDescription>Completa los datos para registrar un nuevo equipo</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Código</label>
              <Input value={form.CodEquipo} onChange={(e) => setForm({ ...form, CodEquipo: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Código de Barra / SN</label>
              <Input value={form.CodBarra} onChange={(e) => setForm({ ...form, CodBarra: e.target.value })}
                placeholder="Opcional - ingresa el SN del equipo" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Equipo</label>
              <Select value={form.IdTipodeEquipo} onValueChange={(v) => setForm({ ...form, IdTipodeEquipo: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {tipos?.map((t) => (
                    <SelectItem key={t.IdTipodeEquipo} value={String(t.IdTipodeEquipo)}>{t.DesTipodeEquipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
              El código QR se generará automáticamente al guardar el equipo
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Observaciones</label>
              <textarea value={form.Obs} onChange={(e) => setForm({ ...form, Obs: e.target.value })}
                className="w-full min-h-[80px] rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteOpen} onOpenChange={(v) => { setShowDeleteOpen(v); if (!v) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar el equipo <strong>{deleteTarget?.CodEquipo}</strong>?
              {deleteTarget?.Estado === 'ASIGNADO' && (
                <span className="block mt-2 text-destructive">No se puede eliminar un equipo con asignación activa.</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteOpen(false); setDeleteTarget(null); }}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteTarget.IdMaeEquipo)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showQROpen} onOpenChange={setShowQROpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Código QR</DialogTitle>
          </DialogHeader>
          {qrData && (
            <div className="text-center space-y-4">
              <img src={qrData.qr} alt="QR" className="mx-auto" />
              <p className="text-sm text-muted-foreground">Escanea para ver información del equipo</p>
              <a href={qrData.url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary underline break-all block">{qrData.url}</a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
