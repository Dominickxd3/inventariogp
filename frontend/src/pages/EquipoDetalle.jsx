import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import Swal from 'sweetalert2';
import { EstadoBadge } from '../components/Badge';
import { formatDate } from '../lib/utils';
import { Button } from '#components/ui/button.jsx';
import { Input } from '#components/ui/input.jsx';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '#components/ui/select.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '#components/ui/card.jsx';
import { Skeleton } from '#components/ui/skeleton.jsx';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '#components/ui/dialog.jsx';
import { useState, useMemo } from 'react';
import ComponentSearchSelect from '../components/ComponentSearchSelect';
import IncidenciaSelect from '../components/IncidenciaSelect';
import {
  ArrowLeft, QrCode, Pencil, Save, X, Plus, Trash2, Monitor, Search, Cpu, Wrench, Hammer, AlertTriangle,
} from 'lucide-react';

export default function EquipoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showQR, setShowQR] = useState(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [compOpen, setCompOpen] = useState(false);
  const [compSearch, setCompSearch] = useState('');
  const [compOrigen, setCompOrigen] = useState('');
  const [compMotivo, setCompMotivo] = useState('');
  const [tecEditOpen, setTecEditOpen] = useState(false);
  const [tecForm, setTecForm] = useState({});
  const [intervOpen, setIntervOpen] = useState(false);
  const initialIntervForm = {
    TipoIntervencion: '', Descripcion: '', PiezaAfectada: '',
    IdComponenteInstalado: null, IdComponenteRetirado: null,
    ComponenteRetiradoNoInventariado: false,
    IdIncidencia: null, Resultado: '', RequiereReparacion: null,
    SoftwareInstalado: '', Version: '', MotivoBaja: '',
    ComponentesBaja: [],
  };
  const [intervForm, setIntervForm] = useState({ ...initialIntervForm });

  const { data: equipo, isLoading } = useQuery({
    queryKey: ['equipo', id],
    queryFn: () => api.equipos.get(id),
  });

  const { data: tipos } = useQuery({
    queryKey: ['equipos-tipos'],
    queryFn: api.equipos.tipos.list,
  });

  const { data: historial } = useQuery({
    queryKey: ['historial-equipo', id],
    queryFn: () => api.asignaciones.historialEquipo(id),
  });

  const { data: componentesEquipo, refetch: refetchComp } = useQuery({
    queryKey: ['componentes-equipo', id],
    queryFn: () => api.equipos.componentes.list(id),
  });

  const { data: tecData, isLoading: tecLoading } = useQuery({
    queryKey: ['caracteristicas-equipo', id],
    queryFn: () => api.equipos.caracteristicas.get(id),
  });

  const { data: intervenciones, refetch: refetchInterv } = useQuery({
    queryKey: ['intervenciones-equipo', id],
    queryFn: () => api.equipos.intervenciones.list(id),
  });

  const { data: incidencias } = useQuery({
    queryKey: ['incidencias-equipo', id],
    queryFn: () => api.equipos.incidencias.list(id),
  });

  const { data: componentesDisponibles } = useQuery({
    queryKey: ['componentes-disponibles', compSearch],
    queryFn: () => api.componentes.list({ estado: 'DISPONIBLE' }),
    enabled: compOpen,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.equipos.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipo', id] });
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      queryClient.invalidateQueries({ queryKey: ['equipos-dashboard'] });
      setEditMode(false);
      Swal.fire({ icon: 'success', title: 'Equipo actualizado', timer: 1500, showConfirmButton: false });
    },
    onError: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.message }),
  });

  const saveTecMutation = useMutation({
    mutationFn: (caracteristicas) => api.equipos.caracteristicas.save(id, { caracteristicas }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caracteristicas-equipo', id] });
      setTecEditOpen(false);
      Swal.fire({ icon: 'success', title: 'Datos técnicos guardados', timer: 1500, showConfirmButton: false });
    },
    onError: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.message }),
  });

  const addIntervMutation = useMutation({
    mutationFn: (data) => api.equipos.intervenciones.create(id, data),
    onSuccess: () => {
      refetchInterv();
      queryClient.invalidateQueries({ queryKey: ['equipo', id] });
      queryClient.invalidateQueries({ queryKey: ['componentes-equipo', id] });
      setIntervOpen(false);
      setIntervForm({ ...initialIntervForm });
      Swal.fire({ icon: 'success', title: 'Intervención registrada', timer: 1500, showConfirmButton: false });
    },
    onError: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.message }),
  });

  const addCompMutation = useMutation({
    mutationFn: (data) => api.equipos.componentes.add(id, data),
    onSuccess: () => {
      refetchComp();
      queryClient.invalidateQueries({ queryKey: ['equipo', id] });
      setCompOpen(false);
      setCompSearch('');
      setCompOrigen('');
      setCompMotivo('');
      Swal.fire({ icon: 'success', title: 'Componente agregado', timer: 1500, showConfirmButton: false });
    },
    onError: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo agregar el componente al equipo.' }),
  });

  const removeCompMutation = useMutation({
    mutationFn: ({ idMov, Motivo }) => api.equipos.componentes.remove(id, idMov, Motivo),
    onSuccess: () => {
      refetchComp();
      queryClient.invalidateQueries({ queryKey: ['equipo', id] });
      Swal.fire({ icon: 'success', title: 'Componente quitado', timer: 1500, showConfirmButton: false });
    },
    onError: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.message }),
  });

  const handleEditClick = () => {
    setForm({
      CodEquipo: equipo.CodEquipo,
      IdTipodeEquipo: String(equipo.IdTipodeEquipo),
      CodBarra: equipo.CodBarra || '',
      Obs: equipo.Obs || '',
      Estado: equipo.Estado,
    });
    setEditMode(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateMutation.mutate({ ...form, IdTipodeEquipo: parseInt(form.IdTipodeEquipo) });
  };

  const openTecEdit = () => {
    const initial = {};
    (tecData?.caracteristicas || []).forEach(c => {
      initial[c.IdPlantilla] = c.Valor || '';
    });
    setTecForm(initial);
    setTecEditOpen(true);
  };

  const handleSaveTec = () => {
    const caracteristicas = (tecData?.caracteristicas || []).map(c => ({
      IdPlantilla: c.IdPlantilla,
      Valor: tecForm[c.IdPlantilla] || null,
    }));
    saveTecMutation.mutate(caracteristicas);
  };

  const tieneDatosTecnicos = tecData?.caracteristicas?.some(c => c.Valor);

  const tipoNombre = equipo?.DesTipodeEquipo || '';
  const esPC = tipoNombre.toUpperCase().trim() === 'PC ESCRITORIO';
  const filtrados = useMemo(() => {
    if (!componentesDisponibles || !componentesEquipo) return [];
    const idsVinculados = new Set(componentesEquipo.map(c => c.IdComponente));
    let lista = componentesDisponibles.filter(c => !idsVinculados.has(c.IdComponente));
    if (compSearch.trim()) {
      const s = compSearch.toLowerCase();
      lista = lista.filter(c =>
        (c.CodComponente || '').toLowerCase().includes(s) ||
        (c.DesComponente || '').toLowerCase().includes(s) ||
        (c.DesTipodeComponente || '').toLowerCase().includes(s) ||
        (c.Marca || '').toLowerCase().includes(s) ||
        (c.Modelo || '').toLowerCase().includes(s) ||
        (c.Serie || '').toLowerCase().includes(s)
      );
    }
    return lista;
  }, [componentesDisponibles, componentesEquipo, compSearch]);

  if (isLoading) return (
    <div className="space-y-6 max-w-4xl">
      <Skeleton className="h-9 w-24" />
      <Card><CardContent className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      </CardContent></Card>
    </div>
  );

  if (!equipo) return <div className="text-center py-12 text-muted-foreground">Equipo no encontrado</div>;

  const INTERVENCION_TYPES = [
    { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
    { value: 'REEMPLAZO', label: 'Reemplazo de pieza' },
    { value: 'MEJORA', label: 'Mejora' },
    { value: 'REPARACION', label: 'Reparación' },
    { value: 'DIAGNOSTICO', label: 'Diagnóstico' },
    { value: 'LIMPIEZA', label: 'Limpieza' },
    { value: 'INSTALACION_SO', label: 'Instalación de software' },
    { value: 'BAJA_COMPONENTE', label: 'Baja de componente' },
    { value: 'BAJA_EQUIPO', label: 'Baja de equipo' },
  ];

  const PIEZAS_AFECTADAS = ['RAM', 'Disco', 'Cargador', 'Pantalla', 'Batería', 'Teclado', 'Mouse', 'Fuente', 'Placa', 'Otro'];
  const RESULTADOS_REPARACION = ['Reparado', 'Reparado parcialmente', 'No reparable', 'Requiere reemplazo'];
  const MOTIVOS_BAJA_COMP = ['Dañado', 'Obsoleto', 'Perdido', 'Retirado por reemplazo', 'Otro'];
  const MOTIVOS_BAJA_EQ = ['Irreparable', 'Obsoleto', 'Perdido', 'Robado', 'Renovación', 'Otro'];

  const handleRegisterIntervencion = () => {
    const f = intervForm;
    if (!f.TipoIntervencion) { Swal.fire({ icon: 'warning', title: 'Selecciona un tipo de intervención' }); return; }
    if (!f.Descripcion?.trim()) { Swal.fire({ icon: 'warning', title: 'La descripción es obligatoria' }); return; }

    const payload = {
      TipoIntervencion: f.TipoIntervencion,
      Descripcion: f.Descripcion.trim(),
      PiezaAfectada: f.PiezaAfectada || null,
      IdComponenteInstalado: f.IdComponenteInstalado || null,
      IdComponenteRetirado: f.ComponenteRetiradoNoInventariado ? null : (f.IdComponenteRetirado || null),
      ComponenteRetiradoNoInventariado: f.ComponenteRetiradoNoInventariado || false,
      IdIncidencia: f.IdIncidencia || null,
      Resultado: f.Resultado || null,
      RequiereReparacion: f.RequiereReparacion,
      SoftwareInstalado: f.SoftwareInstalado || null,
      Version: f.Version || null,
      MotivoBaja: f.MotivoBaja || null,
    };

    if (['BAJA_EQUIPO'].includes(f.TipoIntervencion) && f.ComponentesBaja?.length > 0) {
      payload.ComponentesBaja = f.ComponentesBaja;
    }

    addIntervMutation.mutate(payload);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" /> Volver
      </Button>

      <Card>
        <CardHeader>
          {!editMode ? (
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{equipo.CodEquipo}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{equipo.DesTipodeEquipo}</p>
              </div>
              <div className="flex items-center gap-2">
                <EstadoBadge estado={equipo.Estado} />
                <Button variant="ghost" size="icon" onClick={handleEditClick}>
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave}>
              <div className="flex items-center justify-between mb-4">
                <CardTitle>Editar Equipo</CardTitle>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="icon" onClick={() => setEditMode(false)}><X className="w-4 h-4" /></Button>
                  <Button type="submit" size="sm" disabled={updateMutation.isPending}><Save className="w-4 h-4" /> Guardar</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Código</label>
                  <Input value={form.CodEquipo} onChange={(e) => setForm({ ...form, CodEquipo: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Código de Barra</label>
                  <Input value={form.CodBarra} onChange={(e) => setForm({ ...form, CodBarra: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Equipo</label>
                  <Select value={form.IdTipodeEquipo} onValueChange={(v) => setForm({ ...form, IdTipodeEquipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {tipos?.map((t) => (
                        <SelectItem key={t.IdTipodeEquipo} value={String(t.IdTipodeEquipo)}>{t.DesTipodeEquipo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Estado</label>
                  <Select value={form.Estado} onValueChange={(v) => setForm({ ...form, Estado: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['DISPONIBLE', 'ASIGNADO', 'MANTENIMIENTO', 'INCIDENCIA', 'BAJA'].map((e) => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium">Observaciones</label>
                  <textarea value={form.Obs} onChange={(e) => setForm({ ...form, Obs: e.target.value })}
                    className="w-full min-h-[80px] rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm" />
                </div>
              </div>
            </form>
          )}
        </CardHeader>
        {!editMode && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Código de Barra</p>
                <p className="text-sm font-medium">{equipo.CodBarra || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fecha de Creación</p>
                <p className="text-sm font-medium">{formatDate(equipo.FecCreacion)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Observaciones</p>
                <p className="text-sm font-medium">{equipo.Obs || '-'}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <Button variant="ghost" onClick={async () => { const qr = await api.equipos.qr(equipo.IdMaeEquipo); setShowQR(qr); setQrOpen(true); }} className="flex items-center gap-2">
                <QrCode className="w-4 h-4" /> QR
              </Button>
              {equipo.Estado === 'DISPONIBLE' && (
                <Button variant="default" onClick={() => navigate(`/asignaciones?nuevoEquipo=${equipo.IdMaeEquipo}`)} className="flex items-center gap-2">
                  <Monitor className="w-4 h-4" /> Asignar equipo
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {!esPC && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                <CardTitle>Datos técnicos</CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={openTecEdit}>
                <Pencil className="w-4 h-4" /> {tieneDatosTecnicos ? 'Editar' : 'Agregar'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tecLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : tieneDatosTecnicos ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2">
                {(tecData?.caracteristicas || [])
                  .filter(c => c.Valor)
                  .map(c => (
                    <div key={c.IdPlantilla}>
                      <p className="text-xs text-muted-foreground">{c.Etiqueta}</p>
                      <p className="text-sm font-medium">{c.Valor}</p>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Datos técnicos pendientes.</p>
            )}
          </CardContent>
        </Card>
      )}

      {esPC ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Cpu className="w-4 h-4" /> Configuración del equipo
            </CardTitle>
            <p className="text-xs text-muted-foreground">PC armado por componentes</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-end mb-3">
              <Button variant="outline" size="sm" onClick={() => setCompOpen(true)}>
                <Plus className="w-4 h-4" /> Agregar componente
              </Button>
            </div>
            {componentesEquipo?.length > 0 ? (
              <div className="space-y-1">
                {componentesEquipo.map((c) => (
                  <div key={c.IdMovEquipoComponente} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 border">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.DesComponente || c.CodComponente}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.DesTipodeComponente}
                        {c.Marca ? ` · ${c.Marca}` : ''}
                        {c.Modelo ? ` ${c.Modelo}` : ''}
                        {c.Capacidad ? ` · ${c.Capacidad}` : ''}
                        {c.Serie ? ` · S/N: ${c.Serie}` : ''}
                      </p>
                      <div className="flex gap-2 mt-0.5">
                        {c.OrigenVinculo && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">{c.OrigenVinculo}</span>}
                        {c.Motivo && <span className="text-[10px] text-muted-foreground">· {c.Motivo}</span>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0 ml-2" onClick={() => {
                      Swal.fire({
                        title: '¿Quitar componente?',
                        text: `${c.DesComponente || c.CodComponente}`,
                        icon: 'warning', showCancelButton: true, confirmButtonText: 'Quitar', cancelButtonText: 'Cancelar',
                        input: 'text', inputPlaceholder: 'Motivo (opcional)',
                      }).then((r) => { if (r.isConfirmed) removeCompMutation.mutate({ idMov: c.IdMovEquipoComponente, Motivo: r.value || null }); });
                    }}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Este equipo no tiene componentes instalados registrados.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Cpu className="w-4 h-4" /> Repuestos, mejoras o accesorios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-end mb-3">
              <Button variant="outline" size="sm" onClick={() => setCompOpen(true)}>
                <Plus className="w-4 h-4" /> Agregar relacionado
              </Button>
            </div>
            {componentesEquipo?.length > 0 ? (
              <div className="space-y-1">
                {componentesEquipo.map((c) => (
                  <div key={c.IdMovEquipoComponente} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 border">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.DesComponente || c.CodComponente}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.DesTipodeComponente}
                        {c.Marca ? ` · ${c.Marca}` : ''}
                        {c.Modelo ? ` ${c.Modelo}` : ''}
                        {c.Capacidad ? ` · ${c.Capacidad}` : ''}
                        {c.Serie ? ` · S/N: ${c.Serie}` : ''}
                      </p>
                      <div className="flex gap-2 mt-0.5">
                        {c.OrigenVinculo && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">{c.OrigenVinculo}</span>}
                        {c.Motivo && <span className="text-[10px] text-muted-foreground">· {c.Motivo}</span>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0 ml-2" onClick={() => {
                      Swal.fire({
                        title: '¿Quitar relacionado?',
                        text: `${c.DesComponente || c.CodComponente}`,
                        icon: 'warning', showCancelButton: true, confirmButtonText: 'Quitar', cancelButtonText: 'Cancelar',
                        input: 'text', inputPlaceholder: 'Motivo (opcional)',
                      }).then((r) => { if (r.isConfirmed) removeCompMutation.mutate({ idMov: c.IdMovEquipoComponente, Motivo: r.value || null }); });
                    }}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Este equipo no tiene repuestos, mejoras o accesorios registrados.</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hammer className="w-4 h-4" />
              <CardTitle>Intervenciones técnicas</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIntervOpen(true)}>
              <Plus className="w-4 h-4" /> Nueva intervención
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {intervenciones?.length > 0 ? (
            <div className="space-y-3">
              {intervenciones.map((iv) => (
                <div key={iv.IdIntervencion} className="flex items-start justify-between py-2 border-b last:border-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted">{
                        INTERVENCION_TYPES.find(t => t.value === iv.TipoIntervencion)?.label || iv.TipoIntervencion
                      }</span>
                      <span className="text-xs text-muted-foreground">{formatDate(iv.FecIntervencion)}</span>
                    </div>
                    {iv.PiezaAfectada && <p className="text-xs text-muted-foreground mt-0.5">Pieza: {iv.PiezaAfectada}</p>}
                    <p className="text-sm mt-1">{iv.Descripcion}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                      {iv.NombreUsuario && <span>Por: {iv.NombreUsuario}</span>}
                      {iv.DesComponenteInstalado && <span>Instalado: {iv.DesComponenteInstalado}</span>}
                      {iv.DesComponenteRetirado && <span>Retirado: {iv.DesComponenteRetirado}</span>}
                      {iv.ComponenteRetiradoNoInventariado ? <span>Retirado: venía de fábrica (no inventariado)</span> : null}
                      {iv.IncidenciaTipo && <span>Incidencia: {iv.IncidenciaTipo}</span>}
                      {iv.Resultado && <span>Resultado: {iv.Resultado}</span>}
                      {iv.SoftwareInstalado && <span>Software: {iv.SoftwareInstalado}{iv.Version ? ` v${iv.Version}` : ''}</span>}
                      {iv.MotivoBaja && <span>Motivo: {iv.MotivoBaja}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin intervenciones técnicas registradas.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <CardTitle>Incidencias</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {incidencias?.length > 0 ? (
            <div className="space-y-3">
              {incidencias.map((inc) => (
                <div key={inc.IdIncidencia} className="flex items-start justify-between py-2 border-b last:border-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${inc.Estado === 'ABIERTO' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {inc.Estado}
                      </span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted">{inc.TipoIncidencia}</span>
                      {inc.FecIncidencia && <span className="text-xs text-muted-foreground">{formatDate(inc.FecIncidencia)}</span>}
                    </div>
                    <p className="text-sm mt-1">{inc.Descripcion}</p>
                    {inc.Trabajador && <p className="text-xs text-muted-foreground mt-0.5">Reportó: {inc.Trabajador}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin incidencias registradas.</p>
          )}
        </CardContent>
      </Card>

      {equipo.asignacion && (
        <Card>
          <CardHeader><CardTitle>Asignación Actual</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Trabajador</p>
                <p className="text-sm font-medium">{equipo.asignacion.TrabajadorNombre || 'Sin datos'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">DNI</p>
                <p className="text-sm font-medium">{equipo.asignacion.DNI || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Área</p>
                <p className="text-sm font-medium">{equipo.asignacion.AreaName || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cargo</p>
                <p className="text-sm font-medium">{equipo.asignacion.NomCargo || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Historial de Asignaciones</CardTitle></CardHeader>
        <CardContent>
          {historial?.length > 0 ? (
            <div className="space-y-2">
              {historial.map((h) => (
                <div key={h.IdMovEquipoAsignacion} className="py-2 border-b last:border-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{h.Trabajador || `ID: ${h.IdReferente}`}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(h.FecAsignacion)} {h.FecCese ? `→ ${formatDate(h.FecCese)}` : '(vigente)'}
                      </p>
                    </div>
                    <EstadoBadge estado={h.Estado} />
                  </div>
                  {h.Estado === 'CESADO' && (
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                      {h.MotivoCese && <span>Motivo: {h.MotivoCese}</span>}
                      {h.EstadoFisicoDevolucion && <span>Estado devolución: {h.EstadoFisicoDevolucion}</span>}
                      {h.ObservacionesDevolucion && <span>Obs: {h.ObservacionesDevolucion}</span>}
                      {h.EstadoFisicoEntrega && <span>Estado entrega: {h.EstadoFisicoEntrega}</span>}
                    </div>
                  )}
                  {h.Estado === 'VIGENTE' && h.EstadoFisicoEntrega && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Estado entrega: {h.EstadoFisicoEntrega}
                      {h.ObservacionesEntrega ? ` — ${h.ObservacionesEntrega}` : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin historial de asignaciones</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={tecEditOpen} onOpenChange={(v) => { setTecEditOpen(v); if (!v) setTecForm({}); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Datos técnicos</DialogTitle>
            <DialogDescription>Completa las características técnicas del equipo según su tipo</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {(tecData?.caracteristicas || []).map(c => (
              <div key={c.IdPlantilla} className="space-y-1.5">
                <label className="text-sm font-medium">
                  {c.Etiqueta}
                  {c.Requerido && <span className="text-destructive ml-1">*</span>}
                </label>
                <Input
                  value={tecForm[c.IdPlantilla] || ''}
                  onChange={(e) => setTecForm({ ...tecForm, [c.IdPlantilla]: e.target.value })}
                  placeholder={c.Etiqueta}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setTecEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveTec} disabled={saveTecMutation.isPending}>
              <Save className="w-4 h-4" /> Guardar datos técnicos
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={intervOpen} onOpenChange={(v) => { setIntervOpen(v); if (!v) setIntervForm({ ...initialIntervForm }); }}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Intervención Técnica</DialogTitle>
            <DialogDescription>Registra un mantenimiento, reparación, reemplazo, mejora u otra intervención sobre este equipo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Tipo de intervención */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tipo de intervención</label>
              <Select value={intervForm.TipoIntervencion} onValueChange={(v) => setIntervForm({ ...initialIntervForm, TipoIntervencion: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                <SelectContent>
                  {INTERVENCION_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Campos dinámicos según tipo */}
            {intervForm.TipoIntervencion === 'MANTENIMIENTO' && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Descripción</label>
                <textarea value={intervForm.Descripcion} onChange={(e) => setIntervForm({ ...intervForm, Descripcion: e.target.value })}
                  className="w-full min-h-[80px] rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
                  placeholder="Describe el mantenimiento realizado." />
              </div>
            )}

            {intervForm.TipoIntervencion === 'REEMPLAZO' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Pieza afectada</label>
                  <Select value={intervForm.PiezaAfectada} onValueChange={(v) => setIntervForm({ ...intervForm, PiezaAfectada: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar pieza" /></SelectTrigger>
                    <SelectContent>
                      {PIEZAS_AFECTADAS.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <ComponentSearchSelect
                  label="Componente instalado"
                  value={intervForm.IdComponenteInstalado}
                  onChange={(v) => setIntervForm({ ...intervForm, IdComponenteInstalado: v })}
                  placeholder="Buscar componente disponible..."
                />

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Componente retirado</label>
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <ComponentSearchSelect
                        value={intervForm.ComponenteRetiradoNoInventariado ? null : intervForm.IdComponenteRetirado}
                        onChange={(v) => setIntervForm({ ...intervForm, IdComponenteRetirado: v, ComponenteRetiradoNoInventariado: false })}
                        placeholder="Seleccionar componente del equipo..."
                        filterByEquipo={id}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      id="compRetNoInv"
                      checked={intervForm.ComponenteRetiradoNoInventariado}
                      onChange={(e) => setIntervForm({ ...intervForm, ComponenteRetiradoNoInventariado: e.target.checked, IdComponenteRetirado: null })}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="compRetNoInv" className="text-xs text-muted-foreground cursor-pointer select-none">
                      No estaba registrado / venía de fábrica
                    </label>
                  </div>
                </div>

                <IncidenciaSelect
                  label="Incidencia relacionada"
                  idEquipo={id}
                  value={intervForm.IdIncidencia}
                  onChange={(v) => setIntervForm({ ...intervForm, IdIncidencia: v })}
                />

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Descripción</label>
                  <textarea value={intervForm.Descripcion} onChange={(e) => setIntervForm({ ...intervForm, Descripcion: e.target.value })}
                    className="w-full min-h-[80px] rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
                    placeholder="Describe detalladamente el reemplazo realizado." />
                </div>
              </>
            )}

            {intervForm.TipoIntervencion === 'MEJORA' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Pieza agregada / mejorada</label>
                  <Select value={intervForm.PiezaAfectada} onValueChange={(v) => setIntervForm({ ...intervForm, PiezaAfectada: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar pieza" /></SelectTrigger>
                    <SelectContent>
                      {PIEZAS_AFECTADAS.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <ComponentSearchSelect
                  label="Componente instalado"
                  value={intervForm.IdComponenteInstalado}
                  onChange={(v) => setIntervForm({ ...intervForm, IdComponenteInstalado: v })}
                  placeholder="Buscar componente disponible..."
                />

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Descripción</label>
                  <textarea value={intervForm.Descripcion} onChange={(e) => setIntervForm({ ...intervForm, Descripcion: e.target.value })}
                    className="w-full min-h-[80px] rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
                    placeholder="Describe la mejora realizada. Ej: Se agregó SSD Kingston 1TB." />
                </div>
              </>
            )}

            {intervForm.TipoIntervencion === 'REPARACION' && (
              <>
                <IncidenciaSelect
                  label="Incidencia relacionada"
                  idEquipo={id}
                  value={intervForm.IdIncidencia}
                  onChange={(v) => setIntervForm({ ...intervForm, IdIncidencia: v })}
                />

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Resultado de la reparación</label>
                  <Select value={intervForm.Resultado} onValueChange={(v) => setIntervForm({ ...intervForm, Resultado: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar resultado" /></SelectTrigger>
                    <SelectContent>
                      {RESULTADOS_REPARACION.map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {intervForm.Resultado === 'Requiere reemplazo' && (
                    <p className="text-xs text-amber-600 mt-1">
                      Considera registrar una intervención de tipo &quot;Reemplazo de pieza&quot; para documentar el cambio.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Descripción</label>
                  <textarea value={intervForm.Descripcion} onChange={(e) => setIntervForm({ ...intervForm, Descripcion: e.target.value })}
                    className="w-full min-h-[80px] rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
                    placeholder="Describe la reparación realizada." />
                </div>
              </>
            )}

            {intervForm.TipoIntervencion === 'DIAGNOSTICO' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Resultado del diagnóstico</label>
                  <textarea value={intervForm.Descripcion} onChange={(e) => setIntervForm({ ...intervForm, Descripcion: e.target.value })}
                    className="w-full min-h-[80px] rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
                    placeholder="Describe el resultado del diagnóstico." />
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium mb-0">¿Requiere reparación?</label>
                  <Select value={intervForm.RequiereReparacion != null ? String(intervForm.RequiereReparacion) : ''} onValueChange={(v) => setIntervForm({ ...intervForm, RequiereReparacion: v === 'true' })}>
                    <SelectTrigger className="w-32"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Sí</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {intervForm.TipoIntervencion === 'LIMPIEZA' && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Descripción</label>
                <textarea value={intervForm.Descripcion} onChange={(e) => setIntervForm({ ...intervForm, Descripcion: e.target.value })}
                  className="w-full min-h-[80px] rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
                  placeholder="Describe la limpieza realizada." />
              </div>
            )}

            {intervForm.TipoIntervencion === 'INSTALACION_SO' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Software instalado</label>
                  <Input value={intervForm.SoftwareInstalado} onChange={(e) => setIntervForm({ ...intervForm, SoftwareInstalado: e.target.value })}
                    placeholder="Ej: Windows 11 Pro, Ubuntu 24.04, Microsoft Office" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Versión</label>
                  <Input value={intervForm.Version} onChange={(e) => setIntervForm({ ...intervForm, Version: e.target.value })}
                    placeholder="Ej: 24H2, 2024, 8.1" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Descripción</label>
                  <textarea value={intervForm.Descripcion} onChange={(e) => setIntervForm({ ...intervForm, Descripcion: e.target.value })}
                    className="w-full min-h-[80px] rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
                    placeholder="Describe los detalles de la instalación." />
                </div>
              </>
            )}

            {intervForm.TipoIntervencion === 'BAJA_COMPONENTE' && (
              <>
                <ComponentSearchSelect
                  label="Componente a dar de baja"
                  value={intervForm.IdComponenteRetirado}
                  onChange={(v) => setIntervForm({ ...intervForm, IdComponenteRetirado: v })}
                  placeholder="Seleccionar componente del equipo..."
                  filterByEquipo={id}
                />

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Motivo</label>
                  <Select value={intervForm.MotivoBaja} onValueChange={(v) => setIntervForm({ ...intervForm, MotivoBaja: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar motivo" /></SelectTrigger>
                    <SelectContent>
                      {MOTIVOS_BAJA_COMP.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Descripción</label>
                  <textarea value={intervForm.Descripcion} onChange={(e) => setIntervForm({ ...intervForm, Descripcion: e.target.value })}
                    className="w-full min-h-[80px] rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
                    placeholder="Detalla la razón de la baja del componente." />
                </div>
              </>
            )}

            {intervForm.TipoIntervencion === 'BAJA_EQUIPO' && (
              <>
                {componentesEquipo?.length > 0 && (
                  <div className="rounded-lg border p-3 bg-amber-50 text-amber-800 text-sm">
                    <p className="font-medium mb-2">Este proceso dará de baja el equipo. Los componentes relacionados deben revisarse.</p>
                    <p className="text-xs">Si el equipo tiene asignación activa, deberás cesarla antes de dar de baja.</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Motivo de baja</label>
                  <Select value={intervForm.MotivoBaja} onValueChange={(v) => setIntervForm({ ...intervForm, MotivoBaja: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar motivo" /></SelectTrigger>
                    <SelectContent>
                      {MOTIVOS_BAJA_EQ.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {componentesEquipo?.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Componentes relacionados ({componentesEquipo.length})</label>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {componentesEquipo.map((c) => (
                        <div key={c.IdMovEquipoComponente} className="flex items-center justify-between p-2 rounded border text-sm">
                          <span className="text-xs font-medium">{c.CodComponente} - {c.DesTipodeComponente}</span>
                          <Select
                            value={(intervForm.ComponentesBaja || []).find(cb => cb.IdComponente === c.IdComponente)?.Accion || ''}
                            onValueChange={(v) => {
                              const current = intervForm.ComponentesBaja || [];
                              const updated = current.filter(cb => cb.IdComponente !== c.IdComponente);
                              if (v) updated.push({ IdComponente: c.IdComponente, Accion: v });
                              setIntervForm({ ...intervForm, ComponentesBaja: updated });
                            }}
                          >
                            <SelectTrigger className="w-36 h-7 text-xs"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DISPONIBLE">Dejar disponible</SelectItem>
                              <SelectItem value="BAJA">Dar de baja</SelectItem>
                              <SelectItem value="MANTENER">Mantener asociado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Descripción</label>
                  <textarea value={intervForm.Descripcion} onChange={(e) => setIntervForm({ ...intervForm, Descripcion: e.target.value })}
                    className="w-full min-h-[80px] rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
                    placeholder="Detalla las razones de la baja del equipo." />
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setIntervOpen(false)} disabled={addIntervMutation.isPending}>Cancelar</Button>
            <Button onClick={handleRegisterIntervencion} disabled={addIntervMutation.isPending}>
              <Save className="w-4 h-4" /> Registrar intervención
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={compOpen} onOpenChange={(v) => { setCompOpen(v); if (!v) { setCompSearch(''); setCompOrigen(''); setCompMotivo(''); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar Componente</DialogTitle>
            <DialogDescription>Busca y selecciona un componente disponible para instalar en este equipo</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input value={compSearch} onChange={(e) => setCompSearch(e.target.value)}
                placeholder="Buscar por código, descripción, tipo, marca, modelo o serie..."
                className="pl-8" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Origen del vínculo</label>
                <Select value={compOrigen} onValueChange={setCompOrigen}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar origen" /></SelectTrigger>
                  <SelectContent>
                    {['MEJORA', 'REEMPLAZO', 'REUTILIZADO', 'ACCESORIO', 'FABRICA'].map(o => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Motivo</label>
                <Input value={compMotivo} onChange={(e) => setCompMotivo(e.target.value)}
                  placeholder="Ej: Reemplazo por garantía" />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {filtrados.length > 0 ? filtrados.map((c) => (
                <div key={c.IdComponente} onClick={() => {
                  addCompMutation.mutate({ IdComponente: c.IdComponente, OrigenVinculo: compOrigen || null, Motivo: compMotivo || null });
                }} className="p-3 rounded-lg cursor-pointer hover:bg-muted border border-transparent hover:border-border text-sm">
                  <p className="font-medium">{c.CodComponente} - {c.DesComponente || 'Sin descripción'}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.DesTipodeComponente}
                    {c.Marca ? ` · ${c.Marca}` : ''}
                    {c.Modelo ? ` ${c.Modelo}` : ''}
                    {c.Capacidad ? ` · ${c.Capacidad}` : ''}
                    {c.Serie ? ` · S/N: ${c.Serie}` : ''}
                  </p>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {compSearch ? 'Sin resultados' : 'No hay componentes disponibles'}
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Código QR</DialogTitle></DialogHeader>
          {showQR && (
            <div className="text-center space-y-4">
              <img src={showQR.qr} alt="QR" className="mx-auto" />
              <p className="text-sm text-muted-foreground">Escanea para ver información del equipo</p>
              <a href={showQR.url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary underline break-all block">{showQR.url}</a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
