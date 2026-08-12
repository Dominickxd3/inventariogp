import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { StatusBadge } from '../components/StatusBadge'
import { Button } from '#components/ui/button.jsx'
import { Skeleton } from '#components/ui/skeleton.jsx'
import { formatDate } from '../lib/utils'
import { Eye, Copy, Check, ArrowLeft, Cpu } from 'lucide-react'

const CATEGORIA_LABEL = {
  REPUESTO_TECNICO: 'Repuesto Técnico',
  ACCESORIO: 'Accesorio',
  CONSUMIBLE: 'Consumible',
}

export default function ComponenteScan() {
  const { codigo } = useParams()
  const navigate = useNavigate()
  const [detalle, setDetalle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!codigo) { setError('Código no proporcionado'); setLoading(false); return }
    setLoading(true)
    fetch(`/api/componentes/scan/${codigo}`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setDetalle(d); setLoading(false) })
      .catch(() => { setError('Componente no encontrado o código inválido'); setLoading(false) })
  }, [codigo])

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const c = detalle?.componente
  const uso = detalle?.usoActual
  const caracteristicas = detalle?.caracteristicas || []
  const timeline = detalle?.timeline || []

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Componente Escaneado</h1>
      </div>

      {loading && <Skeleton className="h-48 rounded-xl" />}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center space-y-3">
          <Cpu className="w-8 h-8 text-destructive mx-auto" />
          <h2 className="text-lg font-semibold text-destructive">No encontrado</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      )}

      {c && (
        <div className="space-y-5">
          <div className="bg-card rounded-xl border border-border p-6 space-y-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">{c.CodComponente}</h2>
                <p className="text-sm text-muted-foreground">{c.DesComponente}</p>
              </div>
              <StatusBadge status={c.Estado} />
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Código interno</span><span className="font-medium">{c.CodComponente}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Categoría</span><span className="font-medium">{CATEGORIA_LABEL[c.Categoria] || c.Categoria}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tipo</span><span className="font-medium">{c.TipoComponente || c.DesTipodeComponente}</span></div>
              {c.Marca && <div className="flex justify-between"><span className="text-muted-foreground">Marca</span><span className="font-medium">{c.Marca}</span></div>}
              {c.Modelo && <div className="flex justify-between"><span className="text-muted-foreground">Modelo</span><span className="font-medium">{c.Modelo}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Serie</span><span className="font-medium">{c.Serie || 'Sin serie'}</span></div>
            </div>
          </div>

          {caracteristicas.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-5 space-y-2 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Características</p>
              <div className="space-y-1 text-sm">
                {caracteristicas.map(car => (
                  <div key={car.IdCaracteristica} className="flex justify-between">
                    <span className="text-muted-foreground">{car.Etiqueta || car.Clave}</span>
                    <span className="font-medium">{car.Valor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-card rounded-xl border border-border p-5 space-y-2 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Uso actual</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Estado</span><StatusBadge status={c.Estado} /></div>
              {uso?.tipo === 'EQUIPO' ? (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">Instalado en</span><span className="font-medium">{uso.equipo?.CodEquipo}</span></div>
                  {uso.equipo?.TipoEquipo && <div className="flex justify-between"><span className="text-muted-foreground">Tipo equipo</span><span className="font-medium">{uso.equipo.TipoEquipo}</span></div>}
                </>
              ) : uso?.tipo === 'TRABAJADOR' ? (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">Asignado a</span><span className="font-medium">{uso.trabajador?.NombreTrabajador}</span></div>
                </>
              ) : null}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-5 space-y-2 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Historial</p>
            {timeline.length > 0 ? (
              <div className="space-y-2 text-sm">
                {timeline.map((t, i) => (
                  <div key={i} className="flex justify-between gap-3">
                    <span className="text-muted-foreground whitespace-nowrap">{formatDate(t.fecha)}</span>
                    <span className="font-medium text-right">{t.descripcion || t.titulo}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin movimientos</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate('/componentes')} className="w-full">
              <Eye className="w-4 h-4 mr-2" /> Ver en inventario
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/scan')} className="flex-1">
                Escanear otro QR
              </Button>
              <Button variant="outline" size="icon" onClick={handleCopyUrl} title="Copiar URL">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
