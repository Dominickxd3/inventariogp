import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { Plus, XCircle, Check, Monitor, Printer } from 'lucide-react';
import { formatDate } from '../lib/utils';

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

const ACC_OPTIONS = [
  { value: 'DISPONIBLE', label: 'Devolver a disponible' },
  { value: 'MANTENER', label: 'Mantener asignado al trabajador' },
  { value: 'BAJA', label: 'Dar de baja' },
  { value: 'PERDIDO', label: 'Marcar como perdido/dañado' },
];

export default function Asignaciones() {
  const [showModal, setShowModal] = useState(false);
  const [searchParams] = useSearchParams();
  const nuevoEquipoId = searchParams.get('nuevoEquipo');
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('VIGENTE');
  const [page, setPage] = useState(1);

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

  const cesarMutation = useMutation({
    mutationFn: ({ id, accesorios, motivo, estadoFisico, obsDev }) => api.asignaciones.cesar(id, accesorios, { MotivoCese: motivo, EstadoFisicoDevolucion: estadoFisico, ObservacionesDevolucion: obsDev }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asignaciones'] });
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      queryClient.invalidateQueries({ queryKey: ['equipos-dashboard'] });
      setShowCesarDialog(false);
      setCesarTarget(null);
      setAccActions([]);
      Swal.fire({ icon: 'success', title: 'Asignación finalizada', text: 'El equipo fue desasignado correctamente', timer: 2000, showConfirmButton: false });
    },
    onError: (err) => {
      Swal.fire({ icon: 'error', title: 'Error al cesar', text: err.message });
    },
  });

  const [showCesarDialog, setShowCesarDialog] = useState(false);
  const [cesarTarget, setCesarTarget] = useState(null);
  const [accActions, setAccActions] = useState([]);
  const [cesarMotivo, setCesarMotivo] = useState('');
  const [cesarEstadoFisico, setCesarEstadoFisico] = useState('');
  const [cesarObsDev, setCesarObsDev] = useState('');

  const MOTIVOS_CESE = [
    { value: 'DEVUELTO_BUEN_ESTADO', label: 'Devuelto en buen estado' },
    { value: 'DEVUELTO_CON_DANO', label: 'Devuelto con daño' },
    { value: 'PERDIDO', label: 'Perdido' },
    { value: 'ROBADO', label: 'Robado' },
    { value: 'A_MANTENIMIENTO', label: 'Pasa a mantenimiento' },
    { value: 'A_BAJA', label: 'Pasa a baja' },
  ];

  const ESTADOS_FISICOS_DEV = [
    { value: 'BUENO', label: 'Bueno' },
    { value: 'DANADO', label: 'Dañado' },
    { value: 'INCOMPLETO', label: 'Incompleto' },
    { value: 'PERDIDO', label: 'Perdido' },
  ];

  const { data: cesarAccs } = useQuery({
    queryKey: ['cesar-accesorios', cesarTarget?.IdMovEquipoAsignacion],
    queryFn: () => api.asignaciones.list({ pageSize: 50, idEquipo: cesarTarget?.IdMaeEquipo, estado: 'VIGENTE' }).then(() => {
      return api.asignaciones.linkedAccs(cesarTarget?.IdMovEquipoAsignacion);
    }),
    enabled: !!cesarTarget && showCesarDialog,
  });

  const confirmCesar = async (row) => {
    setCesarTarget(row);
    setCesarMotivo('');
    setCesarEstadoFisico('');
    setCesarObsDev('');

    try {
      const accs = await api.asignaciones.linkedAccs(row.IdMovEquipoAsignacion);
      if (accs?.length) {
        setAccActions(accs.map((a) => ({ idMovAccesorio: a.IdMovAccesorio, accion: 'DISPONIBLE' })));
      } else {
        setAccActions([]);
      }
    } catch {
      setAccActions([]);
    }

    setShowCesarDialog(true);
  };

  const handleCesar = () => {
    cesarMutation.mutate({
      id: cesarTarget.IdMovEquipoAsignacion,
      accesorios: accActions.length ? accActions : undefined,
      motivo: cesarMotivo || null,
      estadoFisico: cesarEstadoFisico || null,
      obsDev: cesarObsDev || null,
    });
  };

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
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo generar el acta' });
    }
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
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); confirmCesar(row); }}>
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

      <Dialog open={showCesarDialog} onOpenChange={(v) => { setShowCesarDialog(v); if (!v) { setCesarTarget(null); setAccActions([]); setCesarMotivo(''); setCesarEstadoFisico(''); setCesarObsDev(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cesar asignación</DialogTitle>
            <DialogDescription>
              Finalizar asignación de <strong>{cesarTarget?.CodEquipo}</strong> a {cesarTarget?.TrabajadorNombre}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">¿Qué pasó con el equipo?</label>
              <Select value={cesarMotivo} onValueChange={setCesarMotivo}>
                <SelectTrigger><SelectValue placeholder="Seleccionar motivo" /></SelectTrigger>
                <SelectContent>
                  {MOTIVOS_CESE.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Estado físico al devolver</label>
              <Select value={cesarEstadoFisico} onValueChange={setCesarEstadoFisico}>
                <SelectTrigger><SelectValue placeholder="Seleccionar estado" /></SelectTrigger>
                <SelectContent>
                  {ESTADOS_FISICOS_DEV.map((ef) => (
                    <SelectItem key={ef.value} value={ef.value}>{ef.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Observaciones</label>
              <textarea value={cesarObsDev} onChange={(e) => setCesarObsDev(e.target.value)}
                className="w-full min-h-[60px] rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
                placeholder="Ej: Pantalla rota, sin cargador, teclado con teclas faltantes..."
                rows={2} />
            </div>

            {accActions.length > 0 && (
              <>
                <p className="text-sm font-medium pt-2 border-t border-border">Accesorios vinculados a esta entrega:</p>
                {accActions.map((aa, i) => {
                  const acc = cesarAccs?.[i];
                  return (
                    <div key={aa.idMovAccesorio} className="flex items-center gap-2 text-sm">
                      <span className="flex-1 text-muted-foreground">{acc?.CodComponente || `ID ${aa.idMovAccesorio}`}</span>
                      <Select
                        value={aa.accion}
                        onValueChange={(v) => setAccActions((prev) => prev.map((a) => a.idMovAccesorio === aa.idMovAccesorio ? { ...a, accion: v } : a))}
                      >
                        <SelectTrigger className="w-44">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACC_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCesarDialog(false); setCesarTarget(null); setAccActions([]); setCesarMotivo(''); setCesarEstadoFisico(''); setCesarObsDev(''); }}>Cancelar</Button>
            <Button variant="destructive" onClick={handleCesar} disabled={cesarMutation.isPending}>
              {cesarMutation.isPending ? 'Cesando...' : 'Cesar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  const [estadoFisico, setEstadoFisico] = useState('');
  const [obsEntrega, setObsEntrega] = useState('');

  const ESTADOS_FISICOS = [
    { value: 'BUENO', label: 'Bueno' },
    { value: 'REGULAR', label: 'Regular' },
    { value: 'DANADO', label: 'Dañado' },
    { value: 'CON_OBSERVACION', label: 'Con observación' },
  ];

  const { data: trabajadores } = useQuery({
    queryKey: ['trabajadores-search', searchTrab],
    queryFn: () => api.trabajadores.search({ search: searchTrab }),
    enabled: searchTrab.length > 2,
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

    const baseData = {
      EstadoFisicoEntrega: estadoFisico || null,
      ObservacionesEntrega: obsEntrega || null,
    };

    if (selectedEquipos.length === 1 && selectedAcc.length > 0) {
      const eq = selectedEquipos[0];
      asignarConAccMutation.mutate({
        ...baseData,
        IdMaeEquipo: eq.IdMaeEquipo,
        IdReferente: selectedTrab.IdTrabajador,
        Obs: obs || null,
        Accesorios: selectedAcc.map((a) => ({ IdComponente: a.IdComponente, Obs: null })),
      });
    } else {
      asignarMutation.mutate({
        ...baseData,
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

            {estadoFisico && (
              <div className="mt-3 pt-2 border-t border-border">
                <p className="font-semibold text-sm mb-1">Estado físico al entregar</p>
                <p className="text-xs">
                  {ESTADOS_FISICOS.find(ef => ef.value === estadoFisico)?.label || estadoFisico}
                  {obsEntrega ? ` — ${obsEntrega}` : ''}
                </p>
              </div>
            )}

            <div className="mt-3 pt-2 border-t border-border bg-amber-50 dark:bg-amber-950/20 p-2 rounded text-xs text-muted-foreground">
              Los equipos pasarán a estado <strong>ASIGNADO</strong>.
              Los accesorios seleccionados quedarán asignados al trabajador y vinculados a esta entrega.
            </div>
          </div>
          <div className="space-y-3 pt-2 border-t border-border">
            <p className="font-semibold text-sm">Estado físico del equipo al entregar</p>
            <div className="grid grid-cols-2 gap-3">
              {ESTADOS_FISICOS.map((ef) => (
                <div key={ef.value} onClick={() => setEstadoFisico(ef.value)}
                  className={`p-3 rounded-lg cursor-pointer text-sm text-center border ${
                    estadoFisico === ef.value ? 'bg-accent border-primary' : 'hover:bg-muted border-border'
                  }`}>
                  {ef.label}
                </div>
              ))}
            </div>
            {estadoFisico && (
              <div>
                <label className="block text-sm font-medium mb-1">Observaciones sobre el estado físico</label>
                <textarea value={obsEntrega} onChange={(e) => setObsEntrega(e.target.value)}
                  className="w-full min-h-[60px] rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
                  placeholder="Ej: Pantalla con rayón leve, teclado con desgaste, sin cargador original..."
                  rows={2} />
              </div>
            )}
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
