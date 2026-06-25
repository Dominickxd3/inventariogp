import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { EstadoBadge, IncidenciaBadge } from '../components/Badge';
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
import { Plus, CheckCircle } from 'lucide-react';
import { formatDate } from '../lib/utils';
import Swal from 'sweetalert2';

const columns = [
  { key: 'CodEquipo', label: 'Equipo' },
  { key: 'DesTipodeEquipo', label: 'Tipo' },
  { key: 'Trabajador', label: 'Trabajador', render: (r) => r.Trabajador || '-' },
  {
    key: 'TipoIncidencia',
    label: 'Tipo',
    render: (r) => <IncidenciaBadge tipo={r.TipoIncidencia} />,
  },
  { key: 'FecIncidencia', label: 'Fecha', render: (r) => formatDate(r.FecIncidencia) },
  {
    key: 'Estado',
    label: 'Estado',
    render: (r) => <EstadoBadge estado={r.Estado} />,
  },
];

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
    },
  });

  const confirmCerrar = (row) => {
    Swal.fire({
      title: '¿Cerrar incidencia?',
      text: `Se cerrará la incidencia de tipo ${row.TipoIncidencia} para el equipo ${row.CodEquipo}.`,
      icon: 'question', showCancelButton: true, confirmButtonText: 'Cerrar', cancelButtonText: 'Cancelar',
    }).then((r) => { if (r.isConfirmed) cerrarMutation.mutate(row.IdIncidencia); });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Incidencias</h1>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Nueva Incidencia
        </Button>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Buscar por equipo, descripción o trabajador..." />

      <DataTable
        columns={[
          ...columns,
          {
            key: 'acciones',
            label: 'Acciones',
            sortable: false,
            render: (row) => (
              row.Estado === 'ABIERTO' && (
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); confirmCerrar(row); }}>
                  <CheckCircle className="w-3 h-3" /> Cerrar
                </Button>
              )
            ),
          },
        ]}
        data={data}
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
  const [form, setForm] = useState({ TipoIncidencia: 'DAÑO', Descripcion: '', FecIncidencia: new Date().toISOString().split('T')[0] });

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedEquipo) {
      Swal.fire({ icon: 'warning', title: 'Selecciona un equipo' });
      return;
    }
    if (!form.Descripcion.trim()) {
      Swal.fire({ icon: 'warning', title: 'La descripción es obligatoria' });
      return;
    }
    createMutation.mutate({
      IdMaeEquipo: selectedEquipo.IdMaeEquipo,
      ...form,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Equipo <span className="text-destructive">*</span></label>
        <Input value={searchEquipo} onChange={(e) => setSearchEquipo(e.target.value)}
          placeholder="Buscar equipo por código o nombre..." />
        {equiposList.length > 0 && (
          <div className="mt-1 max-h-40 overflow-y-auto border rounded-lg">
            {equiposList.map((e) => (
              <div key={e.IdMaeEquipo} onClick={() => { setSelectedEquipo(e); setSearchEquipo(`${e.CodEquipo} - ${e.DesTipodeEquipo}`); }}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-muted ${selectedEquipo?.IdMaeEquipo === e.IdMaeEquipo ? 'bg-accent font-medium' : ''}`}>
                {e.CodEquipo} - {e.DesTipodeEquipo}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Tipo de Incidencia</label>
          <Select value={form.TipoIncidencia} onValueChange={(v) => setForm({ ...form, TipoIncidencia: v })}>
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
          <label className="text-sm font-medium">Fecha</label>
          <Input type="date" value={form.FecIncidencia} onChange={(e) => setForm({ ...form, FecIncidencia: e.target.value })} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Descripción <span className="text-destructive">*</span></label>
        <textarea value={form.Descripcion} onChange={(e) => setForm({ ...form, Descripcion: e.target.value })}
          className="w-full min-h-[80px] rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm" required />
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
