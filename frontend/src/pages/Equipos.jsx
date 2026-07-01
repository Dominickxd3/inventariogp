import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import Swal from 'sweetalert2';
import { StatusBadge } from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { Button } from '#components/ui/button.jsx';
import { Input } from '#components/ui/input.jsx';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '#components/ui/select.jsx';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from '#components/ui/dialog.jsx';
import { Skeleton } from '#components/ui/skeleton.jsx';
import { Plus, QrCode, Eye, Archive, Monitor, CheckCircle, Clock, AlertTriangle, Search } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const equipoFormSchema = z.object({
  IdTipodeEquipo: z.string().min(1, 'Selecciona un tipo de equipo'),
  CodBarra: z.string().optional(),
  Obs: z.string().optional(),
});

const cardConfig = [
  { key: 'total', label: 'Total', icon: Monitor },
  { key: 'disponibles', label: 'Disponibles', icon: CheckCircle },
  { key: 'asignados', label: 'Asignados', icon: Monitor },
  { key: 'mantenimiento', label: 'Mantenimiento', icon: Clock },
  { key: 'incidencia', label: 'Incidencia', icon: AlertTriangle },
  { key: 'baja', label: 'Baja', icon: Archive },
];

const ESTADOS = ['DISPONIBLE', 'ASIGNADO', 'MANTENIMIENTO', 'INCIDENCIA', 'BAJA'];

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
  const [bajaMotivo, setBajaMotivo] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(equipoFormSchema),
    defaultValues: { IdTipodeEquipo: '', CodBarra: '', Obs: '' },
  });

  const [despuesDeGuardar, setDespuesDeGuardar] = useState('');

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

  const { data: tiposAsignables } = useQuery({
    queryKey: ['equipos-tipos-asignables'],
    queryFn: api.equipos.tiposAsignables,
  });

  const bajaMutation = useMutation({
    mutationFn: ({ id, motivo }) => api.equipos.baja(id, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      queryClient.invalidateQueries({ queryKey: ['equipos-dashboard'] });
      setShowDeleteOpen(false);
      setDeleteTarget(null);
      setBajaMotivo('');
      Swal.fire({ icon: 'success', title: 'Equipo dado de baja', timer: 2000, showConfirmButton: false });
    },
    onError: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.message }),
  });

  const qrMutation = useMutation({
    mutationFn: api.equipos.qr,
    onSuccess: (data) => { setQrData(data); setShowQROpen(true); },
  });

  const createRapidoMutation = useMutation({
    mutationFn: api.equipos.rapido,
    onSuccess: (resp) => {
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      queryClient.invalidateQueries({ queryKey: ['equipos-dashboard'] });
      Swal.fire({ icon: 'success', title: 'Equipo creado', timer: 1500, showConfirmButton: false });

      switch (despuesDeGuardar) {
        case 'registrar_otro':
          form.reset({ IdTipodeEquipo: '', CodBarra: '', Obs: '' });
          setTimeout(() => document.querySelector('[data-equipo-codbarra]')?.focus(), 150);
          break;
        case 'asignar_ahora':
          setShowCreateOpen(false);
          navigate(`/asignaciones?nuevoEquipo=${resp.equipo.IdMaeEquipo}`);
          break;
        default:
          setShowCreateOpen(false);
          break;
      }
    },
    onError: (err) => Swal.fire({ icon: 'error', title: 'Error al crear', text: err.message }),
  });

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
    <div className="space-y-6">
      <PageHeader title="Equipos" description="Gestión de equipos del inventario">
        <Button onClick={() => {
          form.reset({ IdTipodeEquipo: '', CodBarra: '', Obs: '' });
          setDespuesDeGuardar('');
          setShowCreateOpen(true);
        }}>
          <Plus className="w-4 h-4" /> Nuevo Equipo
        </Button>
      </PageHeader>

      {dashLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {cardConfig.map((c) => <Skeleton key={c.key} className="h-24 rounded-xl" />)}
        </div>
      ) : dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {cardConfig.map(({ key, label, icon: Icon }) => (
            <div key={key} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
                <Icon className="w-4 h-4 opacity-50" />
              </div>
              <p className="text-2xl font-bold text-foreground">{dashboard[key] ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por código o serie..."
            className="h-8 w-64 rounded-lg border border-input bg-transparent pl-9 pr-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 placeholder:text-muted-foreground"
          />
        </div>
        <Select value={estadoFiltro} onValueChange={(v) => { setEstadoFiltro(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Todos los estados" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los estados</SelectItem>
            {ESTADOS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
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
          { key: 'CodEquipo', label: 'Código' },
          { key: 'DesTipodeEquipo', label: 'Tipo' },
          { key: 'CodBarra', label: 'Serie' },
          { key: 'Estado', label: 'Estado', render: (row) => <StatusBadge status={row.Estado} /> },
          { key: 'FecCreacion', label: 'Registro', render: (r) => formatDate(r.FecCreacion) },
          {
            key: 'acciones',
            label: '',
            sortable: false,
            render: (row) => (
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon-sm" onClick={() => navigate(`/equipos/${row.IdMaeEquipo}`)}>
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => qrMutation.mutate(row.IdMaeEquipo)}>
                  <QrCode className="w-4 h-4" />
                </Button>
                {row.Estado !== 'BAJA' && (
                  <Button variant="ghost" size="icon-sm" onClick={() => { setDeleteTarget(row); setShowDeleteOpen(true); }}>
                    <Archive className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        data={equipos}
        onRowClick={(row) => navigate(`/equipos/${row.IdMaeEquipo}`)}
        searchable={false}
        loading={isLoading}
        emptyMessage="No se encontraron equipos"
      />

      {/* Create Dialog */}
      <Dialog open={showCreateOpen} onOpenChange={setShowCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="pb-1">
            <DialogTitle>Nuevo Equipo</DialogTitle>
            <DialogDescription>El código interno se genera automáticamente</DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit((data) => {
            createRapidoMutation.mutate({
              IdTipodeEquipo: Number(data.IdTipodeEquipo),
              ...(data.CodBarra?.trim() ? { CodBarra: data.CodBarra.trim() } : {}),
              ...(data.Obs?.trim() ? { Obs: data.Obs.trim() } : {}),
            });
          })} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Tipo de Equipo <span className="text-destructive">*</span>
              </label>
              <Select value={form.watch('IdTipodeEquipo')} onValueChange={(v) => form.setValue('IdTipodeEquipo', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar tipo de equipo...">
                    {(() => {
                      const id = form.watch('IdTipodeEquipo');
                      return tiposAsignables?.find(t => String(t.IdTipodeEquipo) === id)?.DesTipodeEquipo;
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {tiposAsignables?.map((t) => (
                    <SelectItem key={t.IdTipodeEquipo} value={String(t.IdTipodeEquipo)}>{t.DesTipodeEquipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.IdTipodeEquipo && (
                <p className="text-xs text-destructive">{form.formState.errors.IdTipodeEquipo.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Código de barra / Serie</label>
              <Input data-equipo-codbarra {...form.register('CodBarra')} placeholder="Escanea o escribe el código del equipo" />
              <p className="text-xs text-muted-foreground">Puedes dejarlo vacío si el equipo no tiene código visible.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Observaciones</label>
              <textarea {...form.register('Obs')}
                className="w-full min-h-[60px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 placeholder:text-muted-foreground"
                placeholder="Opcional"
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-sm font-medium text-foreground">Después de guardar:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { v: 'registrar_otro', l: 'Registrar otro equipo' },
                  { v: 'asignar_ahora', l: 'Asignar este equipo' },
                ].map(({ v, l }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setDespuesDeGuardar(despuesDeGuardar === v ? '' : v)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                      despuesDeGuardar === v
                        ? 'border-primary border-2 bg-primary/5 text-primary'
                        : 'border-input bg-background text-foreground hover:bg-accent'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setShowCreateOpen(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button type="submit" disabled={createRapidoMutation.isPending} className="w-full sm:w-auto sm:min-w-[180px]">
                {createRapidoMutation.isPending
                  ? 'Guardando...'
                  : ({ registrar_otro: 'Guardar y registrar otro', asignar_ahora: 'Guardar y asignar' })[despuesDeGuardar] || 'Guardar'
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Baja Dialog */}
      <Dialog open={showDeleteOpen} onOpenChange={(v) => { setShowDeleteOpen(v); if (!v) { setDeleteTarget(null); setBajaMotivo(''); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar baja</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de dar de baja el equipo <strong>{deleteTarget?.CodEquipo}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {deleteTarget && (
              <div className="text-sm space-y-1.5 rounded-lg bg-muted/50 p-3 border">
                <div className="flex justify-between"><span className="text-muted-foreground">Tipo:</span><span className="font-medium">{deleteTarget.DesTipodeEquipo}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Estado:</span><StatusBadge status={deleteTarget.Estado} /></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Serie:</span><span className="font-medium">{deleteTarget.CodBarra || '-'}</span></div>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Motivo de baja <span className="text-destructive">*</span></label>
              <textarea
                value={bajaMotivo}
                onChange={(e) => setBajaMotivo(e.target.value)}
                className="w-full min-h-[80px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 placeholder:text-muted-foreground"
                placeholder="Indica el motivo (obsoleto, dañado, pérdida, renovación, etc.)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteOpen(false); setDeleteTarget(null); setBajaMotivo(''); }}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!bajaMotivo.trim()) {
                  Swal.fire({ icon: 'warning', title: 'Motivo requerido', text: 'Ingresa el motivo de la baja' });
                  return;
                }
                bajaMutation.mutate({ id: deleteTarget.IdMaeEquipo, motivo: bajaMotivo.trim() });
              }}
              disabled={bajaMutation.isPending}
            >
              {bajaMutation.isPending ? 'Dando de baja...' : 'Dar de baja'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Dialog */}
      <Dialog open={showQROpen} onOpenChange={setShowQROpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Código QR</DialogTitle>
          </DialogHeader>
          {qrData && (
            <div className="text-center space-y-4 py-2">
              <img src={qrData.qr} alt="QR" className="mx-auto rounded-lg" />
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
