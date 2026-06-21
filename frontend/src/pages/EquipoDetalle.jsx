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
import { Badge } from '#components/ui/badge.jsx';
import { Skeleton } from '#components/ui/skeleton.jsx';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '#components/ui/dialog.jsx';
import { ArrowLeft, QrCode, Pencil, Save, X } from 'lucide-react';
import { useState } from 'react';

export default function EquipoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showQR, setShowQR] = useState(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});

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

  const updateMutation = useMutation({
    mutationFn: (data) => api.equipos.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipo', id] });
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      queryClient.invalidateQueries({ queryKey: ['equipos-dashboard'] });
      setEditMode(false);
      Swal.fire({ icon: 'success', title: 'Equipo actualizado', text: 'Los cambios se guardaron correctamente', timer: 2000, showConfirmButton: false });
    },
    onError: (err) => {
      Swal.fire({ icon: 'error', title: 'Error al actualizar', text: err.message });
    },
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
                  <Button type="button" variant="ghost" size="icon" onClick={() => setEditMode(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                  <Button type="submit" size="sm" disabled={updateMutation.isPending}>
                    <Save className="w-4 h-4" /> Guardar
                  </Button>
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

            <Button variant="ghost" onClick={async () => { const qr = await api.equipos.qr(equipo.IdMaeEquipo); setShowQR(qr); setQrOpen(true); }}
              className="mt-4 flex items-center gap-2">
              <QrCode className="w-4 h-4" /> Generar QR
            </Button>
          </CardContent>
        )}
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

      {equipo.componentes?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Componentes Asignados</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {equipo.componentes.map((c) => (
                <div key={c.IdMovEquipoComponente} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{c.DesComponente || c.CodComponente}</p>
                    <p className="text-xs text-muted-foreground">{c.DesTipodeComponente}</p>
                  </div>
                  {c.Serie && <span className="text-xs text-muted-foreground">Serie: {c.Serie}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Historial de Asignaciones</CardTitle></CardHeader>
        <CardContent>
          {historial?.length > 0 ? (
            <div className="space-y-3">
              {historial.map((h) => (
                <div key={h.IdMovEquipoAsignacion} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{h.Trabajador || `ID: ${h.IdReferente}`}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(h.FecAsignacion)} - {formatDate(h.FecCese) || 'Actual'}</p>
                  </div>
                  <EstadoBadge estado={h.Estado} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin historial de asignaciones</p>
          )}
        </CardContent>
      </Card>

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
