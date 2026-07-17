import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '#components/ui/button.jsx';
import { Skeleton } from '#components/ui/skeleton.jsx';
import { formatDate } from '../lib/utils';
import { Eye, Copy, Check, ArrowLeft } from 'lucide-react';

export default function EquipoScan() {
  const { codigo } = useParams();
  const navigate = useNavigate();
  const [equipo, setEquipo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!codigo) { setError('Código no proporcionado'); setLoading(false); return; }
    setLoading(true);
    setError('');
    api.equipos.scan(codigo)
      .then((data) => { setEquipo(data); setLoading(false); })
      .catch(() => { setError('Equipo no encontrado o código inválido'); setLoading(false); });
  }, [codigo]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Resultado del Escaneo</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Código escaneado: <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">{codigo}</code>
      </p>

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-xl" />
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/20 flex items-center justify-center">
            <Eye className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold text-destructive">Equipo no encontrado</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
          <div className="flex gap-2 justify-center pt-2">
            <Button variant="outline" onClick={() => navigate('/scan')}>
              Escanear otro QR
            </Button>
            <Button variant="outline" onClick={() => navigate('/equipos')}>
              Ir al inventario
            </Button>
          </div>
        </div>
      )}

      {equipo && (
        <div className="bg-card rounded-xl border border-border p-6 space-y-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">{equipo.CodEquipo}</h2>
              <p className="text-sm text-muted-foreground">{equipo.DesTipodeEquipo}</p>
            </div>
            <StatusBadge status={equipo.Estado} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-0.5">Código de barra</p>
              <p className="font-medium text-foreground break-all">{equipo.CodBarra || '—'}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-0.5">Fecha de registro</p>
              <p className="font-medium text-foreground">{formatDate(equipo.FecCreacion)}</p>
            </div>
          </div>

          {equipo.asignacion && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 border border-border/50">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Asignación actual</p>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Asignado a:</span> <span className="font-medium">{equipo.asignacion.TrabajadorNombre}</span></p>
                <p><span className="text-muted-foreground">Área:</span> <span className="font-medium">{equipo.asignacion.Area || '—'}</span></p>
                <p><span className="text-muted-foreground">Desde:</span> <span className="font-medium">{formatDate(equipo.asignacion.FecAsignacion)}</span></p>
              </div>
            </div>
          )}

          {equipo.componentes?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Componentes ({equipo.componentes.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {equipo.componentes.map((c) => (
                  <span key={c.IdComponente} className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                    {c.DesTipodeComponente}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={() => navigate(`/equipos/${equipo.IdMaeEquipo}`)} className="w-full">
              <Eye className="w-4 h-4 mr-2" /> Ver detalle completo
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
  );
}
