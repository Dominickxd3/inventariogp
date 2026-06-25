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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '#components/ui/dialog.jsx';
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

const columns = [
  { key: 'CodComponente', label: 'Código' },
  { key: 'DesComponente', label: 'Descripción' },
  { key: 'DesTipodeComponente', label: 'Tipo' },
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

export default function Componentes() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...initialForm });
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['componentes', search],
    queryFn: () => api.componentes.list({ search }),
  });

  const { data: tipos } = useQuery({
    queryKey: ['componentes-tipos'],
    queryFn: api.componentes.tipos.list,
  });

  const selectedTipo = tipos?.find((t) => String(t.IdTipodeComponente) === String(form.IdTipodeComponente));
  const selectedTypeName = normalizeTypeName(selectedTipo?.DesTipodeComponente);
  const typeConfig = componentTypeConfig[selectedTypeName] || defaultTypeConfig;
  const autoDescription = buildAutoDescription(
    selectedTipo?.DesTipodeComponente,
    form.Marca,
    form.Modelo,
    form.Capacidad
  );

  const createMutation = useMutation({
    mutationFn: api.componentes.createQuick,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['componentes'] });
      setShowModal(false);
      setForm({ ...initialForm });
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Componentes / Accesorios</h1>
        <Button onClick={() => { setForm({ ...initialForm }); setShowModal(true); }}>
          <Plus className="w-4 h-4" /> Nuevo Componente
        </Button>
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Buscar por código, descripción, marca, modelo o serie..."
      />

      <DataTable columns={columns} data={data} />

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nuevo Componente</DialogTitle>
            <DialogDescription>Registra un nuevo componente o accesorio en el inventario</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tipo de componente/accesorio <span className="text-destructive">*</span></label>
              <Select
                value={form.IdTipodeComponente ? String(form.IdTipodeComponente) : ''}
                onValueChange={(v) => setForm((prev) => ({ ...prev, IdTipodeComponente: Number(v) }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar tipo...">
                    {selectedTipo?.DesTipodeComponente}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {tipos?.map((t) => (
                    <SelectItem key={t.IdTipodeComponente} value={String(t.IdTipodeComponente)}>
                      {t.DesTipodeComponente}
                    </SelectItem>
                  ))}
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
    </div>
  );
}
