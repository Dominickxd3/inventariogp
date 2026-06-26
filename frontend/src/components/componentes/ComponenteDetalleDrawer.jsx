import { Button } from '#components/ui/button.jsx';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '#components/ui/dialog.jsx';
import { EstadoBadge } from '../Badge';
import { AlertTriangle, Trash2, Package, CheckCircle2 } from 'lucide-react';
import { formatDate } from '../../lib/utils';

const TITULOS_TIMELINE = {
  VINCULADO_EQUIPO: 'Vinculado a equipo',
  DESVINCULADO_EQUIPO: 'Desvinculado de equipo',
  ASIGNADO_TRABAJADOR: 'Asignado a trabajador',
  CESADO_TRABAJADOR: 'Cesado de trabajador',
  INTERVENCION: 'Intervención técnica',
};

function CategoriaBadge({ categoria }) {
  const colors = {
    REPUESTO_TECNICO: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    ACCESORIO: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    CONSUMIBLE: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  };
  const label = {
    REPUESTO_TECNICO: 'Repuesto Técnico',
    ACCESORIO: 'Accesorio',
    CONSUMIBLE: 'Consumible',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[categoria] || 'bg-gray-100 text-gray-800'}`}>
      {label[categoria] || categoria || 'Otro'}
    </span>
  );
}

export default function ComponenteDetalleDrawer({
  open,
  onOpenChange,
  detalle,
  loading,
  error,
  onBaja,
}) {
  const loadingState = (
    <div className="py-8 text-center text-muted-foreground text-sm">
      Cargando detalle...
    </div>
  );

  const errorState = (
    <div className="py-8 text-center text-sm text-destructive">
      No se pudo cargar el detalle del componente.
    </div>
  );

  const c = detalle?.componente || detalle;
  const usoActual = detalle?.usoActual;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {loading ? (
            <DialogTitle>Cargando...</DialogTitle>
          ) : error || !c ? (
            <DialogTitle>Error</DialogTitle>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-base">{c.CodComponente}</DialogTitle>
                <EstadoBadge estado={c.Estado} />
                <CategoriaBadge categoria={c.Categoria} />
              </div>
              <DialogDescription>
                {c.TipoComponente || c.DesTipodeComponente}{c.DesComponente ? ` — ${c.DesComponente}` : ''}
              </DialogDescription>
            </>
          )}
        </DialogHeader>

        {loading ? loadingState : error || !c ? errorState : (
          <div className="space-y-5">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Datos técnicos</h4>
              <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo</span>
                  <span>{c.TipoComponente || c.DesTipodeComponente}</span>
                </div>
                {c.Marca && <div className="flex justify-between"><span className="text-muted-foreground">Marca</span><span>{c.Marca}</span></div>}
                {c.Modelo && <div className="flex justify-between"><span className="text-muted-foreground">Modelo</span><span>{c.Modelo}</span></div>}
                {c.Serie && <div className="flex justify-between"><span className="text-muted-foreground">Serie</span><span>{c.Serie}</span></div>}
                {c.Lote && <div className="flex justify-between"><span className="text-muted-foreground">Lote</span><span>{c.Lote}</span></div>}
                {c.Capacidad && <div className="flex justify-between"><span className="text-muted-foreground">Capacidad</span><span>{c.Capacidad}</span></div>}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado</span>
                  <EstadoBadge estado={c.Estado} />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Uso actual</h4>
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                {usoActual?.tipo === 'BAJA' || c.Estado === 'BAJA' ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Package className="w-4 h-4" />
                    <span>Componente dado de baja</span>
                  </div>
                ) : usoActual?.tipo === 'EQUIPO' ? (
                  <>
                    <p className="font-medium">Asignado a equipo</p>
                    <p className="text-xs text-muted-foreground">
                      {usoActual.equipo?.CodEquipo}{usoActual.equipo?.TipoEquipo ? ` (${usoActual.equipo.TipoEquipo})` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Desde: {formatDate(usoActual.equipo?.FechaInstalacion)}
                    </p>
                  </>
                ) : usoActual?.tipo === 'TRABAJADOR' ? (
                  <>
                    <p className="font-medium">Asignado a trabajador</p>
                    <p className="text-xs text-muted-foreground">
                      {usoActual.trabajador?.NombreTrabajador}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Desde: {formatDate(usoActual.trabajador?.FechaAsignacion)}
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Disponible para uso</span>
                  </div>
                )}
              </div>
            </div>

            {c.Obs && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Observaciones</h4>
                <p className="text-sm bg-muted/50 rounded-lg p-3">{c.Obs}</p>
              </div>
            )}

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Historial</h4>
              <div className="bg-muted/50 rounded-lg p-3 max-h-48 overflow-y-auto">
                {detalle?.timeline && detalle.timeline.length > 0 ? (
                  detalle.timeline.map((item, i) => (
                    <div key={`${item.tipo}-${i}`} className="flex gap-3 py-2 border-l-2 border-muted pl-4 ml-2 relative">
                      <div className="absolute -left-[9px] top-3 w-4 h-4 rounded-full bg-muted border-2 border-background" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">{item.fecha ? formatDate(item.fecha) : '-'}</p>
                        <p className="text-sm font-medium">{TITULOS_TIMELINE[item.tipo] || item.tipo}</p>
                        {item.descripcion && <p className="text-xs text-muted-foreground">{item.descripcion}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">Sin movimientos registrados</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              {c.Estado !== 'BAJA' && c.Estado !== 'ASIGNADO' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onBaja(c.IdComponente)}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Dar de baja
                </Button>
              )}
              {c.Estado === 'ASIGNADO' && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Debe cesar la asignación antes de dar de baja
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
