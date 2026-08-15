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
import AutocompleteInput from '../components/AutocompleteInput';
import { Plus, QrCode, Eye, Archive, Monitor, CheckCircle, Clock, AlertTriangle, Search, Download, Copy, Check, Trash2, Layers, Pencil } from 'lucide-react';
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
  const [qrCopied, setQrCopied] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(equipoFormSchema),
    defaultValues: { IdTipodeEquipo: '', CodBarra: '', Obs: '' },
  });

  const [despuesDeGuardar, setDespuesDeGuardar] = useState('');
  const [caracteristicasVals, setCaracteristicasVals] = useState({});
  const [plantilla, setPlantilla] = useState(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState('');
  const [compFabrica, setCompFabrica] = useState([]);
  const [plantillaSel, setPlantillaSel] = useState('');
  const [cantidadLote, setCantidadLote] = useState(1);
  const [plantillaOpen, setPlantillaOpen] = useState(false);
  const [plantillaEditando, setPlantillaEditando] = useState(null);

  const handleTipoChange = (v) => {
    setTipoSeleccionado(v);
    form.setValue('IdTipodeEquipo', v);
    setCaracteristicasVals({});
    setCompFabrica([]);
    setPlantillaSel('');
    if (!v) { setPlantilla(null); return; }
    api.equipos.plantillaByTipo(Number(v))
      .then(r => setPlantilla(r || []))
      .catch(() => setPlantilla(null));
  };

  const cargarPlantilla = async (id) => {
    if (!id) return;
    try {
      const p = await api.equipos.plantillasComponentes.get(Number(id));
      setCompFabrica((p.componentes || []).map((c) => ({
        IdTipodeComponente: c.IdTipodeComponente,
        Marca: c.Marca || '',
        Modelo: c.Modelo || '',
        Serie: '',
        Capacidad: c.Capacidad || '',
        DesComponente: '',
      })));
      setPlantillaSel(String(id));
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar la plantilla' });
    }
  };

  const esTipoPC = (id) => {
    const nombre = (tiposAsignables?.find(t => String(t.IdTipodeEquipo) === String(id))?.DesTipodeEquipo || '').toUpperCase().trim();
    return nombre === 'PC ESCRITORIO';
  };

  const updateCompFabrica = (idx, patch) => {
    setCompFabrica((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  };

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

  const { data: compTipos } = useQuery({
    queryKey: ['componentes-tipos'],
    queryFn: api.componentes.tipos.list,
  });

  const { data: plantillas } = useQuery({
    queryKey: ['plantillas-componentes'],
    queryFn: api.equipos.plantillasComponentes.list,
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
    mutationFn: async (data) => {
      const cam = plantilla || [];
      for (const c of cam) {
        const v = (caracteristicasVals[c.IdPlantilla] || '').trim();
        if (!v) continue;
        if (c.LongitudMax && v.length > c.LongitudMax) {
          throw new Error(`"${c.Etiqueta || c.Clave}" supera el máximo de ${c.LongitudMax} caracteres`);
        }
        if (c.LongitudMin && v.length < c.LongitudMin) {
          throw new Error(`"${c.Etiqueta || c.Clave}" requiere al menos ${c.LongitudMin} caracteres`);
        }
      }
      const resp = await api.equipos.rapido({
        ...data,
        componentes: compFabrica
          .map((c) => ({
            IdTipodeComponente: c.IdTipodeComponente,
            DesComponente: c.DesComponente?.trim() || undefined,
            Marca: c.Marca?.trim() || undefined,
            Modelo: c.Modelo?.trim() || undefined,
            Serie: c.Serie?.trim() || undefined,
            Capacidad: c.Capacidad?.trim() || undefined,
          }))
          .filter((c) => c.IdTipodeComponente),
      });
      const id = resp.equipo.IdMaeEquipo;
      if (id && cam.length > 0) {
        const vals = Object.entries(caracteristicasVals)
          .filter(([_, v]) => v)
          .map(([idPlantilla, valor]) => ({ IdPlantilla: Number(idPlantilla), Valor: valor }));
        if (vals.length > 0) await api.equipos.saveCaracteristicas(id, vals);
      }
      return resp;
    },
    onSuccess: (resp) => {
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      queryClient.invalidateQueries({ queryKey: ['equipos-dashboard'] });
      setCaracteristicasVals({});
      setCompFabrica([]);
      Swal.fire({ icon: 'success', title: 'Equipo creado', timer: 1500, showConfirmButton: false });

      switch (despuesDeGuardar) {
        case 'registrar_otro':
          form.reset({ IdTipodeEquipo: '', CodBarra: '', Obs: '' });
          setTipoSeleccionado('');
          setPlantilla(null);
          setCaracteristicasVals({});
          setCompFabrica([]);
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

  const loteMutation = useMutation({
    mutationFn: api.equipos.rapidoLote,
    onSuccess: (resp) => {
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      queryClient.invalidateQueries({ queryKey: ['equipos-dashboard'] });
      const cods = (resp.creados || []).map((e) => e.CodEquipo);
      Swal.fire({ icon: 'success', title: `${cods.length} PC(s) creadas`, html: `<div class="text-left text-sm">${cods.join('<br/>')}</div>`, confirmButtonText: 'Cerrar' });
    },
    onError: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.message }),
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
        <Button variant="outline" onClick={() => { setPlantillaEditando(null); setPlantillaOpen(true); }}>
          <Layers className="w-4 h-4" /> Plantillas
        </Button>
        <Button onClick={() => {
          form.reset({ IdTipodeEquipo: '', CodBarra: '', Obs: '' });
          setDespuesDeGuardar('');
          setTipoSeleccionado('');
          setPlantilla(null);
          setCaracteristicasVals({});
          setCompFabrica([]);
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
        <Select value={estadoFiltro || 'Todos'} onValueChange={(v) => { setEstadoFiltro(v === 'Todos' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Todos los estados">
              {estadoFiltro ? estadoFiltro : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos los estados</SelectItem>
            {ESTADOS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={idTipoFiltro || 'Todos'} onValueChange={(v) => { setIdTipoFiltro(v === 'Todos' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todos los tipos">
              {(() => {
                if (!idTipoFiltro) return null;
                return tipos?.find(t => String(t.IdTipodeEquipo) === idTipoFiltro)?.DesTipodeEquipo;
              })()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos los tipos</SelectItem>
            {tipos?.map((t) => (
              <SelectItem key={t.IdTipodeEquipo} value={String(t.IdTipodeEquipo)}>{t.DesTipodeEquipo}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={[
          { key: 'CodEquipo', label: 'Código' },
          {
            key: 'nombreEquipo',
            label: 'Equipo',
            sortable: false,
            render: (row) => {
              const nombre = [row.Marca, row.Modelo].filter(Boolean).join(' - ');
              const extra = [row.Ram, row.Capacidad].filter(Boolean).join(' / ');
              return nombre ? `${nombre}${extra ? ` — ${extra}` : ''}` : '-';
            },
          },
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
              <Select value={tipoSeleccionado} onValueChange={handleTipoChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar tipo de equipo...">
                    {tiposAsignables?.find(t => String(t.IdTipodeEquipo) === tipoSeleccionado)?.DesTipodeEquipo}
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
              <Input data-equipo-codbarra {...form.register('CodBarra')}
                onChange={(e) => form.setValue('CodBarra', e.target.value.toUpperCase())}
                placeholder="Escanea o escribe el código del equipo" />
              <p className="text-xs text-muted-foreground">Puedes dejarlo vacío si el equipo no tiene código visible.</p>
            </div>

            {plantilla && plantilla.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-sm font-semibold text-foreground border-b pb-1">Características</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {plantilla.map((c) => {
                    const etiqueta = c.Etiqueta || c.Clave;
                    const tieneLimite = c.LongitudMax || c.LongitudMin;
                    return (
                      <div key={c.IdPlantilla} className="space-y-1">
                        <label className="text-sm font-medium text-foreground">
                          {etiqueta}
                          {c.Requerido ? <span className="text-red-500 ml-0.5">*</span> : null}
                        </label>
                        <AutocompleteInput
                          placeholder={etiqueta}
                          maxLength={c.LongitudMax || undefined}
                          searchFn={(q) => api.equipos.plantillaValores(c.IdPlantilla, q).then((res) => (res || []).map((v) => v.Valor))}
                          value={caracteristicasVals[c.IdPlantilla] || ''}
                          onChange={(v) => setCaracteristicasVals((prev) => ({ ...prev, [c.IdPlantilla]: v }))}
                        />
                        {tieneLimite && (
                          <p className="text-xs text-muted-foreground">
                            {c.LongitudMin ? `${c.LongitudMin} a ` : 'Hasta '}{c.LongitudMax} caracteres
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {tipoSeleccionado && esTipoPC(tipoSeleccionado) && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground border-b pb-1">Componentes de fábrica</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => setCompFabrica((p) => [...p, { IdTipodeComponente: '', Marca: '', Modelo: '', Serie: '', Capacidad: '', DesComponente: '' }])}>
                    <Plus className="w-4 h-4" /> Agregar pieza
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Registra las piezas que trae la PC armada de fábrica. Se crearán en Componentes y se vincularán a esta PC (origen FABRICA). Opcional.</p>
                {(plantillas || []).length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Usar plantilla (opcional)</label>
                    <Select value={plantillaSel} onValueChange={(v) => cargarPlantilla(v)}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar plantilla para precargar piezas..." /></SelectTrigger>
                      <SelectContent>
                        {(plantillas || []).map((p) => (
                          <SelectItem key={p.IdPlantillaComp} value={String(p.IdPlantillaComp)}>{p.Nombre} ({p.TotalComponentes} piezas)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {plantillaSel && (
                  <div className="border rounded-lg p-3 space-y-2 bg-muted/40">
                    <p className="text-sm font-semibold text-foreground">Registrar por lote</p>
                    <p className="text-xs text-muted-foreground">Crea varias PCs a la vez con esta plantilla. Cada PC tendrá su propia instancia de cada pieza (origen FABRICA).</p>
                    <div className="flex items-center gap-2">
                      <label className="text-sm whitespace-nowrap">Cantidad de PCs:</label>
                      <Input type="number" min={1} max={100} value={cantidadLote}
                        onChange={(e) => setCantidadLote(parseInt(e.target.value, 10) || 1)}
                        className="w-24" />
                    </div>
                    <Button type="button" onClick={() => loteMutation.mutate({ IdTipodeEquipo: Number(tipoSeleccionado), cantidad: cantidadLote, idPlantillaComp: Number(plantillaSel) })} disabled={loteMutation.isPending}>
                      <Layers className="w-4 h-4" /> {loteMutation.isPending ? 'Creando...' : `Crear ${cantidadLote} PC(s)`}
                    </Button>
                  </div>
                )}
                {compFabrica.length > 0 && (
                  <div className="space-y-2">
                    {compFabrica.map((c, idx) => (
                      <div key={idx} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Tipo de componente</label>
                            <Select value={String(c.IdTipodeComponente || '')} onValueChange={(v) => updateCompFabrica(idx, { IdTipodeComponente: Number(v) })}>
                              <SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar tipo..." /></SelectTrigger>
                              <SelectContent>
                                {(compTipos || []).map((t) => (
                                  <SelectItem key={t.IdTipodeComponente} value={String(t.IdTipodeComponente)}>{t.DesTipodeComponente}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => setCompFabrica((p) => p.filter((_, i) => i !== idx))}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="Marca (ej: Kingston)" value={c.Marca} onChange={(e) => updateCompFabrica(idx, { Marca: e.target.value })} />
                          <Input placeholder="Modelo (ej: HyperX)" value={c.Modelo} onChange={(e) => updateCompFabrica(idx, { Modelo: e.target.value })} />
                          <Input placeholder="Serie / S/N" value={c.Serie} onChange={(e) => updateCompFabrica(idx, { Serie: e.target.value })} />
                          <Input placeholder="Capacidad (ej: 8GB)" value={c.Capacidad} onChange={(e) => updateCompFabrica(idx, { Capacidad: e.target.value })} />
                        </div>
                        <Input placeholder="Descripción (opcional)" value={c.DesComponente} onChange={(e) => updateCompFabrica(idx, { DesComponente: e.target.value })} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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

      {/* Gestor de plantillas de componentes */}
      <Dialog open={plantillaOpen} onOpenChange={(v) => { setPlantillaOpen(v); if (!v) setPlantillaEditando(null); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{plantillaEditando ? 'Editar plantilla' : 'Plantillas de componentes'}</DialogTitle>
            <DialogDescription>Configuración estándar de piezas para registrar PCs armadas por lote.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!plantillaEditando && (
              <div className="space-y-2">
                {(plantillas || []).map((p) => (
                  <div key={p.IdPlantillaComp} className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <p className="text-sm font-medium">{p.Nombre}</p>
                      <p className="text-xs text-muted-foreground">{p.TotalComponentes} pieza(s){p.Descripcion ? ` · ${p.Descripcion}` : ''}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={async () => {
                        const d = await api.equipos.plantillasComponentes.get(p.IdPlantillaComp);
                        setPlantillaEditando({ ...d, componentes: (d.componentes || []).map((c) => ({ IdTipodeComponente: c.IdTipodeComponente, Marca: c.Marca || '', Modelo: c.Modelo || '', Capacidad: c.Capacidad || '' })) });
                      }}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => {
                        Swal.fire({
                          title: '¿Eliminar plantilla?', text: p.Nombre, icon: 'warning', showCancelButton: true, confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar',
                        }).then(async (r) => {
                          if (r.isConfirmed) {
                            await api.equipos.plantillasComponentes.remove(p.IdPlantillaComp);
                            queryClient.invalidateQueries({ queryKey: ['plantillas-componentes'] });
                            Swal.fire({ icon: 'success', title: 'Plantilla eliminada', timer: 1500, showConfirmButton: false });
                          }
                        });
                      }}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(plantillas || []).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aún no hay plantillas.</p>}
                <Button type="button" onClick={() => setPlantillaEditando({ Nombre: '', Descripcion: '', componentes: [] })} className="w-full">
                  <Plus className="w-4 h-4" /> Nueva plantilla
                </Button>
              </div>
            )}

            {plantillaEditando && (
              <div className="space-y-3 border-t pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nombre <span className="text-destructive">*</span></label>
                    <Input value={plantillaEditando.Nombre} onChange={(e) => setPlantillaEditando({ ...plantillaEditando, Nombre: e.target.value })} placeholder="Ej: PC Estándar Oficina" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Descripción</label>
                    <Input value={plantillaEditando.Descripcion || ''} onChange={(e) => setPlantillaEditando({ ...plantillaEditando, Descripcion: e.target.value })} placeholder="Opcional" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Piezas de la plantilla</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => setPlantillaEditando((prev) => ({ ...prev, componentes: [...prev.componentes, { IdTipodeComponente: '', Marca: '', Modelo: '', Capacidad: '' }] }))}>
                    <Plus className="w-4 h-4" /> Agregar pieza
                  </Button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {plantillaEditando.componentes.map((c, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-center">
                      <Select value={String(c.IdTipodeComponente || '')} onValueChange={(v) => setPlantillaEditando((prev) => {
                        const arr = [...prev.componentes]; arr[idx] = { ...arr[idx], IdTipodeComponente: Number(v) }; return { ...prev, componentes: arr };
                      })}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Tipo" /></SelectTrigger>
                        <SelectContent>
                          {(compTipos || []).map((t) => (
                            <SelectItem key={t.IdTipodeComponente} value={String(t.IdTipodeComponente)}>{t.DesTipodeComponente}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input placeholder="Marca" value={c.Marca} onChange={(e) => setPlantillaEditando((prev) => { const arr = [...prev.componentes]; arr[idx] = { ...arr[idx], Marca: e.target.value }; return { ...prev, componentes: arr }; })} />
                      <Input placeholder="Modelo" value={c.Modelo} onChange={(e) => setPlantillaEditando((prev) => { const arr = [...prev.componentes]; arr[idx] = { ...arr[idx], Modelo: e.target.value }; return { ...prev, componentes: arr }; })} />
                      <Input placeholder="Capacidad" value={c.Capacidad} onChange={(e) => setPlantillaEditando((prev) => { const arr = [...prev.componentes]; arr[idx] = { ...arr[idx], Capacidad: e.target.value }; return { ...prev, componentes: arr }; })} />
                      <Button type="button" variant="ghost" size="icon" onClick={() => setPlantillaEditando((prev) => ({ ...prev, componentes: prev.componentes.filter((_, i) => i !== idx) }))}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  {plantillaEditando.componentes.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">Sin piezas. Agrega al menos una.</p>}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setPlantillaEditando(null)}>Cancelar</Button>
                  <Button onClick={async () => {
                    const payload = {
                      Nombre: plantillaEditando.Nombre,
                      Descripcion: plantillaEditando.Descripcion,
                      componentes: plantillaEditando.componentes.filter((c) => c.IdTipodeComponente),
                    };
                    try {
                      if (plantillaEditando.IdPlantillaComp) {
                        await api.equipos.plantillasComponentes.update(plantillaEditando.IdPlantillaComp, payload);
                      } else {
                        await api.equipos.plantillasComponentes.create(payload);
                      }
                      queryClient.invalidateQueries({ queryKey: ['plantillas-componentes'] });
                      setPlantillaEditando(null);
                      Swal.fire({ icon: 'success', title: 'Plantilla guardada', timer: 1200, showConfirmButton: false });
                    } catch (e) {
                      Swal.fire({ icon: 'error', title: 'Error', text: e.message });
                    }
                  }}>
                    Guardar plantilla
                  </Button>
                </div>
              </div>
            )}
          </div>
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
            <DialogDescription>Escanea con tu celular para acceder a la ficha del equipo</DialogDescription>
          </DialogHeader>
          {qrData && (
            <div className="text-center space-y-4 py-2">
              <div className="bg-white rounded-xl p-4 inline-block mx-auto shadow-sm border border-border/50">
                <img src={qrData.qr} alt="QR" className="mx-auto" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Enlace directo</p>
                <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                  <code className="flex-1 text-xs text-left break-all">{qrData.url}</code>
                  <Button variant="ghost" size="icon-sm" onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}${qrData.url}`);
                    setQrCopied(true);
                    setTimeout(() => setQrCopied(false), 2000);
                  }}>
                    {qrCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                  const a = document.createElement('a');
                  a.href = qrData.qr;
                  a.download = `QR-${qrData.equipo?.CodEquipo || 'equipo'}.png`;
                  a.click();
                }}>
                  <Download className="w-4 h-4 mr-1.5" /> Descargar
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                  setShowQROpen(false);
                  navigate(qrData.url);
                }}>
                  <Eye className="w-4 h-4 mr-1.5" /> Abrir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
