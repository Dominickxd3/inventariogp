import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { Button } from '#components/ui/button.jsx';
import { Input } from '#components/ui/input.jsx';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '#components/ui/select.jsx';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '#components/ui/dialog.jsx';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '#components/ui/alert-dialog.jsx';
import ComponenteDetalleDrawer from '../components/componentes/ComponenteDetalleDrawer';
import { Plus, Search, Cpu, Headphones } from 'lucide-react';

const componentTypeConfig = {
  'MEMORIA RAM': { descripcion: 'Ej: Memoria RAM DDR4', marca: 'Ej: Kingston', modelo: 'Ej: Fury Beast', serie: 'Opcional', detalleLabel: 'Detalle técnico', detalle: 'Ej: 16 GB DDR4 3200 MHz' },
  'DISCO SSD': { descripcion: 'Ej: Disco SSD', marca: 'Ej: Kingston', modelo: 'Ej: A400', serie: 'Opcional', detalleLabel: 'Detalle técnico', detalle: 'Ej: 512 GB SSD SATA / NVMe' },
  'DISCO DURO': { descripcion: 'Ej: Disco duro', marca: 'Ej: Seagate', modelo: 'Ej: Barracuda', serie: 'Opcional', detalleLabel: 'Detalle técnico', detalle: 'Ej: 1 TB HDD SATA' },
  CARGADOR: { descripcion: 'Ej: Cargador de laptop', marca: 'Ej: Lenovo', modelo: 'Ej: USB-C 65W', serie: 'Opcional', detalleLabel: 'Detalle técnico', detalle: 'Ej: 65W USB-C' },
  BATERIA: { descripcion: 'Ej: Batería de laptop', marca: 'Ej: Lenovo', modelo: 'Ej: L19M3PF1', serie: 'Opcional', detalleLabel: 'Detalle técnico', detalle: 'Ej: 45Wh / 3 celdas' },
  PANTALLA: { descripcion: 'Ej: Pantalla de laptop', marca: 'Ej: BOE', modelo: 'Ej: NV156FHM', serie: 'Opcional', detalleLabel: 'Detalle técnico', detalle: 'Ej: 15.6 pulgadas FHD' },
  'TARJETA DE VIDEO': { descripcion: 'Ej: Tarjeta de video', marca: 'Ej: NVIDIA', modelo: 'Ej: GTX 1650', serie: 'Opcional', detalleLabel: 'Detalle técnico', detalle: 'Ej: 4 GB GDDR6 / PCIe' },
  MOUSE: { descripcion: 'Ej: Mouse', marca: 'Ej: Logitech', modelo: 'Ej: M90', serie: 'Opcional', detalleLabel: 'Detalle técnico', detalle: 'Ej: USB / inalámbrico' },
  TECLADO: { descripcion: 'Ej: Teclado', marca: 'Ej: Logitech', modelo: 'Ej: K120', serie: 'Opcional', detalleLabel: 'Detalle técnico', detalle: 'Ej: USB / español' },
  TONER: { descripcion: 'Ej: Tóner de impresora', marca: 'Ej: HP', modelo: 'Ej: 85A', serie: 'Opcional', detalleLabel: 'Detalle técnico', detalle: 'Ej: Negro / CE285A' },
  TINTA: { descripcion: 'Ej: Tinta de impresora', marca: 'Ej: Epson', modelo: 'Ej: T664', serie: 'Opcional', detalleLabel: 'Detalle técnico', detalle: 'Ej: Negro / CMYK' },
  CARTUCHO: { descripcion: 'Ej: Cartucho de impresora', marca: 'Ej: HP', modelo: 'Ej: 65XL', serie: 'Opcional', detalleLabel: 'Detalle técnico', detalle: 'Ej: Negro / Alto rendimiento' },
  AUDIFONOS: { descripcion: 'Ej: Audífonos', marca: 'Ej: Logitech', modelo: 'Ej: H390', serie: 'Opcional', detalleLabel: 'Detalle técnico', detalle: 'Ej: USB / diadema' },
  MOCHILA: { descripcion: 'Ej: Mochila', marca: 'Ej: Targus', modelo: 'Ej: TSB026', serie: 'Opcional', detalleLabel: 'Detalle técnico', detalle: 'Ej: 15.6 pulgadas' },
};

const defaultTypeConfig = { descripcion: 'Ej: descripción del componente', marca: 'Ej: Kingston', modelo: 'Ej: modelo', serie: 'Opcional', detalleLabel: 'Detalle técnico', detalle: 'Ej: especificación principal', ayuda: '' };
const initialForm = { IdTipodeComponente: '', DesComponente: '', Marca: '', Modelo: '', Serie: '', Capacidad: '', Obs: '' };

const formatCategoria = (cat) => ({ REPUESTO_TECNICO: 'Repuesto técnico', ACCESORIO: 'Accesorio' }[cat] || 'Sin categoría');
const CATEGORIA_OPTS = [
  { value: 'REPUESTO_TECNICO', label: 'Repuesto técnico' },
  { value: 'ACCESORIO', label: 'Accesorio' },
];

function CategoriaBadge({ categoria }) {
  const cat = String(categoria ?? '');
  const colors = {
    REPUESTO_TECNICO: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    ACCESORIO: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    CONSUMIBLE: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  };
  const label = { REPUESTO_TECNICO: 'Rep. Técnico', ACCESORIO: 'Accesorio', CONSUMIBLE: 'Consumible' };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${colors[cat] || 'bg-gray-50 text-gray-600 ring-gray-500/20'}`}>
      {label[cat] || cat || 'Otro'}
    </span>
  );
}

const CATEGORIA_TABS = [
  { value: '', label: 'TODOS' },
  { value: 'REPUESTO_TECNICO', label: 'Repuestos Técnicos' },
  { value: 'ACCESORIO', label: 'Accesorios' },
  { value: 'CONSUMIBLE', label: 'Consumibles' },
];

const ESTADO_FILTERS = [
  { value: '', label: 'TODOS' },
  { value: 'DISPONIBLE', label: 'Disponible' },
  { value: 'ASIGNADO', label: 'Asignado' },
  { value: 'BAJA', label: 'Baja' },
  { value: 'INACTIVO', label: 'Inactivo' },
];

function normalizeTypeName(value) {
  return (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
}

function buildAutoDescription(tipoNombre, marca, modelo, detalle) {
  return [tipoNombre, marca, modelo, detalle].map((v) => v?.trim()).filter(Boolean).join(' ');
}

function normalizarCategoria(cat) {
  const value = String(cat || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');
  if (value === 'REPUESTO_TECNICO') return 'REPUESTO_TECNICO';
  if (value === 'ACCESORIO') return 'ACCESORIO';
  if (value === 'CONSUMIBLE') return 'CONSUMIBLE';
  return value;
}

export default function Componentes() {
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showDetalle, setShowDetalle] = useState(false);
  const [bajaId, setBajaId] = useState(null);
  const [categoriaNuevo, setCategoriaNuevo] = useState('');
  const [form, setForm] = useState({ ...initialForm });
  const [compPlantilla, setCompPlantilla] = useState(null);
  const [compCaracVals, setCompCaracVals] = useState({});

  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value.toUpperCase() }));

  const handleTipoCompChange = (v) => {
    setForm((prev) => ({ ...prev, IdTipodeComponente: Number(v) }));
    setCompCaracVals({});
    if (!v) { setCompPlantilla(null); return; }
    api.componentes.plantillaByTipo(Number(v))
      .then(r => setCompPlantilla(r || []))
      .catch(() => setCompPlantilla(null));
  };
  const queryClient = useQueryClient();

  const params = { search };
  if (categoria) params.categoria = categoria;
  if (estadoFilter) params.estado = estadoFilter;

  const { data, isLoading } = useQuery({
    queryKey: ['componentes', params],
    queryFn: () => api.componentes.list(params),
  });

  const { data: tipos } = useQuery({
    queryKey: ['componentes-tipos'],
    queryFn: api.componentes.tipos.list,
  });

  const { data: detalle, isLoading: detalleLoading, error: detalleError } = useQuery({
    queryKey: ['componente-detalle', selectedId],
    queryFn: () => api.componentes.detalle(selectedId),
    enabled: !!selectedId && showDetalle,
  });

  const tiposFiltrados = useMemo(() => {
    if (!categoriaNuevo || !Array.isArray(tipos)) return [];
    const catActual = normalizarCategoria(categoriaNuevo);
    return tipos.filter((t) => normalizarCategoria(t.Categoria) === catActual);
  }, [categoriaNuevo, tipos]);

  const selectedTipo = tipos?.find((t) => String(t.IdTipodeComponente) === String(form.IdTipodeComponente)) || null;
  const selectedTypeName = normalizeTypeName(selectedTipo?.DesTipodeComponente || '');
  const typeConfig = componentTypeConfig[selectedTypeName] || defaultTypeConfig;
  const autoDescription = buildAutoDescription(selectedTipo?.DesTipodeComponente, form.Marca, form.Modelo, form.Capacidad);
  const categoriaLabel = categoriaNuevo ? formatCategoria(categoriaNuevo) : '';

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const resp = await api.componentes.createQuick(data);
      const id = resp.componente?.IdComponente || resp.IdComponente;
      const cam = compPlantilla || [];
      if (id && cam.length > 0) {
        const vals = Object.entries(compCaracVals)
          .filter(([_, v]) => v)
          .map(([idPlantilla, valor]) => ({ IdPlantilla: Number(idPlantilla), Valor: valor }));
        if (vals.length > 0) await api.componentes.saveCaracteristicas(id, vals);
      }
      return resp;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['componentes'] });
      setShowModal(false);
      setForm({ ...initialForm });
      setCategoriaNuevo('');
      setCompPlantilla(null);
      setCompCaracVals({});
    },
  });

  const bajaMutation = useMutation({
    mutationFn: api.componentes.baja,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['componentes'] });
      queryClient.invalidateQueries({ queryKey: ['componente-detalle'] });
      setBajaId(null);
      setShowDetalle(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      IdTipodeComponente: form.IdTipodeComponente,
      DesComponente: form.DesComponente?.trim() || undefined,
      Marca: form.Marca?.trim() || undefined,
      Modelo: form.Modelo?.trim() || undefined,
      Serie: form.Serie?.trim() || undefined,
      Capacidad: form.Capacidad?.trim() || undefined,
      Obs: form.Obs?.trim() || undefined,
    });
  };

  const handleRowClick = (row) => {
    setSelectedId(row.IdComponente);
    setShowDetalle(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Componentes / Accesorios" description="Gestión de repuestos y accesorios">
        <Button onClick={() => { setForm({ ...initialForm }); setCategoriaNuevo(''); setCompPlantilla(null); setCompCaracVals({}); setShowModal(true); }}>
          <Plus className="w-4 h-4" /> Nuevo Componente
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, descripción, marca, modelo o serie..."
            className="h-8 w-full rounded-lg border border-input bg-transparent pl-9 pr-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 placeholder:text-muted-foreground"
          />
        </div>
        <Select value={estadoFilter || 'Todos'} onValueChange={(v) => setEstadoFilter(v === 'Todos' ? '' : v)}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            {ESTADO_FILTERS.map((f) => <SelectItem key={f.value} value={f.value || 'Todos'}>{f.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-1 border-b border-border pb-1">
        {CATEGORIA_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setCategoria(tab.value)}
            className={`px-3 py-1.5 text-sm rounded-t-md transition-colors ${
              categoria === tab.value
                ? 'bg-primary text-primary-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={[
          { key: 'CodComponente', label: 'Código' },
          { key: 'DesComponente', label: 'Descripción' },
          { key: 'DesTipodeComponente', label: 'Tipo' },
          { key: 'Categoria', label: 'Categoría', render: (r) => <CategoriaBadge categoria={r.Categoria} /> },
          { key: 'Marca', label: 'Marca' },
          { key: 'Modelo', label: 'Modelo' },
          { key: 'Serie', label: 'Serie' },
          { key: 'Estado', label: 'Estado', render: (r) => <StatusBadge status={r.Estado} /> },
        ]}
        data={data}
        onRowClick={handleRowClick}
        searchable={false}
        loading={isLoading}
        emptyMessage="No se encontraron componentes"
      />

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nuevo Componente</DialogTitle>
            <DialogDescription>Registra un nuevo componente o accesorio en el inventario</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Categoría <span className="text-destructive">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setCategoriaNuevo('REPUESTO_TECNICO'); setForm((prev) => ({ ...prev, IdTipodeComponente: '' })); }}
                  className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                    categoriaNuevo === 'REPUESTO_TECNICO'
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-muted bg-background hover:border-blue-200'
                  }`}
                >
                  <div className={`rounded-lg p-2 ${categoriaNuevo === 'REPUESTO_TECNICO' ? 'bg-blue-100 text-blue-600' : 'bg-muted text-muted-foreground'}`}>
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Repuesto técnico</p>
                    <p className="text-xs text-muted-foreground">RAM, SSD, pantalla, batería</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => { setCategoriaNuevo('ACCESORIO'); setForm((prev) => ({ ...prev, IdTipodeComponente: '' })); }}
                  className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                    categoriaNuevo === 'ACCESORIO'
                      ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                      : 'border-muted bg-background hover:border-emerald-200'
                  }`}
                >
                  <div className={`rounded-lg p-2 ${categoriaNuevo === 'ACCESORIO' ? 'bg-emerald-100 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Accesorio</p>
                    <p className="text-xs text-muted-foreground">Cargador, mouse, mochila, teclado</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Tipo de componente <span className="text-destructive">*</span></label>
              <Select
                value={form.IdTipodeComponente ? String(form.IdTipodeComponente) : ''}
                onValueChange={handleTipoCompChange}
                disabled={!categoriaNuevo}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={categoriaNuevo ? 'Seleccionar tipo...' : 'Primero selecciona una categoría'}>
                    {selectedTipo?.DesTipodeComponente}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {tiposFiltrados.map((t) => (
                    <SelectItem key={t.IdTipodeComponente} value={String(t.IdTipodeComponente)}>{t.DesTipodeComponente}</SelectItem>
                  ))}
                  {tiposFiltrados.length === 0 && categoriaNuevo && (
                    <div className="px-2 py-4 text-xs text-muted-foreground text-center">No hay tipos disponibles para esta categoría</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-foreground mb-3">Detalles del componente</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Nombre / descripción</label>
                  <Input value={form.DesComponente} onChange={setField('DesComponente')} placeholder={typeConfig.descripcion} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">{typeConfig.detalleLabel}</label>
                  <Input value={form.Capacidad} onChange={setField('Capacidad')} placeholder={typeConfig.detalle} />
                  {autoDescription && <p className="text-xs text-muted-foreground">Vista previa: {autoDescription}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Marca</label>
                  <Input value={form.Marca} onChange={setField('Marca')} placeholder={typeConfig.marca} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Modelo</label>
                  <Input value={form.Modelo} onChange={setField('Modelo')} placeholder={typeConfig.modelo} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Serie</label>
                  <Input value={form.Serie} onChange={setField('Serie')} placeholder={typeConfig.serie} />
                </div>
              </div>
            </div>

            {compPlantilla && compPlantilla.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-foreground mb-3">Características técnicas</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {compPlantilla.map((c) => (
                    <div key={c.IdPlantilla} className="space-y-1">
                      <label className="text-sm font-medium text-foreground">
                        {c.Etiqueta || c.Clave}
                        {c.Requerido ? <span className="text-red-500 ml-0.5">*</span> : null}
                      </label>
                      <Input
                        placeholder={c.Etiqueta || c.Clave}
                        value={compCaracVals[c.IdPlantilla] || ''}
                        onChange={(e) => setCompCaracVals((prev) => ({ ...prev, [c.IdPlantilla]: e.target.value.toUpperCase() }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Observaciones</label>
              <textarea value={form.Obs} onChange={setField('Obs')}
                className="w-full min-h-[60px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 placeholder:text-muted-foreground"
                placeholder="Opcional" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending || !form.IdTipodeComponente}>
                {createMutation.isPending ? 'Guardando...' : 'Guardar Componente'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ComponenteDetalleDrawer
        open={showDetalle}
        onOpenChange={setShowDetalle}
        detalle={detalle}
        loading={detalleLoading}
        error={!!detalleError}
        onBaja={(id) => setBajaId(id)}
      />

      <AlertDialog open={!!bajaId} onOpenChange={(v) => { if (!v) setBajaId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dar de baja componente</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cambiará el estado del componente a BAJA. No podrá ser asignado ni editado luego de esto.
              ¿Estás seguro?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (bajaId) bajaMutation.mutate(bajaId); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {bajaMutation.isPending ? 'Procesando...' : 'Sí, dar de baja'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
