import { useState } from 'react';
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
import { Plus, CheckCircle, Search } from 'lucide-react';
import { formatDate } from '../lib/utils';
import Swal from 'sweetalert2';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const incidenciaSchema = z.object({
  TipoIncidencia: z.string().min(1, 'Selecciona un tipo'),
  Descripcion: z.string().min(1, 'La descripción es obligatoria'),
  FecIncidencia: z.string().optional(),
});

const tipoStyles = {
  ROBO: 'bg-red-50 text-red-700 ring-red-600/20',
  PERDIDA: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  DAÑO: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  DEVOLUCION: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
};

function TipoBadge({ tipo }) {
  const style = tipoStyles[tipo] || 'bg-gray-50 text-gray-600 ring-gray-500/20';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}>
      {tipo}
    </span>
  );
}

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidencias'] });
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      queryClient.invalidateQueries({ queryKey: ['equipos-dashboard'] });
      Swal.fire({ icon: 'success', title: 'Incidencia cerrada', timer: 1500, showConfirmButton: false });
    },
  });

  const confirmCerrar = (row) => {
    Swal.fire({
      title: '¿Cerrar incidencia?',
      text: `Se cerrará la incidencia de tipo ${row.TipoIncidencia} para el equipo ${row.CodEquipo}.`,
      icon: 'question', showCancelButton: true, confirmButtonText: 'Cerrar', cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981',
    }).then((r) => { if (r.isConfirmed) cerrarMutation.mutate(row.IdIncidencia); });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Incidencias" description="Registro de incidentes de equipos">
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Nueva Incidencia
        </Button>
      </PageHeader>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por equipo, descripción o trabajador..."
          className="h-8 w-full rounded-lg border border-input bg-transparent pl-9 pr-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 placeholder:text-muted-foreground"
        />
      </div>

      <DataTable
        columns={[
          { key: 'CodEquipo', label: 'Equipo' },
          { key: 'DesTipodeEquipo', label: 'Tipo' },
          { key: 'Trabajador', label: 'Trabajador', render: (r) => r.Trabajador || '-' },
          { key: 'TipoIncidencia', label: 'Tipo', render: (r) => <TipoBadge tipo={r.TipoIncidencia} /> },
          { key: 'FecIncidencia', label: 'Fecha', render: (r) => formatDate(r.FecIncidencia) },
          { key: 'Estado', label: 'Estado', render: (r) => <StatusBadge status={r.Estado} /> },
          {
            key: 'acciones',
            label: '',
            sortable: false,
            render: (row) => (
              row.Estado === 'ABIERTO' && (
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); confirmCerrar(row); }}>
                  <CheckCircle className="w-3.5 h-3.5" /> Cerrar
                </Button>
              )
            ),
          },
        ]}
        data={data}
        searchable={false}
        loading={isLoading}
        emptyMessage="No hay incidencias registradas"
      />

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Incidencia</DialogTitle>
            <DialogDescription>Registra un daño, robo, pérdida o devolución de equipo</DialogDescription>
          </DialogHeader>
          <IncidenciaForm onSuccess={() => { setShowModal(false); queryClient.invalidateQueries({ queryKey: ['incidencias'] }); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IncidenciaForm({ onSuccess }) {
  const [searchEquipo, setSearchEquipo] = useState('');
  const [selectedEquipo, setSelectedEquipo] = useState(null);

  const form = useForm({
    resolver: zodResolver(incidenciaSchema),
    defaultValues: { TipoIncidencia: 'DAÑO', Descripcion: '', FecIncidencia: new Date().toISOString().split('T')[0] },
  });

  const { data: equipos } = useQuery({
    queryKey: ['equipos-search-incidencia', searchEquipo],
    queryFn: () => api.equipos.list({ search: searchEquipo }),
    enabled: searchEquipo.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: api.incidencias.create,
    onSuccess,
    onError: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.message }),
  });

  const equiposList = equipos?.rows || equipos || [];

  return (
    <form onSubmit={form.handleSubmit((data) => {
      if (!selectedEquipo) {
        Swal.fire({ icon: 'warning', title: 'Selecciona un equipo' });
        return;
      }
      createMutation.mutate({
        IdMaeEquipo: selectedEquipo.IdMaeEquipo,
        ...data,
      });
    })} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Equipo <span className="text-destructive">*</span></label>
        <Input
          value={searchEquipo}
          onChange={(e) => { setSearchEquipo(e.target.value); if (!e.target.value) setSelectedEquipo(null); }}
          placeholder="Buscar equipo por código o nombre..."
        />
        {equiposList.length > 0 && (
          <div className="mt-1 max-h-40 overflow-y-auto border border-border rounded-lg divide-y divide-border">
            {equiposList.map((e) => (
              <div
                key={e.IdMaeEquipo}
                onClick={() => { setSelectedEquipo(e); setSearchEquipo(`${e.CodEquipo} - ${e.DesTipodeEquipo}`); }}
                className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                  selectedEquipo?.IdMaeEquipo === e.IdMaeEquipo
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-accent'
                }`}
              >
                {e.CodEquipo} — {e.DesTipodeEquipo}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Tipo de Incidencia</label>
          <Select value={form.watch('TipoIncidencia')} onValueChange={(v) => form.setValue('TipoIncidencia', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="DAÑO">Daño</SelectItem>
              <SelectItem value="ROBO">Robo</SelectItem>
              <SelectItem value="PERDIDA">Pérdida</SelectItem>
              <SelectItem value="DEVOLUCION">Devolución</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Fecha</label>
          <Input type="date" {...form.register('FecIncidencia')} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Descripción <span className="text-destructive">*</span></label>
        <textarea
          {...form.register('Descripcion')}
          className="w-full min-h-[80px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 placeholder:text-muted-foreground"
          placeholder="Describe la incidencia..."
        />
        {form.formState.errors.Descripcion && (
          <p className="text-xs text-destructive">{form.formState.errors.Descripcion.message}</p>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onSuccess?.()}>Cancelar</Button>
        <Button type="submit" variant="destructive" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Registrando...' : 'Registrar Incidencia'}
        </Button>
      </DialogFooter>
    </form>
  );
}
