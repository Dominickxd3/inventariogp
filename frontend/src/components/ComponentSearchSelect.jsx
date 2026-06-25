import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Search } from 'lucide-react';
import { Input } from '#components/ui/input.jsx';
import { Button } from '#components/ui/button.jsx';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '#components/ui/dialog.jsx';

export default function ComponentSearchSelect({ value, onChange, placeholder, filterByEquipo, label }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const queryKey = filterByEquipo
    ? ['componentes-equipo', filterByEquipo]
    : ['componentes-disponibles'];

  const { data: componentes } = useQuery({
    queryKey,
    queryFn: () => filterByEquipo
      ? api.equipos.componentes.list(filterByEquipo)
      : api.componentes.list({ estado: 'DISPONIBLE' }),
  });

  const filtrados = useMemo(() => {
    if (!componentes) return [];
    let lista = Array.isArray(componentes) ? componentes : componentes.rows || [];
    if (!filterByEquipo) {
      lista = lista.filter(c => c.Estado === 'DISPONIBLE');
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      lista = lista.filter(c =>
        (c.CodComponente || '').toLowerCase().includes(s) ||
        (c.DesComponente || '').toLowerCase().includes(s) ||
        (c.DesTipodeComponente || '').toLowerCase().includes(s) ||
        (c.Marca || '').toLowerCase().includes(s) ||
        (c.Modelo || '').toLowerCase().includes(s) ||
        (c.Serie || '').toLowerCase().includes(s) ||
        (c.Capacidad || '').toLowerCase().includes(s)
      );
    }
    return lista;
  }, [componentes, search, filterByEquipo]);

  const selected = value
    ? (Array.isArray(componentes) ? componentes : componentes?.rows || []).find(c => c.IdComponente === value)
    : null;

  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium">{label}</label>}
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start text-left font-normal"
        onClick={() => setOpen(true)}
      >
        {selected
          ? `${selected.CodComponente} - ${selected.DesTipodeComponente} · ${selected.Marca || ''} ${selected.Capacidad || ''}`
          : <span className="text-muted-foreground">{placeholder || 'Buscar componente...'}</span>
        }
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch(''); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{label || 'Seleccionar componente'}</DialogTitle>
          </DialogHeader>
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código, tipo, marca, modelo, serie, capacidad..."
              className="pl-8" autoFocus />
          </div>
          <div className="max-h-72 overflow-y-auto space-y-1">
            {filtrados.length > 0 ? filtrados.map((c) => (
              <div
                key={c.IdComponente}
                onClick={() => { onChange(c.IdComponente); setOpen(false); setSearch(''); }}
                className={`p-3 rounded-lg cursor-pointer text-sm border transition-colors
                  ${value === c.IdComponente ? 'bg-primary/10 border-primary' : 'hover:bg-muted border-transparent'}`}
              >
                <p className="font-medium">{c.CodComponente} - {c.DesTipodeComponente}</p>
                <p className="text-xs text-muted-foreground">
                  {c.DesComponente || 'Sin descripción'}
                  {c.Marca ? ` · ${c.Marca}` : ''}
                  {c.Modelo ? ` ${c.Modelo}` : ''}
                  {c.Capacidad ? ` · ${c.Capacidad}` : ''}
                  {c.Serie ? ` · S/N: ${c.Serie}` : ''}
                </p>
                {!filterByEquipo && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 mt-1 inline-block">
                    {c.Estado}
                  </span>
                )}
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {search ? 'Sin resultados' : 'No hay componentes disponibles'}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
