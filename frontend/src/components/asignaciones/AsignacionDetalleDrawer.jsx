import { Button } from '#components/ui/button.jsx';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '#components/ui/dialog.jsx';
import { EstadoBadge } from '../Badge';
import { Printer, XCircle, Monitor } from 'lucide-react';
import { formatDate } from '../../lib/utils';

function TimelineItem({ item }) {
  return (
    <div className="flex gap-3 py-2 border-l-2 border-muted pl-4 ml-2 relative">
      <div className="absolute -left-[9px] top-3 w-4 h-4 rounded-full bg-muted border-2 border-background" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{formatDate(item.fecha)}</p>
        <p className="text-sm font-medium">{item.titulo}</p>
        <p className="text-xs text-muted-foreground">{item.descripcion}</p>
      </div>
    </div>
  );
}

export default function AsignacionDetalleDrawer({
  open,
  onOpenChange,
  detalle,
  loading,
  error,
  onVerActa,
  onCesar,
  navigate,
}) {
  const loadingState = (
    <div className="py-8 text-center text-muted-foreground text-sm">
      Cargando detalle...
    </div>
  );

  const errorState = (
    <div className="py-8 text-center text-sm text-destructive">
      No se pudo cargar el detalle de la asignación.
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {loading ? (
            <DialogTitle>Cargando...</DialogTitle>
          ) : error || !detalle ? (
            <DialogTitle>Error</DialogTitle>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base">
                  Asignación {detalle.equipo.CodEquipo}
                </DialogTitle>
                <EstadoBadge estado={detalle.asignacion.Estado} />
              </div>
              <DialogDescription>
                Asignado el: {formatDate(detalle.asignacion.FecAsignacion)}
              </DialogDescription>
            </>
          )}
        </DialogHeader>

        {loading ? loadingState : error || !detalle ? errorState : (
          <div className="space-y-5">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Resumen</h4>
              <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado</span>
                  <EstadoBadge estado={detalle.asignacion.Estado} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Asignación</span>
                  <span>{formatDate(detalle.asignacion.FecAsignacion)}</span>
                </div>
                {detalle.asignacion.FecCese && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cese</span>
                    <span>{formatDate(detalle.asignacion.FecCese)}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Trabajador</h4>
              <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-sm">
                {detalle.trabajador.NombreTrabajador ? (
                  <>
                    <p className="font-medium">{detalle.trabajador.NombreTrabajador}</p>
                    {detalle.trabajador.DNI && <p className="text-muted-foreground text-xs">DNI: {detalle.trabajador.DNI}</p>}
                    {detalle.trabajador.Area && <p className="text-muted-foreground text-xs">Área: {detalle.trabajador.Area}</p>}
                    {detalle.trabajador.Cargo && <p className="text-muted-foreground text-xs">Cargo: {detalle.trabajador.Cargo}</p>}
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground">Trabajador no encontrado</p>
                    <p className="text-xs text-muted-foreground">ID: {detalle.trabajador.IdReferente}</p>
                  </>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Equipo</h4>
              <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-sm">
                <p>
                  <button
                    onClick={() => navigate(`/equipos/${detalle.equipo.IdMaeEquipo}`)}
                    className="font-medium text-primary hover:underline"
                  >
                    {detalle.equipo.CodEquipo}
                  </button>
                </p>
                {detalle.equipo.TipoEquipo && <p className="text-muted-foreground text-xs">Tipo: {detalle.equipo.TipoEquipo}</p>}
                {detalle.equipo.CodBarra && <p className="text-muted-foreground text-xs">Código barra: {detalle.equipo.CodBarra}</p>}
                <p className="text-xs">
                  <span className="text-muted-foreground">Estado actual: </span>
                  <EstadoBadge estado={detalle.equipo.EstadoActual} />
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Accesorios entregados
              </h4>
              {detalle.accesorios.length > 0 ? (
                <div className="space-y-1.5">
                  {detalle.accesorios.map((a) => (
                    <div key={a.IdComponente} className="bg-muted/50 rounded-lg p-2.5 text-sm">
                      <p className="font-medium text-xs">{a.CodComponente}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.DesComponente || a.TipoComponente}
                        {a.Marca ? ` / ${a.Marca}` : ''}
                        {a.Modelo ? ` / ${a.Modelo}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                  Sin accesorios entregados
                </p>
              )}
            </div>

            {detalle.timeline.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Historial</h4>
                <div className="bg-muted/50 rounded-lg p-3">
                  {detalle.timeline.map((item, i) => (
                    <TimelineItem key={i} item={item} />
                  ))}
                </div>
              </div>
            )}

            {detalle.asignacion.Obs && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Observaciones</h4>
                <p className="text-sm bg-muted/50 rounded-lg p-3">{detalle.asignacion.Obs}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => onVerActa(detalle.asignacion.IdMovEquipoAsignacion)}>
                <Printer className="w-3.5 h-3.5" /> Ver acta
              </Button>
              {detalle.asignacion.Estado === 'VIGENTE' && (
                <Button variant="destructive" size="sm" onClick={() => onCesar(detalle.asignacion.IdMovEquipoAsignacion, detalle.equipo, detalle.trabajador)}>
                  <XCircle className="w-3.5 h-3.5" /> Cesar asignación
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => navigate(`/equipos/${detalle.equipo.IdMaeEquipo}`)}>
                <Monitor className="w-3.5 h-3.5" /> Ver equipo
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
