import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Swal from 'sweetalert2'
import { api } from '../lib/api'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { Button } from '#components/ui/button.jsx'
import { Input } from '#components/ui/input.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#components/ui/select.jsx'
import { Plus, Search, Pencil, Ban, RefreshCw } from 'lucide-react'

function request(path, options) {
  const token = localStorage.getItem('token')
  return fetch(`/api/catalogos${path}`, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options?.headers },
    ...options,
  }).then(async r => {
    const data = await r.json()
    if (!r.ok) throw new Error(data.error || 'Error')
    return data
  })
}

export default function CatalogosPage() {
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')

  const { data: catalogos } = useQuery({
    queryKey: ['catalogos'],
    queryFn: () => request(''),
  })

  const { data: valores, isLoading: valLoading } = useQuery({
    queryKey: ['catalogo-valores', selectedId],
    queryFn: () => request(`/${selectedId}/valores`),
    enabled: !!selectedId,
  })

  const createMut = useMutation({
    mutationFn: (nombre) => request(`/${selectedId}/valores`, { method: 'POST', body: JSON.stringify({ NombreValor: nombre }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['catalogo-valores', selectedId] }); qc.invalidateQueries({ queryKey: ['catalogos'] }); setNewName('') },
    onError: (e) => Swal.fire({ icon: 'warning', title: 'Atención', text: e.message }),
  })

  const updateMut = useMutation({
    mutationFn: ({ vid, nombre }) => request(`/${selectedId}/valores/${vid}`, { method: 'PUT', body: JSON.stringify({ NombreValor: nombre }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['catalogo-valores', selectedId] }); setEditId(null); setEditName('') },
    onError: (e) => Swal.fire({ icon: 'warning', title: 'Atención', text: e.message }),
  })

  const toggleMut = useMutation({
    mutationFn: ({ vid, activo }) => request(`/${selectedId}/valores/${vid}`, { method: 'PATCH', body: JSON.stringify({ Activo: activo }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalogo-valores', selectedId] }),
  })

  const filtered = (valores || []).filter(v => !search || v.NombreValor.toUpperCase().includes(search.toUpperCase()))

  return (
    <div className="space-y-6">
      <PageHeader title="Catálogos Maestros" description="Gestión de valores controlados (marcas, conectores, tipos de memoria, etc.)" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Catálogos</p>
          <div className="space-y-1">
            {(catalogos || []).map(c => (
              <button
                key={c.IdCatalogo}
                onClick={() => { setSelectedId(c.IdCatalogo); setSearch('') }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between ${
                  selectedId === c.IdCatalogo ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-muted'
                }`}
              >
                <span>{c.NombreCatalogo}</span>
                <span className="text-xs opacity-70">{c.TotalValores}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedId ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar..."
                    className="w-full h-9 rounded-lg border border-input bg-transparent pl-9 pr-3 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  value={newName}
                  onChange={e => setNewName(e.target.value.toUpperCase())}
                  placeholder="Nuevo valor..."
                  className="flex-1"
                />
                <Button onClick={() => { if (newName.trim()) createMut.mutate(newName.trim()) }} disabled={createMut.isPending}>
                  <Plus className="w-4 h-4 mr-1" /> Agregar
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                {valLoading ? (
                  <p className="p-4 text-sm text-muted-foreground">Cargando...</p>
                ) : filtered.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">Sin resultados</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium">ID</th>
                        <th className="text-left px-4 py-2 font-medium">Nombre</th>
                        <th className="text-left px-4 py-2 font-medium">Estado</th>
                        <th className="text-right px-4 py-2 font-medium w-[100px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(v => (
                        <tr key={v.IdValor} className="border-t">
                          <td className="px-4 py-2 text-muted-foreground">{v.IdValor}</td>
                          <td className="px-4 py-2">
                            {editId === v.IdValor ? (
                              <div className="flex gap-1">
                                <Input value={editName} onChange={e => setEditName(e.target.value.toUpperCase())} className="h-7 text-sm" />
                                <Button size="sm" onClick={() => updateMut.mutate({ vid: v.IdValor, nombre: editName })}>OK</Button>
                                <Button size="sm" variant="outline" onClick={() => setEditId(null)}>X</Button>
                              </div>
                            ) : (
                              <span className={v.Activo ? '' : 'line-through text-muted-foreground'}>{v.NombreValor}</span>
                            )}
                          </td>
                          <td className="px-4 py-2"><StatusBadge status={v.Activo ? 'ACTIVO' : 'INACTIVO'} /></td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex items-center justify-end gap-0.5">
                              <button onClick={() => { setEditId(v.IdValor); setEditName(v.NombreValor) }} className="p-1 hover:bg-muted rounded" title="Editar">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => toggleMut.mutate({ vid: v.IdValor, activo: !v.Activo })}
                                className="p-1 hover:bg-muted rounded"
                                title={v.Activo ? 'Desactivar' : 'Activar'}
                              >
                                {v.Activo ? <Ban className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              Seleccioná un catálogo de la izquierda
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
