import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Swal from 'sweetalert2'
import { api } from '../lib/api'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { Button } from '#components/ui/button.jsx'
import { Input } from '#components/ui/input.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '#components/ui/dialog.jsx'
import { Plus, Search, Pencil, Ban, RefreshCw, Download, FolderPlus, ChevronLeft, ChevronRight } from 'lucide-react'

export default function CatalogosPage() {
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [catOpen, setCatOpen] = useState(false)
  const [catEdit, setCatEdit] = useState(null)
  const [catNombre, setCatNombre] = useState('')
  const [catDesc, setCatDesc] = useState('')

  const { data: catalogos } = useQuery({
    queryKey: ['catalogos'],
    queryFn: api.catalogos.list,
  })

  const { data: valoresData, isLoading: valLoading } = useQuery({
    queryKey: ['catalogo-valores', selectedId, search, page, pageSize],
    queryFn: () => api.catalogos.valores(selectedId, { q: search, page, pageSize }),
    enabled: !!selectedId,
  })

  const createValorMut = useMutation({
    mutationFn: (nombre) => api.catalogos.createValor(selectedId, nombre),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['catalogo-valores', selectedId] }); qc.invalidateQueries({ queryKey: ['catalogos'] }); setNewName('') },
    onError: (e) => Swal.fire({ icon: 'warning', title: 'Atención', text: e.message }),
  })

  const updateValorMut = useMutation({
    mutationFn: ({ vid, nombre }) => api.catalogos.updateValor(selectedId, vid, nombre),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['catalogo-valores', selectedId] }); setEditId(null); setEditName('') },
    onError: (e) => Swal.fire({ icon: 'warning', title: 'Atención', text: e.message }),
  })

  const toggleValorMut = useMutation({
    mutationFn: ({ vid, activo }) => api.catalogos.toggleValor(selectedId, vid, activo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalogo-valores', selectedId] }),
  })

  const saveCatMut = useMutation({
    mutationFn: () => {
      if (catEdit?.IdCatalogo) return api.catalogos.update(catEdit.IdCatalogo, { NombreCatalogo: catNombre, Descripcion: catDesc })
      return api.catalogos.create({ NombreCatalogo: catNombre, Descripcion: catDesc })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalogos'] })
      setCatOpen(false); setCatEdit(null); setCatNombre(''); setCatDesc('')
      Swal.fire({ icon: 'success', title: 'Catálogo guardado', timer: 1200, showConfirmButton: false })
    },
    onError: (e) => Swal.fire({ icon: 'warning', title: 'Atención', text: e.message }),
  })

  const toggleCatMut = useMutation({
    mutationFn: ({ id, activo }) => api.catalogos.toggle(id, activo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalogos'] }),
  })

  const valores = valoresData?.rows || []
  const totalPages = valoresData?.totalPages || 1
  const total = valoresData?.total || 0
  const catalogoSel = catalogos?.find(c => c.IdCatalogo === selectedId)

  const exportarCSV = () => {
    if (!valores.length) return
    const lines = [
      ['ID', 'Nombre', 'Estado', 'Referencias'],
      ...valores.map(v => [v.IdValor, `"${v.NombreValor}"`, v.Activo ? 'ACTIVO' : 'INACTIVO', v.Referencias]),
    ]
    const csv = lines.map(l => l.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${catalogoSel?.NombreCatalogo || 'catalogo'}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Catálogos Maestros" description="Gestión de valores controlados (marcas, conectores, tipos de memoria, etc.)">
        <Button onClick={() => { setCatEdit(null); setCatNombre(''); setCatDesc(''); setCatOpen(true) }}>
          <FolderPlus className="w-4 h-4" /> Nuevo catálogo
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Catálogos</p>
          <div className="space-y-1">
            {(catalogos || []).map(c => (
              <div
                key={c.IdCatalogo}
                className={`group w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between items-center gap-1 ${
                  selectedId === c.IdCatalogo ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-muted'
                }`}
              >
                <button className="flex-1 text-left min-w-0" onClick={() => { setSelectedId(c.IdCatalogo); setSearch(''); setPage(1) }}>
                  <span className={`block truncate ${c.Activo ? '' : 'line-through opacity-60'}`}>{c.NombreCatalogo}</span>
                  <span className={`block text-xs ${selectedId === c.IdCatalogo ? 'opacity-80' : 'text-muted-foreground'}`}>
                    {c.TotalValores} activo(s){c.TotalInactivos ? ` · ${c.TotalInactivos} inactivo(s)` : ''}
                  </span>
                </button>
                <div className={`flex shrink-0 gap-0.5 ${selectedId === c.IdCatalogo ? 'opacity-90' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                  <button
                    onClick={() => { setCatEdit(c); setCatNombre(c.NombreCatalogo); setCatDesc(c.Descripcion || ''); setCatOpen(true) }}
                    className="p-1 hover:bg-black/10 rounded" title="Editar catálogo"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleCatMut.mutate({ id: c.IdCatalogo, activo: !c.Activo })}
                    className="p-1 hover:bg-black/10 rounded" title={c.Activo ? 'Desactivar catálogo' : 'Activar catálogo'}
                  >
                    {c.Activo ? <Ban className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedId ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1) }}
                    placeholder="Buscar..."
                    className="w-full h-9 rounded-lg border border-input bg-transparent pl-9 pr-3 text-sm"
                  />
                </div>
                <Button variant="outline" onClick={exportarCSV} disabled={!valores.length} className="shrink-0">
                  <Download className="w-4 h-4" /> CSV
                </Button>
              </div>

              {catalogoSel?.Descripcion && (
                <p className="text-xs text-muted-foreground">{catalogoSel.Descripcion}</p>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={newName}
                  onChange={e => setNewName(e.target.value.toUpperCase())}
                  placeholder="Nuevo valor..."
                  onKeyDown={e => { if (e.key === 'Enter' && newName.trim()) createValorMut.mutate(newName.trim()) }}
                  className="flex-1"
                />
                <Button onClick={() => { if (newName.trim()) createValorMut.mutate(newName.trim()) }} disabled={createValorMut.isPending} className="shrink-0">
                  <Plus className="w-4 h-4 mr-1" /> Agregar
                </Button>
              </div>

              {/* Vista tabla (>= sm) */}
              <div className="hidden sm:block border rounded-lg overflow-x-auto">
                {valLoading ? (
                  <p className="p-4 text-sm text-muted-foreground">Cargando...</p>
                ) : valores.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">Sin resultados</p>
                ) : (
                  <table className="w-full text-sm min-w-[520px]">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium">ID</th>
                        <th className="text-left px-4 py-2 font-medium">Nombre</th>
                        <th className="text-left px-4 py-2 font-medium">Estado</th>
                        <th className="text-left px-4 py-2 font-medium">Usos</th>
                        <th className="text-right px-4 py-2 font-medium w-[100px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {valores.map(v => (
                        <tr key={v.IdValor} className="border-t">
                          <td className="px-4 py-2 text-muted-foreground">{v.IdValor}</td>
                          <td className="px-4 py-2">
                            {editId === v.IdValor ? (
                              <div className="flex gap-1">
                                <Input value={editName} onChange={e => setEditName(e.target.value.toUpperCase())} className="h-7 text-sm" />
                                <Button size="sm" onClick={() => updateValorMut.mutate({ vid: v.IdValor, nombre: editName })}>OK</Button>
                                <Button size="sm" variant="outline" onClick={() => setEditId(null)}>X</Button>
                              </div>
                            ) : (
                              <span className={v.Activo ? '' : 'line-through text-muted-foreground'}>{v.NombreValor}</span>
                            )}
                          </td>
                          <td className="px-4 py-2"><StatusBadge status={v.Activo ? 'ACTIVO' : 'INACTIVO'} /></td>
                          <td className="px-4 py-2">
                            {v.Referencias > 0 ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-xs">{v.Referencias}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex items-center justify-end gap-0.5">
                              <button onClick={() => { setEditId(v.IdValor); setEditName(v.NombreValor) }} className="p-1 hover:bg-muted rounded" title="Editar">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => toggleValorMut.mutate({ vid: v.IdValor, activo: !v.Activo })}
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

              {/* Vista móvil (tarjetas) */}
              <div className="sm:hidden space-y-2">
                {valLoading ? (
                  <p className="p-4 text-sm text-muted-foreground">Cargando...</p>
                ) : valores.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">Sin resultados</p>
                ) : (
                  valores.map(v => (
                    <div key={v.IdValor} className="border rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        {editId === v.IdValor ? (
                          <div className="flex gap-1 flex-1">
                            <Input value={editName} onChange={e => setEditName(e.target.value.toUpperCase())} className="h-7 text-sm flex-1" />
                            <Button size="sm" onClick={() => updateValorMut.mutate({ vid: v.IdValor, nombre: editName })}>OK</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditId(null)}>X</Button>
                          </div>
                        ) : (
                          <span className={`text-sm font-medium ${v.Activo ? '' : 'line-through text-muted-foreground'}`}>{v.NombreValor}</span>
                        )}
                        <div className="flex shrink-0 gap-0.5">
                          <button onClick={() => { setEditId(v.IdValor); setEditName(v.NombreValor) }} className="p-1 hover:bg-muted rounded" title="Editar">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleValorMut.mutate({ vid: v.IdValor, activo: !v.Activo })}
                            className="p-1 hover:bg-muted rounded"
                            title={v.Activo ? 'Desactivar' : 'Activar'}
                          >
                            {v.Activo ? <Ban className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <StatusBadge status={v.Activo ? 'ACTIVO' : 'INACTIVO'} />
                        <span>ID {v.IdValor}</span>
                        {v.Referencias > 0 && <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">{v.Referencias} uso(s)</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Paginación */}
              {total > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
                  <span>{total} valor(es) · página {page} de {totalPages}</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={pageSize}
                      onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
                      className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs"
                    >
                      {[25, 50, 100].map(n => <option key={n} value={n}>{n} / página</option>)}
                    </select>
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                      Sig <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              Seleccioná un catálogo de la izquierda
            </div>
          )}
        </div>
      </div>

      {/* Dialog crear/editar catálogo */}
      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent className="sm:max-w-md" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
          <DialogHeader>
            <DialogTitle>{catEdit?.IdCatalogo ? 'Editar catálogo' : 'Nuevo catálogo'}</DialogTitle>
            <DialogDescription>Los catálogos agrupan valores controlados (marcas, conectores, capacidades, etc.).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nombre <span className="text-destructive">*</span></label>
              <Input value={catNombre} onChange={e => setCatNombre(e.target.value.toUpperCase())} placeholder="Ej: MARCAS" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Descripción</label>
              <Input value={catDesc} onChange={e => setCatDesc(e.target.value)} placeholder="Opcional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatOpen(false)}>Cancelar</Button>
            <Button onClick={() => { if (catNombre.trim()) saveCatMut.mutate() }} disabled={!catNombre.trim() || saveCatMut.isPending}>
              Guardar catálogo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}