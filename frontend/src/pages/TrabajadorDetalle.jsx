import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import Swal from 'sweetalert2';
import { EstadoBadge } from '../components/Badge';
import { Button } from '#components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '#components/ui/card.jsx';
import { Skeleton } from '#components/ui/skeleton.jsx';
import { Badge } from '#components/ui/badge.jsx';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '#components/ui/dialog.jsx';
import { ArrowLeft, Monitor, XCircle, ClipboardList, Mouse, AlertTriangle } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { useState } from 'react';

export default function TrabajadorDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCesarDialog, setShowCesarDialog] = useState(false);

  const { data: trabajador, isLoading } = useQuery({
    queryKey: ['trabajador', id],
    queryFn: () => api.trabajadores.get(id),
  });

  const { data: activas, isLoading: activasLoading } = useQuery({
    queryKey: ['equipos-activos-trabajador', id],
    queryFn: () => api.asignaciones.activasTrabajador(id),
  });

  const { data: historial, isLoading: historialLoading } = useQuery({
    queryKey: ['historial-trabajador', id],
    queryFn: () => api.asignaciones.historialTrabajador(id),
  });

  const { data: accesorios, isLoading: accsLoading } = useQuery({
    queryKey: ['accesorios-trabajador', id],
    queryFn: () => api.componentes.accesoriosPorTrabajador(id),
  });

  const cesarTodoMutation = useMutation({
    mutationFn: () => api.asignaciones.cesarTrabajador(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipos-activos-trabajador', id] });
      queryClient.invalidateQueries({ queryKey: ['historial-trabajador', id] });
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      queryClient.invalidateQueries({ queryKey: ['equipos-dashboard'] });
      setShowCesarDialog(false);
      Swal.fire({ icon: 'success', title: 'Equipos desasignados', text: 'Todos los equipos fueron desasignados correctamente', timer: 2000, showConfirmButton: false });
    },
    onError: (err) => {
      Swal.fire({ icon: 'error', title: 'Error al desasignar', text: err.message });
    },
  });

  if (isLoading) return (
    <div className="space-y-6 max-w-4xl">
      <Skeleton className="h-9 w-24" />
      <Card><CardContent className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      </CardContent></Card>
    </div>
  );

  if (!trabajador) return <div className="text-center py-12 text-muted-foreground">Trabajador no encontrado</div>;

  const activasCount = activas?.length || 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" /> Volver
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{trabajador.Trabajador}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{trabajador.Ocupacion}</p>
            </div>
            <Badge variant={trabajador.Activo === '1' ? 'default' : 'secondary'}>
              {trabajador.Activo === '1' ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">DNI</p>
              <p className="text-sm font-medium">{trabajador.DOI}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Área</p>
              <p className="text-sm font-medium">{trabajador.Area || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Equipos asignados</p>
              <p className="text-sm font-medium">{activasCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Equipos Asignados</CardTitle>
            {activasCount > 0 && (
              <Button variant="destructive" size="sm" onClick={() => setShowCesarDialog(true)}>
                <XCircle className="w-4 h-4" /> Desasignar todo
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {activasLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : activasCount > 0 ? (
            <div className="space-y-2">
              {activas.map((a) => (
                <div key={a.IdMovEquipoAsignacion}
                  className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/equipos/${a.IdMaeEquipo}`)}
                >
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{a.CodEquipo} - {a.DesTipodeEquipo}</p>
                      <p className="text-xs text-muted-foreground">Desde {formatDate(a.FecAsignacion)}</p>
                    </div>
                  </div>
                  <EstadoBadge estado={a.Estado} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Monitor className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Sin equipos asignados</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Accesorios Vigentes</CardTitle></CardHeader>
        <CardContent>
          {accsLoading ? (
            <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : accesorios?.length > 0 ? (
            <div className="space-y-2">
              {accesorios.map((a) => (
                <div key={a.IdMovAccesorio} className="flex items-center gap-3 p-3 rounded-lg border">
                  <Mouse className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{a.CodComponente} — {a.DesComponente || a.DesTipodeComponente}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.DesTipodeComponente}{a.Marca ? ` / ${a.Marca}` : ''}
                      {a.Serie ? ` · S/N: ${a.Serie}` : ''}
                      {' · '}{formatDate(a.FecAsignacion)}
                    </p>
                  </div>
                  <EstadoBadge estado={a.Estado} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Mouse className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Sin accesorios asignados</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Historial de Asignaciones</CardTitle></CardHeader>
        <CardContent>
          {historialLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : historial?.length > 0 ? (
            <div className="space-y-2">
              {historial.map((h) => (
                <div key={h.IdMovEquipoAsignacion}
                  className="p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/equipos/${h.IdMaeEquipo}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ClipboardList className="w-5 h-5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{h.CodEquipo} - {h.DesTipodeEquipo}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(h.FecAsignacion)} {h.FecCese ? `→ ${formatDate(h.FecCese)}` : '(vigente)'}
                        </p>
                      </div>
                    </div>
                    <EstadoBadge estado={h.Estado} />
                  </div>
                  {h.Estado === 'CESADO' && (
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-xs text-muted-foreground ml-8">
                      {h.MotivoCese && <span>Motivo: {h.MotivoCese}</span>}
                      {h.EstadoFisicoDevolucion && <span>Estado devolución: {h.EstadoFisicoDevolucion}</span>}
                      {h.ObservacionesDevolucion && <span>Obs: {h.ObservacionesDevolucion}</span>}
                      {h.EstadoFisicoEntrega && <span>Estado entrega: {h.EstadoFisicoEntrega}</span>}
                      {h.ObservacionesEntrega && <span>Obs entrega: {h.ObservacionesEntrega}</span>}
                    </div>
                  )}
                  {h.Estado === 'VIGENTE' && h.EstadoFisicoEntrega && (
                    <p className="text-xs text-muted-foreground ml-8 mt-1">
                      Estado entrega: {h.EstadoFisicoEntrega}
                      {h.ObservacionesEntrega ? ` — ${h.ObservacionesEntrega}` : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Sin historial de asignaciones</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCesarDialog} onOpenChange={setShowCesarDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Desasignar todos los equipos</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de desasignar los {activasCount} equipos de <strong>{trabajador.Trabajador}</strong>?
              Todos los equipos volverán a estado disponible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCesarDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => cesarTodoMutation.mutate()} disabled={cesarTodoMutation.isPending}>
              {cesarTodoMutation.isPending ? 'Desasignando...' : 'Desasignar todo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
