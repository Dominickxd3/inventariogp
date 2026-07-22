import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '#components/ui/select.jsx';
import { Plus, XCircle, Check, Printer } from 'lucide-react';
import { formatDate } from '../lib/utils';
import AsignacionDetalleDrawer from '../components/asignaciones/AsignacionDetalleDrawer';
import CesarAsignacionDialog from '../components/asignaciones/CesarAsignacionDialog';

const TABS = [
  { key: 'VIGENTE', label: 'Vigentes' },
  { key: 'CESADO', label: 'Cesadas' },
  { key: '', label: 'Todas' },
];

const PAGE_SIZE = 20;

const columns = [
  {
    key: 'TrabajadorNombre',
    label: 'Trabajador',
    render: (r) => (
      <div>
        <p className="font-medium">{r.TrabajadorNombre || 'Trabajador no encontrado'}</p>
        {r.TrabajadorNombre && r.DOI ? (
          <p className="text-xs text-muted-foreground">{r.DOI}{r.Area ? ` - ${r.Area}` : ''}</p>
        ) : (
          <p className="text-xs text-muted-foreground">ID: {r.IdReferente}</p>
        )}
      </div>
    ),
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
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [searchParams] = useSearchParams();
  const nuevoEquipoId = searchParams.get('nuevoEquipo');
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('VIGENTE');
  const [page, setPage] = useState(1);

  const [selectedAsignacionId, setSelectedAsignacionId] = useState(null);
  const [detalleOpen, setDetalleOpen] = useState(false);

  useEffect(() => {
    if (nuevoEquipoId) setShowModal(true);
  }, [nuevoEquipoId]);

  const queryParams = { page, pageSize: PAGE_SIZE };
  if (tab) queryParams.estado = tab;

  const { data: asignaciones, isLoading } = useQuery({
    queryKey: ['asignaciones', tab, page],
    queryFn: () => api.asignaciones.list(queryParams),
  });

  useEffect(() => { setPage(1); }, [tab]);

  const detalleQuery = useQuery({
    queryKey: ['asignacion-detalle', selectedAsignacionId],
    queryFn: () => api.asignaciones.detalle(selectedAsignacionId),
    enabled: detalleOpen && !!selectedAsignacionId,
  });

  const [showCesarDialog, setShowCesarDialog] = useState(false);
  const [cesarTarget, setCesarTarget] = useState(null);

  const abrirActa = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/asignaciones/${id}/acta`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al generar acta');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo abrir el acta.' });
      console.error('Error al abrir acta:', e);
    }
  };

  const handleRowClick = (row) => {
    setSelectedAsignacionId(row.IdMovEquipoAsignacion);
    setDetalleOpen(true);
  };

  const handleCesarFromDrawer = (id, equipo, trabajador) => {
    setCesarTarget({
      IdMovEquipoAsignacion: id,
      IdMaeEquipo: equipo.IdMaeEquipo,
      CodEquipo: equipo.CodEquipo,
      TrabajadorNombre: trabajador?.NombreTrabajador,
    });
    setShowCesarDialog(true);
  };

  const rows = asignaciones?.rows || [];
  const totalPages = asignaciones?.totalPages || 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Asignaciones</h1>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Nueva Asignación
        </Button>
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ${
              tab === t.key
                ? 'bg-background border border-b-0 border-border text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={[
          ...columns,
          {
            key: 'acciones',
            label: 'Acciones',
            sortable: false,
            render: (row) => (
              <div className="flex gap-1">
                {row.Estado === 'VIGENTE' && (
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setCesarTarget(row); setShowCesarDialog(true); }}>
                    <XCircle className="w-3 h-3" /> Cesar
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); abrirActa(row.IdMovEquipoAsignacion); }}>
                  <Printer className="w-3 h-3" /> Acta
                </Button>
              </div>
            ),
          },
        ]}
        data={rows}
        onRowClick={handleRowClick}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Anterior
          </Button>
          <span className="text-xs text-muted-foreground">
            Página {page} de {totalPages} ({asignaciones?.total || 0} registros)
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Siguiente
          </Button>
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva Asignación</DialogTitle>
            <DialogDescription>Selecciona trabajador y equipos para asignar</DialogDescription>
          </DialogHeader>
          <AsignarForm equipoInicial={nuevoEquipoId} onSuccess={() => { setShowModal(false); queryClient.invalidateQueries({ queryKey: ['asignaciones'] }); }} />
        </DialogContent>
      </Dialog>

      <AsignacionDetalleDrawer
        open={detalleOpen}
        onOpenChange={(v) => { setDetalleOpen(v); if (!v) { setSelectedAsignacionId(null); } }}
        detalle={detalleQuery.data}
        loading={detalleQuery.isLoading}
        error={detalleQuery.error}
        onVerActa={abrirActa}
        onCesar={handleCesarFromDrawer}
        navigate={navigate}
      />

      <CesarAsignacionDialog
        open={showCesarDialog}
        onOpenChange={(v) => { setShowCesarDialog(v); if (!v) setCesarTarget(null); }}
        cesarTarget={cesarTarget}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['asignaciones'] });
          queryClient.invalidateQueries({ queryKey: ['equipos'] });
          queryClient.invalidateQueries({ queryKey: ['equipos-dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['asignacion-detalle'] });
        }}
      />
    </div>
  );
}

function AsignarForm({ onSuccess, equipoInicial }) {
  const [step, setStep] = useState(1);
  const [searchTrab, setSearchTrab] = useState('');
  const [searchEquipo, setSearchEquipo] = useState('');
  const [selectedTrab, setSelectedTrab] = useState(null);
  const [selectedEquipos, setSelectedEquipos] = useState([]);
  const [selectedAcc, setSelectedAcc] = useState([]);
  const [searchAcc, setSearchAcc] = useState('');
  const [obs, setObs] = useState('');

  const { data: trabajadores } = useQuery({
    queryKey: ['trabajadores-search', searchTrab],
    queryFn: () => api.trabajadores.search({ search: searchTrab }),
    enabled: true,
  });

  const { data: equipos } = useQuery({
    queryKey: ['equipos-disponibles', searchEquipo],
    queryFn: () => api.equipos.list({ estado: 'DISPONIBLE', search: searchEquipo }),
  });

  const { data: equipoInicialData } = useQuery({
    queryKey: ['equipo-inicial', equipoInicial],
    queryFn: () => api.equipos.get(equipoInicial),
    enabled: !!equipoInicial,
  });

  const { data: accDisponibles } = useQuery({
    queryKey: ['accesorios-disponibles-asig', searchAcc],
    queryFn: api.componentes.accesoriosDisponibles,
    enabled: step === 3,
  });

  useEffect(() => {
    if (equipoInicialData) {
      setSelectedEquipos([equipoInicialData]);
    }
  }, [equipoInicialData]);

  const totalSteps = 4;

  const asignarMutation = useMutation({
    mutationFn: api.asignaciones.createBulk,
    onSuccess: () => {
      onSuccess();
      Swal.fire({ icon: 'success', title: 'Equipos asignados', text: `${selectedEquipos.length} equipo(s) asignado(s) correctamente`, timer: 2000, showConfirmButton: false });
    },
    onError: (err) => {
      console.error('Error al asignar:', err);
      Swal.fire({ icon: 'error', title: 'Error al asignar', text: 'No se pudo crear la asignación. Verifica los datos e intenta nuevamente.' });
    },
  });

  const asignarConAccMutation = useMutation({
    mutationFn: api.asignaciones.createConAccesorios,
    onSuccess: (resp) => {
      onSuccess();
      Swal.fire({ icon: 'success', title: 'Asignación completada', text: `Equipo y ${resp.accesorios} accesorio(s) asignados`, timer: 2000, showConfirmButton: false });
    },
    onError: (err) => {
      console.error('Error al asignar con accesorios:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo crear la asignación. Verifica los datos e intenta nuevamente.' });
    },
  });

  const toggleEquipo = (eq) => {
    setSelectedEquipos((prev) =>
      prev.some((e) => e.IdMaeEquipo === eq.IdMaeEquipo)
        ? prev.filter((e) => e.IdMaeEquipo !== eq.IdMaeEquipo)
        : [...prev, eq]
    );
  };

  const toggleAcc = (c) => {
    setSelectedAcc((prev) =>
      prev.some((a) => a.IdComponente === c.IdComponente)
        ? prev.filter((a) => a.IdComponente !== c.IdComponente)
        : [...prev, c]
    );
  };

  const handleAsignar = () => {
    if (!selectedTrab || selectedEquipos.length === 0) return;

    if (selectedEquipos.length === 1 && selectedAcc.length > 0) {
      const eq = selectedEquipos[0];
      asignarConAccMutation.mutate({
        IdMaeEquipo: eq.IdMaeEquipo,
        IdReferente: selectedTrab.IdTrabajador,
        Obs: obs || null,
        Accesorios: selectedAcc.map((a) => ({ IdComponente: a.IdComponente, Obs: null })),
      });
    } else {
      asignarMutation.mutate({
        IdMaeEquipos: selectedEquipos.map((e) => e.IdMaeEquipo),
        IdReferente: selectedTrab.IdTrabajador,
        Obs: obs,
      });
    }
  };

  const totalEquipos = selectedEquipos.reduce((acc, e) => {
    const tipo = e.DesTipodeEquipo || 'OTRO';
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        {Array.from({ length: totalSteps }).map((_, s) => (
          <div key={s} className={`flex-1 h-2 rounded-full ${step >= s + 1 ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <h3 className="font-medium">Seleccionar Trabajador</h3>
          <Input value={searchTrab} onChange={(e) => setSearchTrab(e.target.value)} placeholder="Buscar por DNI o nombre..." />
          <div className="max-h-60 overflow-y-auto space-y-1">
            {trabajadores?.rows?.map((t) => (
              <div key={t.IdTrabajador} onClick={() => { setSelectedTrab(t); setStep(2); }}
                className={`p-3 rounded-lg cursor-pointer text-sm ${selectedTrab?.IdTrabajador === t.IdTrabajador ? 'bg-accent border border-border' : 'hover:bg-muted border border-transparent'}`}>
                <p className="font-medium">{t.Trabajador}</p>
                <p className="text-muted-foreground text-xs">{t.DOI} - {t.Ocupacion}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => { onSuccess(); setStep(1); setSearchTrab(''); setSelectedTrab(null); }}>Cancelar</Button>
            <Button onClick={() => setStep(2)} disabled={!selectedTrab}>Siguiente</Button>
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
          {!equipoInicial ? (
            <>
              <Input value={searchEquipo} onChange={(e) => setSearchEquipo(e.target.value)} placeholder="Buscar equipo..." />
              <div className="max-h-60 overflow-y-auto space-y-1">
                {equipos?.rows?.map((e) => {
                  const selected = selectedEquipos.some((s) => s.IdMaeEquipo === e.IdMaeEquipo);
                  return (
                    <div key={e.IdMaeEquipo} onClick={() => toggleEquipo(e)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer text-sm ${selected ? 'bg-accent border border-border' : 'hover:bg-muted border border-transparent'}`}>
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
            </>
          ) : (
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-medium">{selectedEquipos[0]?.CodEquipo} - {selectedEquipos[0]?.DesTipodeEquipo}</p>
              <p className="text-xs text-muted-foreground">{selectedEquipos[0]?.CodBarra || 'Sin código de barra'}</p>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>Atrás</Button>
            <Button onClick={() => setStep(selectedEquipos.length === 1 ? 3 : 4)} disabled={selectedEquipos.length === 0}>
              Continuar
            </Button>
          </div>
        </div>
      )}

      {step === 3 && selectedEquipos.length === 1 && (
        <div className="space-y-3">
          <h3 className="font-medium">Accesorios entregados al trabajador</h3>
          <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
            Solo aparecen accesorios externos como cargadores, mouse, teclado, cables o adaptadores.
            Los repuestos técnicos como RAM, SSD, discos o baterías se instalan desde el detalle del equipo o una intervención técnica.
          </p>
          <Input value={searchAcc} onChange={(e) => setSearchAcc(e.target.value)} placeholder="Buscar accesorio..." />
          <div className="max-h-48 overflow-y-auto space-y-1">
            {accDisponibles?.map((c) => {
              const selected = selectedAcc.some((a) => a.IdComponente === c.IdComponente);
              return (
                <div key={c.IdComponente} onClick={() => toggleAcc(c)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer text-sm ${selected ? 'bg-accent border border-border' : 'hover:bg-muted border border-transparent'}`}>
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${selected ? 'bg-primary border-primary text-primary-foreground' : 'border-input'}`}>
                    {selected && <Check className="w-3 h-3" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{c.CodComponente} - {c.DesComponente || 'Sin descripción'}</p>
                    <p className="text-xs text-muted-foreground">{c.DesTipodeComponente}{c.Marca ? ` / ${c.Marca}` : ''}</p>
                  </div>
                </div>
              );
            })}
            {(!accDisponibles || accDisponibles.length === 0) && (
              <p className="text-xs text-muted-foreground text-center py-2">No hay accesorios externos disponibles</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>Atrás</Button>
            <Button onClick={() => setStep(4)}>
              Continuar ({selectedAcc.length} accesorios)
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <h3 className="font-medium">Confirmar Asignación</h3>
          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <p className="font-semibold text-base border-b border-border pb-2 mb-2">Trabajador</p>
            <p><strong>Nombre:</strong> {selectedTrab?.Trabajador}</p>
            <p><strong>DNI:</strong> {selectedTrab?.DOI || '—'}</p>
            <p><strong>Área:</strong> {selectedTrab?.Area || '—'}</p>
            <p><strong>Cargo:</strong> {selectedTrab?.Ocupacion || '—'}</p>

            <p className="font-semibold text-base border-b border-border pb-2 mt-3 mb-2">Equipos asignados ({selectedEquipos.length})</p>
            <div className="space-y-1">
              {selectedEquipos.map((eq) => (
                <p key={eq.IdMaeEquipo} className="text-xs">
                  {eq.CodEquipo} — {eq.DesTipodeEquipo}{eq.Marca ? ` / ${eq.Marca}` : ''}
                </p>
              ))}
            </div>

            {selectedAcc.length > 0 && (
              <>
                <p className="font-semibold text-base border-b border-border pb-2 mt-3 mb-2">
                  Accesorios entregados ({selectedAcc.length})
                </p>
                <div className="space-y-1">
                  {selectedAcc.map((a) => (
                    <p key={a.IdComponente} className="text-xs">
                      {a.CodComponente} — {a.DesComponente || a.DesTipodeComponente}
                    </p>
                  ))}
                </div>
              </>
            )}

            <div className="mt-3 pt-2 border-t border-border bg-amber-50 dark:bg-amber-950/20 p-2 rounded text-xs text-muted-foreground">
              Los equipos pasarán a estado <strong>ASIGNADO</strong>.
              Los accesorios seleccionados quedarán asignados al trabajador y vinculados a esta entrega.
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Observaciones generales</label>
            <textarea value={obs} onChange={(e) => setObs(e.target.value)} className="w-full min-h-[60px] rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm" rows={2} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(selectedEquipos.length === 1 && selectedAcc.length > 0 ? 3 : 2)}>Atrás</Button>
            <Button onClick={handleAsignar} disabled={asignarMutation.isPending || asignarConAccMutation.isPending}>
              {asignarMutation.isPending || asignarConAccMutation.isPending ? 'Asignando...' : `Asignar${selectedAcc.length > 0 ? ` (${selectedEquipos.length} equipo + ${selectedAcc.length} acc.)` : ` (${selectedEquipos.length} equipo${selectedEquipos.length > 1 ? 's' : ''})`}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
