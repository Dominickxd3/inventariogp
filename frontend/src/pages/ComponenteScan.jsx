import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { StatusBadge } from '../components/StatusBadge'
import { Button } from '#components/ui/button.jsx'
import { Skeleton } from '#components/ui/skeleton.jsx'
import { formatDate } from '../lib/utils'
import { Eye, Copy, Check, ArrowLeft, Cpu } from 'lucide-react'

export default function ComponenteScan() {
  const { codigo } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!codigo) { setError('Código no proporcionado'); setLoading(false); return }
    setLoading(true)
    api.componentes.detalle(undefined).constructor.name // placeholder
    fetch(`/api/componentes/scan/${codigo}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setData(d); setLoading(false) })
      .catch(() => { setError('Componente no encontrado o código inválido'); setLoading(false) })
  }, [codigo])

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const c = data

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Componente Escaneado</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Código: <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">{codigo}</code>
      </p>

      {loading && <Skeleton className="h-48 rounded-xl" />}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center space-y-3">
          <Cpu className="w-8 h-8 text-destructive mx-auto" />
          <h2 className="text-lg font-semibold text-destructive">No encontrado</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      )}

      {c && (
        <div className="bg-card rounded-xl border border-border p-6 space-y-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">{c.CodComponente}</h2>
              <p className="text-sm text-muted-foreground">{c.DesTipodeComponente || c.TipoComponente}</p>
            </div>
            <StatusBadge status={c.Estado} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {c.Marca && <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-0.5">Marca</p>
              <p className="font-medium">{c.Marca}</p>
            </div>}
            {c.Modelo && <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-0.5">Modelo</p>
              <p className="font-medium">{c.Modelo}</p>
            </div>}
            {c.Serie && <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-0.5">Serie</p>
              <p className="font-medium">{c.Serie}</p>
            </div>}
            {c.Categoria && <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-0.5">Categoría</p>
              <p className="font-medium">{c.Categoria === 'REPUESTO_TECNICO' ? 'Repuesto Técnico' : c.Categoria === 'ACCESORIO' ? 'Accesorio' : c.Categoria}</p>
            </div>}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={() => navigate(`/componentes`)} className="w-full">
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
