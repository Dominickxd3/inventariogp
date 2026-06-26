import { useState, useMemo } from 'react';
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '#components/ui/dialog.jsx';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '#components/ui/alert-dialog.jsx';
import ComponenteDetalleDrawer from '../components/componentes/ComponenteDetalleDrawer';
import { Plus } from 'lucide-react';

const componentTypeConfig = {
  'MEMORIA RAM': {
    descripcion: 'Ej: Memoria RAM DDR4',
    marca: 'Ej: Kingston',
    modelo: 'Ej: Fury Beast',
    serie: 'Opcional',
    detalleLabel: 'Detalle técnico',
    detalle: 'Ej: 16 GB DDR4 3200 MHz',
  },
  'DISCO SSD': {
    descripcion: 'Ej: Disco SSD',
    marca: 'Ej: Kingston',
    modelo: 'Ej: A400',
    serie: 'Opcional',
    detalleLabel: 'Detalle técnico',
    detalle: 'Ej: 512 GB SSD SATA / NVMe',
  },
  'DISCO DURO': {
    descripcion: 'Ej: Disco duro',
    marca: 'Ej: Seagate',
    modelo: 'Ej: Barracuda',
    serie: 'Opcional',
    detalleLabel: 'Detalle técnico',
    detalle: 'Ej: 1 TB HDD SATA',
  },
  CARGADOR: {
    descripcion: 'Ej: Cargador de laptop',
    marca: 'Ej: Lenovo',
    modelo: 'Ej: USB-C 65W',
    serie: 'Opcional',
    detalleLabel: 'Detalle técnico',
    detalle: 'Ej: 65W USB-C',
  },
  BATERIA: {
    descripcion: 'Ej: Batería de laptop',
    marca: 'Ej: Lenovo',
    modelo: 'Ej: L19M3PF1',
    serie: 'Opcional',
    detalleLabel: 'Detalle técnico',
    detalle: 'Ej: 45Wh / 3 celdas',
  },
  PANTALLA: {
    descripcion: 'Ej: Pantalla de laptop',
    marca: 'Ej: BOE',
    modelo: 'Ej: NV156FHM',
    serie: 'Opcional',
    detalleLabel: 'Detalle técnico',
    detalle: 'Ej: 15.6 pulgadas FHD',
  },
  'TARJETA DE VIDEO': {
    descripcion: 'Ej: Tarjeta de video',
    marca: 'Ej: NVIDIA',
    modelo: 'Ej: GTX 1650',
    serie: 'Opcional',
    detalleLabel: 'Detalle técnico',
    detalle: 'Ej: 4 GB GDDR6 / PCIe',
  },
  MOUSE: {
    descripcion: 'Ej: Mouse',
    marca: 'Ej: Logitech',
    modelo: 'Ej: M90',
    serie: 'Opcional',
    detalleLabel: 'Detalle técnico',
    detalle: 'Ej: USB / inalámbrico',
  },
  TECLADO: {
    descripcion: 'Ej: Teclado',
    marca: 'Ej: Logitech',
    modelo: 'Ej: K120',
    serie: 'Opcional',
    detalleLabel: 'Detalle técnico',
    detalle: 'Ej: USB / español',
  },
  TONER: {
    descripcion: 'Ej: Tóner de impresora',
    marca: 'Ej: HP',
    modelo: 'Ej: 85A',
    serie: 'Opcional',
    detalleLabel: 'Detalle técnico',
    detalle: 'Ej: Negro / CE285A',
  },
  TINTA: {
    descripcion: 'Ej: Tinta de impresora',
    marca: 'Ej: Epson',
    modelo: 'Ej: T664',
    serie: 'Opcional',
    detalleLabel: 'Detalle técnico',
    detalle: 'Ej: Negro / CMYK',
  },
  CARTUCHO: {
    descripcion: 'Ej: Cartucho de impresora',
    marca: 'Ej: HP',
    modelo: 'Ej: 65XL',
    serie: 'Opcional',
    detalleLabel: 'Detalle técnico',
    detalle: 'Ej: Negro / Alto rendimiento',
  },
  AUDIFONOS: {
    descripcion: 'Ej: Audífonos',
    marca: 'Ej: Logitech',
    modelo: 'Ej: H390',
    serie: 'Opcional',
    detalleLabel: 'Detalle técnico',
    detalle: 'Ej: USB / diadema',
  },
  MOCHILA: {
    descripcion: 'Ej: Mochila',
    marca: 'Ej: Targus',
    modelo: 'Ej: TSB026',
    serie: 'Opcional',
    detalleLabel: 'Detalle técnico',
    detalle: 'Ej: 15.6 pulgadas',
  },
};

const defaultTypeConfig = {
  descripcion: 'Ej: descripción del componente',
  marca: 'Ej: Kingston',
  modelo: 'Ej: modelo',
  serie: 'Opcional',
  detalleLabel: 'Detalle técnico',
  detalle: 'Ej: especificación principal',
  ayuda: '',
};

const initialForm = {
  IdTipodeComponente: '',
  DesComponente: '',
  Marca: '',
  Modelo: '',
  Serie: '',
  Capacidad: '',
  Lote: '',
  Obs: '',
};

const formatCategoria = (cat) => ({
  REPUESTO_TECNICO: 'Repuesto técnico',
  ACCESORIO: 'Accesorio',
}[cat] || 'Sin categoría');

const CATEGORIA_OPTS = [
  { value: 'REPUESTO_TECNICO', label: 'Repuesto técnico' },
  { value: 'ACCESORIO', label: 'Accesorio' },
];

function CategoriaBadge({ categoria }) {
  const cat = String(categoria ?? '');
  const colors = {
    REPUESTO_TECNICO: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    ACCESORIO: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    CONSUMIBLE: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  };
  const label = {
    REPUESTO_TECNICO: 'Rep. Técnico',
    ACCESORIO: 'Accesorio',
    CONSUMIBLE: 'Consumible',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[cat] || 'bg-gray-100 text-gray-800'}`}>
      {label[cat] || cat || 'Otro'}
    </span>
  );
}

const columns = [
  { key: 'CodComponente', label: 'Código' },
  { key: 'DesComponente', label: 'Descripción' },
  { key: 'DesTipodeComponente', label: 'Tipo' },
  { key: 'Categoria', label: 'Categoría', render: (r) => <CategoriaBadge categoria={r.Categoria} /> },
  { key: 'Marca', label: 'Marca' },
  { key: 'Modelo', label: 'Modelo' },
  { key: 'Serie', label: 'Serie' },
  { key: 'Estado', label: 'Estado', render: (r) => <EstadoBadge estado={r.Estado} /> },
];

function normalizeTypeName(value) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

function buildAutoDescription(tipoNombre, marca, modelo, detalle) {
  return [tipoNombre, marca, modelo, detalle]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ');
}

const CATEGORIA_TABS = [
  { value: '', label: 'Todo' },
  { value: 'REPUESTO_TECNICO', label: 'Repuestos Técnicos' },
  { value: 'ACCESORIO', label: 'Accesorios' },
  { value: 'CONSUMIBLE', label: 'Consumibles' },
];

const ESTADO_FILTERS = [
  { value: '', label: 'Todo' },
  { value: 'DISPONIBLE', label: 'Disponible' },
  { value: 'ASIGNADO', label: 'Asignado' },
  { value: 'BAJA', label: 'Baja' },
  { value: 'INACTIVO', label: 'Inactivo' },
];

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
  const queryClient = useQueryClient();

  const params = { search };
  if (categoria) params.categoria = categoria;
  if (estadoFilter) params.estado = estadoFilter;

  const { data } = useQuery({
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
    if (!categoriaNuevo || !tipos) return [];
    return tipos.filter((t) => {
      const cat = String(t.Categoria ?? '').trim().toUpperCase();
      return cat === categoriaNuevo;
    });
  }, [categoriaNuevo, tipos]);

  const selectedTipo = tipos?.find((t) => String(t.IdTipodeComponente) === String(form.IdTipodeComponente)) || null;
  const selectedTypeName = normalizeTypeName(selectedTipo?.DesTipodeComponente || '');
  const typeConfig = componentTypeConfig[selectedTypeName] || defaultTypeConfig;
  const autoDescription = buildAutoDescription(
    selectedTipo?.DesTipodeComponente,
    form.Marca,
    form.Modelo,
    form.Capacidad
  );

  const categoriaLabel = categoriaNuevo ? formatCategoria(categoriaNuevo) : '';

  const createMutation = useMutation({
    mutationFn: api.componentes.createQuick,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['componentes'] });
      setShowModal(false);
      setForm({ ...initialForm });
      setCategoriaNuevo('');
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
      DesComponente: form.DesComponente?.trim() || null,
      Marca: form.Marca?.trim() || null,
      Modelo: form.Modelo?.trim() || null,
      Serie: form.Serie?.trim() || null,
      Capacidad: form.Capacidad?.trim() || null,
      Lote: form.Lote?.trim() || null,
      Obs: form.Obs?.trim() || null,
    });
  };

  const handleRowClick = (row) => {
    setSelectedId(row.IdComponente);
    setShowDetalle(true);
  };

  const handleBaja = (id) => {
    setBajaId(id);
  };

  const handleBajaConfirm = () => {
    if (bajaId) bajaMutation.mutate(bajaId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Componentes / Accesorios</h1>
        <Button onClick={() => { setForm({ ...initialForm }); setCategoriaNuevo(''); setShowModal(true); }}>
          <Plus className="w-4 h-4" /> Nuevo Componente
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por código, descripción, marca, modelo o serie..."
          />
        </div>
        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {ESTADO_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
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
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={data} onRowClick={handleRowClick} />

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nuevo Componente</DialogTitle>
            <DialogDescription>Registra un nuevo componente o accesorio en el inventario</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Categoría <span className="text-destructive">*</span></label>
              <Select
                value={categoriaNuevo}
                onValueChange={(v) => {
                  setCategoriaNuevo(v);
                  setForm((prev) => ({ ...prev, IdTipodeComponente: '' }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar categoría">
                    {categoriaLabel || null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIA_OPTS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tipo de componente/accesorio <span className="text-destructive">*</span></label>
              <Select
                value={form.IdTipodeComponente ? String(form.IdTipodeComponente) : ''}
                onValueChange={(v) => setForm((prev) => ({ ...prev, IdTipodeComponente: Number(v) }))}
                disabled={!categoriaNuevo}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={categoriaNuevo ? 'Seleccionar tipo...' : 'Primero selecciona una categoría'}>
                    {selectedTipo?.DesTipodeComponente}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {tiposFiltrados.map((t) => (
                    <SelectItem key={t.IdTipodeComponente} value={String(t.IdTipodeComponente)}>
                      {t.DesTipodeComponente}
                    </SelectItem>
                  ))}
                  {tiposFiltrados.length === 0 && categoriaNuevo && (
                    <div className="px-2 py-4 text-xs text-muted-foreground text-center">
                      No hay tipos disponibles para {categoriaLabel.toLowerCase()}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nombre / descripción corta</label>
              <Input
                value={form.DesComponente}
                onChange={(e) => setForm({ ...form, DesComponente: e.target.value })}
                placeholder={typeConfig.descripcion}
              />
              <p className="text-xs text-muted-foreground">Se generará automáticamente si lo dejas vacío.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Marca</label>
                <Input
                  value={form.Marca}
                  onChange={(e) => setForm({ ...form, Marca: e.target.value })}
                  placeholder={typeConfig.marca}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Modelo</label>
                <Input
                  value={form.Modelo}
                  onChange={(e) => setForm({ ...form, Modelo: e.target.value })}
                  placeholder={typeConfig.modelo}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Serie</label>
                <Input
                  value={form.Serie}
                  onChange={(e) => setForm({ ...form, Serie: e.target.value })}
                  placeholder={typeConfig.serie}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{typeConfig.detalleLabel}</label>
                <Input
                  value={form.Capacidad}
                  onChange={(e) => setForm({ ...form, Capacidad: e.target.value })}
                  placeholder={typeConfig.detalle}
                />
                {typeConfig.ayuda ? (
                  <p className="text-xs text-muted-foreground">{typeConfig.ayuda}</p>
                ) : autoDescription ? (
                  <p className="text-xs text-muted-foreground">Vista previa automática: {autoDescription}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Lote</label>
                <Input
                  value={form.Lote}
                  onChange={(e) => setForm({ ...form, Lote: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Observaciones</label>
              <textarea
                value={form.Obs}
                onChange={(e) => setForm({ ...form, Obs: e.target.value })}
                className="w-full min-h-[72px] rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm"
                placeholder="Opcional"
              />
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
        onBaja={handleBaja}
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
            <AlertDialogAction onClick={handleBajaConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {bajaMutation.isPending ? 'Procesando...' : 'Sí, dar de baja'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
