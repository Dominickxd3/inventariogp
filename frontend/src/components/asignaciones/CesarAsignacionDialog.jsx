import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import Swal from 'sweetalert2'
import { Button } from '#components/ui/button.jsx'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '#components/ui/dialog.jsx'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '#components/ui/select.jsx'
import { AlertTriangle, RefreshCw } from 'lucide-react'

const MOTIVOS = [
  { value: 'DEVOLUCION', label: 'Devolución normal', estado: 'DISPONIBLE' },
  { value: 'RENUNCIA', label: 'Renuncia del trabajador', estado: 'DISPONIBLE' },
  { value: 'CAMBIO', label: 'Cambio de equipo', estado: 'DISPONIBLE' },
  { value: 'TRASLADO', label: 'Traslado del trabajador', estado: 'DISPONIBLE' },
  { value: 'DANADO', label: 'Equipo dañado', estado: 'MANTENIMIENTO' },
  { value: 'MANTENIMIENTO', label: 'Pasa a mantenimiento', estado: 'MANTENIMIENTO' },
  { value: 'PERDIDO', label: 'Equipo perdido', estado: 'BAJA' },
  { value: 'ROBADO', label: 'Equipo robado', estado: 'BAJA' },
  { value: 'EXTRAVIADO', label: 'Equipo extraviado', estado: 'BAJA' },
]

const ACC_OPTIONS = [
  { value: 'DISPONIBLE', label: 'Devolver a disponible' },
  { value: 'MANTENER', label: 'Mantener asignado al trabajador' },
  { value: 'BAJA', label: 'Dar de baja' },
  { value: 'PERDIDO', label: 'Marcar como perdido/dañado' },
]

export default function CesarAsignacionDialog({
  open,
  onOpenChange,
  cesarTarget,
  onSuccess,
}) {
  const [motivo, setMotivo] = useState('')
  const [obs, setObs] = useState('')
  const [accActions, setAccActions] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const {
    data: accs,
    isLoading: accsLoading,
    isError: accsError,
    error: accsErrorObj,
    refetch: refetchAccs,
  } = useQuery({
    queryKey: ['cesar-accesorios', cesarTarget?.IdMovEquipoAsignacion],
    queryFn: () => api.asignaciones.linkedAccs(cesarTarget?.IdMovEquipoAsignacion),
    enabled: !!cesarTarget && open,
  })

  useEffect(() => {
    if (accs?.length) {
      setAccActions(accs.map((a) => ({
        idMovAccesorio: a.IdMovAccesorio,
        accion: 'DISPONIBLE',
      })))
    } else {
      setAccActions([])
    }
  }, [accs])

  function handleOpenChange(v) {
    if (!v) {
      setMotivo('')
      setObs('')
      setAccActions([])
    }
    onOpenChange(v)
  }

  function handleAccionChange(idMovAccesorio, accion) {
    setAccActions((prev) => {
      const exists = prev.find((a) => a.idMovAccesorio === idMovAccesorio)
      if (exists) {
        return prev.map((a) =>
          a.idMovAccesorio === idMovAccesorio ? { ...a, accion } : a
        )
      }
      return [...prev, { idMovAccesorio, accion }]
    })
  }

  async function handleSubmit() {
    if (!motivo) {
      Swal.fire({ icon: 'warning', title: 'Motivo requerido', text: 'Selecciona el motivo del cese' })
      return
    }

    if (accs?.length && accActions.length !== accs.length) {
      Swal.fire({ icon: 'warning', title: 'Acciones incompletas', text: 'Debes definir una acción para cada accesorio antes de finalizar.' })
      return
    }

    const motivoElegido = MOTIVOS.find((m) => m.value === motivo)
    const estadoDestino = motivoElegido?.estado || 'DISPONIBLE'

    const hayAcc = accs?.length > 0
    const resumenAcc = hayAcc
      ? accs.map((a) => {
          const act = accActions.find((x) => x.idMovAccesorio === a.IdMovAccesorio)
          const opt = ACC_OPTIONS.find((o) => o.value === act?.accion)
          return `  • ${a.CodComponente || `ID ${a.IdMovAccesorio}`} → ${opt?.label || act?.accion || 'DISPONIBLE'}`
        }).join('\n')
      : '  Sin accesorios vinculados.'

    const confirm = await Swal.fire({
      icon: 'question',
      title: 'Confirmar cese',
      html: `<div style="text-align:left;font-size:13px;">
        <p><strong>Equipo:</strong> ${cesarTarget.CodEquipo}</p>
        <p><strong>Motivo:</strong> ${motivoElegido?.label}</p>
        <p><strong>Estado final del equipo:</strong> ${estadoDestino}</p>
        ${hayAcc ? `<p style="margin-top:8px;"><strong>Accesorios:</strong></p><pre style="font-size:12px;line-height:1.5;">${resumenAcc}</pre>` : ''}
      </div>`,
      showCancelButton: true,
      confirmButtonText: 'Sí, finalizar',
      cancelButtonText: 'Cancelar',
    })
    if (!confirm.isConfirmed) return

    setSubmitting(true)
    try {
      await api.asignaciones.cesar(cesarTarget.IdMovEquipoAsignacion, accActions.length ? accActions : undefined, {
        Motivo: motivo,
        Obs: obs.trim() || undefined,
      })
      Swal.fire({ icon: 'success', title: 'Asignación finalizada', text: 'El cambio de estado se registró correctamente', timer: 2000, showConfirmButton: false })
      onSuccess?.()
      handleOpenChange(false)
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error al cesar', text: e.message || 'No se pudo cesar la asignación' })
    } finally {
      setSubmitting(false)
    }
  }

  const motivoElegido = MOTIVOS.find((m) => m.value === motivo)
  const estadoDestino = motivoElegido?.estado || 'DISPONIBLE'

  const hasIncompleteActions = accs?.length > 0 && accActions.length !== accs.length

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Finalizar asignación</DialogTitle>
          <DialogDescription>
            {cesarTarget ? (
              <>
                Cesando <strong>{cesarTarget.CodEquipo}</strong>
                {cesarTarget.TrabajadorNombre ? ` de ${cesarTarget.TrabajadorNombre}` : ''}
              </>
            ) : (
              'Selecciona el motivo para finalizar la asignación'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Motivo <span className="text-destructive">*</span>
            </label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar motivo..." />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {motivo && (
              <p className="text-xs text-muted-foreground mt-1">
                El equipo pasará a estado <strong>{estadoDestino}</strong>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Observación <span className="text-muted-foreground text-xs">(opcional)</span>
            </label>
            <textarea
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              className="w-full min-h-[60px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 placeholder:text-muted-foreground"
              placeholder="Detalles adicionales..."
              maxLength={500}
            />
          </div>

          {accsLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <div className="w-3 h-3 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin" />
              Cargando accesorios...
            </div>
          )}

          {accsError && (
            <div className="rounded-lg border border-destructive/30 p-3">
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>No se pudieron cargar los accesorios: {accsErrorObj?.message || 'Error de conexión'}</span>
              </div>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => refetchAccs()}>
                <RefreshCw className="w-3 h-3 mr-1" /> Reintentar
              </Button>
            </div>
          )}

          {!accsLoading && !accsError && accs?.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              <p className="text-sm font-medium">Accesorios vinculados</p>
              {accs.map((acc) => {
                const action = accActions.find((a) => a.idMovAccesorio === acc.IdMovAccesorio)
                return (
                  <div key={acc.IdMovAccesorio} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 text-muted-foreground">{acc.CodComponente || `ID ${acc.IdMovAccesorio}`}</span>
                    <Select
                      value={action?.accion || 'DISPONIBLE'}
                      onValueChange={(v) => handleAccionChange(acc.IdMovAccesorio, v)}
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
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={submitting || !motivo || accsLoading || hasIncompleteActions}
          >
            {submitting ? 'Finalizando...' : 'Finalizar asignación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
