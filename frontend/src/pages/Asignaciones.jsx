import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import Swal from 'sweetalert2';
import { EstadoBadge } from '../components/Badge';
import DataTable from '../components/DataTable';
import { Button } from '#components/ui/button.jsx';
import { Input } from '#components/ui/input.jsx';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '#components/ui/dialog.jsx';
import { Plus, XCircle, Check, Monitor } from 'lucide-react';
import { formatDate } from '../lib/utils';

const columns = [
  {
    key: 'TrabajadorNombre',
    label: 'Trabajador',
    render: (r) => r.TrabajadorNombre || `ID: ${r.IdReferente}`,
  },
  { key: 'CodEquipo', label: 'Equipo' },
  { key: 'DesTipodeEquipo', label: 'Tipo' },
  { key: 'FecAsignacion', label: 'Desde', render: (r) => formatDate(r.FecAsignacion) },
  {
    key: 'Estado',
    label: 'Estado',
    render: (r) => <EstadoBadge estado={r.Estado} />,
  },
];

export default function Asignaciones() {
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: asignaciones, isLoading } = useQuery({
    queryKey: ['asignaciones'],
    queryFn: () => api.asignaciones.list({ estado: 'VIGENTE' }),
  });

  const cesarMutation = useMutation({
    mutationFn: api.asignaciones.cesar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asignaciones'] });
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      queryClient.invalidateQueries({ queryKey: ['equipos-dashboard'] });
      setShowCesarDialog(false);
      setCesarTarget(null);
      Swal.fire({ icon: 'success', title: 'Asignación finalizada', text: 'El equipo fue desasignado correctamente', timer: 2000, showConfirmButton: false });
    },
    onError: (err) => {
      Swal.fire({ icon: 'error', title: 'Error al cesar', text: err.message });
    },
  });

  const [showCesarDialog, setShowCesarDialog] = useState(false);
  const [cesarTarget, setCesarTarget] = useState(null);

  const confirmCesar = (row) => {
    setCesarTarget(row);
    setShowCesarDialog(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Asignaciones</h1>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Nueva Asignación
        </Button>
      </div>

      <DataTable
        columns={[
          ...columns,
          {
            key: 'acciones',
            label: 'Acciones',
            sortable: false,
            render: (row) => (
              row.Estado === 'VIGENTE' && (
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); confirmCesar(row); }}>
                  <XCircle className="w-3 h-3" /> Cesar
                </Button>
              )
            ),
          },
        ]}
        data={asignaciones}
      />

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva Asignación</DialogTitle>
            <DialogDescription>Selecciona trabajador y equipos para asignar</DialogDescription>
          </DialogHeader>
          <AsignarForm onSuccess={() => { setShowModal(false); queryClient.invalidateQueries({ queryKey: ['asignaciones'] }); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={showCesarDialog} onOpenChange={(v) => { setShowCesarDialog(v); if (!v) setCesarTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cesar asignación</DialogTitle>
            <DialogDescription>
              ¿Finalizar asignación de <strong>{cesarTarget?.CodEquipo}</strong> a {cesarTarget?.TrabajadorNombre}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCesarDialog(false); setCesarTarget(null); }}>Cancelar</Button>
            <Button variant="destructive" onClick={() => cesarMutation.mutate(cesarTarget.IdMovEquipoAsignacion)} disabled={cesarMutation.isPending}>
              {cesarMutation.isPending ? 'Cesando...' : 'Cesar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AsignarForm({ onSuccess }) {
  const [step, setStep] = useState(1);
  const [searchTrab, setSearchTrab] = useState('');
  const [searchEquipo, setSearchEquipo] = useState('');
  const [selectedTrab, setSelectedTrab] = useState(null);
  const [selectedEquipos, setSelectedEquipos] = useState([]);
  const [obs, setObs] = useState('');

  const { data: trabajadores } = useQuery({
    queryKey: ['trabajadores-search', searchTrab],
    queryFn: () => api.trabajadores.search({ search: searchTrab }),
    enabled: searchTrab.length > 2,
  });

  const { data: equipos } = useQuery({
    queryKey: ['equipos-disponibles', searchEquipo],
    queryFn: () => api.equipos.list({ estado: 'DISPONIBLE', search: searchEquipo }),
  });

  const asignarMutation = useMutation({
    mutationFn: api.asignaciones.createBulk,
    onSuccess: () => {
      onSuccess();
      Swal.fire({ icon: 'success', title: 'Equipos asignados', text: `${selectedEquipos.length} equipo(s) asignado(s) correctamente`, timer: 2000, showConfirmButton: false });
    },
    onError: (err) => {
      Swal.fire({ icon: 'error', title: 'Error al asignar', text: err.message });
    },
  });

  const toggleEquipo = (eq) => {
    setSelectedEquipos((prev) =>
      prev.some((e) => e.IdMaeEquipo === eq.IdMaeEquipo)
        ? prev.filter((e) => e.IdMaeEquipo !== eq.IdMaeEquipo)
        : [...prev, eq]
    );
  };

  const handleAsignar = () => {
    if (!selectedTrab || selectedEquipos.length === 0) return;
    asignarMutation.mutate({
      IdMaeEquipos: selectedEquipos.map((e) => e.IdMaeEquipo),
      IdReferente: selectedTrab.IdTrabajador,
      Obs: obs,
    });
  };

  const totalEquipos = selectedEquipos.reduce((acc, e) => {
    const tipo = e.DesTipodeEquipo || 'OTRO';
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`flex-1 h-2 rounded-full ${step >= s ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <h3 className="font-medium">Seleccionar Trabajador</h3>
          <Input value={searchTrab} onChange={(e) => setSearchTrab(e.target.value)} placeholder="Buscar por DNI o nombre..." />
          <div className="max-h-60 overflow-y-auto space-y-1">
            {trabajadores?.rows?.map((t) => (
              <div key={t.IdTrabajador} onClick={() => { setSelectedTrab(t); setStep(2); }}
                className={`p-3 rounded-lg cursor-pointer text-sm ${selectedTrab?.IdTrabajador === t.IdTrabajador ? 'bg-accent border border-border' : 'hover:bg-muted border border-transparent'}`}
              >
                <p className="font-medium">{t.Trabajador}</p>
                <p className="text-muted-foreground text-xs">{t.DOI} - {t.Ocupacion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Seleccionar Equipos</h3>
            {selectedEquipos.length > 0 && (
              <span className="text-xs text-muted-foreground">{selectedEquipos.length} seleccionados</span>
            )}
          </div>
          <Input value={searchEquipo} onChange={(e) => setSearchEquipo(e.target.value)} placeholder="Buscar equipo..." />
          <div className="max-h-60 overflow-y-auto space-y-1">
            {equipos?.rows?.map((e) => {
              const selected = selectedEquipos.some((s) => s.IdMaeEquipo === e.IdMaeEquipo);
              return (
                <div key={e.IdMaeEquipo} onClick={() => toggleEquipo(e)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer text-sm ${selected ? 'bg-accent border border-border' : 'hover:bg-muted border border-transparent'}`}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${selected ? 'bg-primary border-primary text-primary-foreground' : 'border-input'}`}>
                    {selected && <Check className="w-3 h-3" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{e.CodEquipo} - {e.DesTipodeEquipo}</p>
                    <p className="text-muted-foreground text-xs">{e.CodBarra || 'Sin código de barra'}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>Atrás</Button>
            <Button onClick={() => setStep(3)} disabled={selectedEquipos.length === 0}>
              Continuar ({selectedEquipos.length} equipos)
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <h3 className="font-medium">Confirmar Asignación</h3>
          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <p><strong>Trabajador:</strong> {selectedTrab?.Trabajador}</p>
            <p><strong>Total equipos:</strong> {selectedEquipos.length}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(totalEquipos).map(([tipo, count]) => (
                <span key={tipo} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
                  <Monitor className="w-3 h-3" /> {tipo}: {count}
                </span>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Observaciones</label>
            <textarea value={obs} onChange={(e) => setObs(e.target.value)} className="w-full min-h-[60px] rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm" rows={2} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>Atrás</Button>
            <Button onClick={handleAsignar} disabled={asignarMutation.isPending}>
              {asignarMutation.isPending ? 'Asignando...' : `Asignar (${selectedEquipos.length} equipos)`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
