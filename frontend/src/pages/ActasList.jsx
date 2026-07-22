import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { PageHeader } from '../components/PageHeader'
import DataTable from '../components/DataTable'
import { Button } from '#components/ui/button.jsx'
import Swal from 'sweetalert2'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '#components/ui/dialog.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#components/ui/select.jsx'
import { AlertTriangle, FileText, Link, XCircle } from 'lucide-react'

const ESTADO_COLORS = {
  PENDIENTE_FIRMA: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  FIRMADA: 'text-green-600 bg-green-50 border-green-200',
  VENCIDA: 'text-red-600 bg-red-50 border-red-200',
  ANULADA: 'text-gray-500 bg-gray-100 border-gray-200',
}

const ESTADO_LABELS = {
  PENDIENTE_FIRMA: 'Pendiente de firma',
  FIRMADA: 'Firmada',
  VENCIDA: 'Vencida',
  ANULADA: 'Anulada',
}

function ActaStatusBadge({ estado }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ESTADO_COLORS[estado] || ''}`}>
      {ESTADO_LABELS[estado] || estado}
    </span>
  )
}

export default function ActasList() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [anularDialog, setAnularDialog] = useState(null)
  const [motivoAnula, setMotivoAnula] = useState('')
  const queryClient = useQueryClient()

  const params = { page, pageSize }
  if (estadoFiltro) params.estado = estadoFiltro
  if (tipoFiltro) params.tipoActa = tipoFiltro

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['actas', params],
    queryFn: () => api.actas.list(params),
  })

  async function handleRegenerarEnlace(idActa) {
    try {
      const result = await api.actas.regenerarEnlace(idActa)
      await Swal.fire({
        icon: 'success',
        title: 'Enlace generado',
        html: `<div class="text-left text-sm"><p>Nuevo enlace:</p><input type="text" readonly value="${result.urlFirma}" class="w-full mt-2 p-2 border rounded text-xs" onclick="this.select()" /></div>`,
        confirmButtonText: 'Cerrar',
      })
      queryClient.invalidateQueries({ queryKey: ['actas'] })
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: e.message })
    }
  }

  async function handleVerPdf(idActa) {
    const pdfWindow = window.open('about:blank', '_blank')
    if (!pdfWindow) {
      Swal.fire({ icon: 'error', title: 'No se pudo abrir el acta', text: 'El navegador bloqueó la apertura del documento. Permite ventanas emergentes e intenta nuevamente.' })
      return
    }
    pdfWindow.document.write('Cargando documento...')
    pdfWindow.document.title = 'Acta'
    try {
      const blob = await api.actas.getPdf(idActa)
      if (!blob || blob.size === 0 || blob.type !== 'application/pdf') {
        pdfWindow.close()
        throw new Error('El archivo PDF no es válido')
      }
      const objectUrl = URL.createObjectURL(blob)
      pdfWindow.location.replace(objectUrl)
      window.setTimeout(() => { URL.revokeObjectURL(objectUrl) }, 300000)
    } catch (error) {
      if (!pdfWindow.closed) pdfWindow.close()
      Swal.fire({ icon: 'error', title: 'No se pudo abrir el acta', text: error.message || 'Ocurrió un error al obtener el documento.' })
    }
  }

  async function handleAnular() {
    if (!anularDialog || !motivoAnula || motivoAnula.length < 10) return
    try {
      await api.actas.anular(anularDialog.IdActa, motivoAnula)
      Swal.fire({ icon: 'success', title: 'Acta anulada', timer: 2000, showConfirmButton: false })
      setAnularDialog(null)
      setMotivoAnula('')
      queryClient.invalidateQueries({ queryKey: ['actas'] })
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: e.message })
    }
  }

  const columns = [
    { key: 'CodigoActa', label: 'Código' },
    {
      key: 'TipoActa',
      label: 'Tipo',
      render: (row) => row.TipoActa === 'ENTREGA' ? 'Entrega' : 'Devolución',
    },
    {
      key: 'EstadoActa',
      label: 'Estado',
      render: (row) => <ActaStatusBadge estado={row.EstadoActa} />,
    },
    { key: 'TrabajadorNombre', label: 'Trabajador' },
    { key: 'CodEquipo', label: 'Equipo' },
    {
      key: 'FechaGeneracion',
      label: 'Generación',
      render: (row) => row.FechaGeneracion ? new Date(row.FechaGeneracion).toLocaleDateString('es-PE') : '—',
    },
    {
      key: 'FechaFirma',
      label: 'Firma',
      render: (row) => row.FechaFirma ? new Date(row.FechaFirma).toLocaleDateString('es-PE') : '—',
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (row) => (
        <div className="flex gap-1">
          {row.PdfFirmadoRuta ? (
            <Button variant="ghost" size="icon-sm" onClick={() => handleVerPdf(row.IdActa)} title="Ver PDF">
              <FileText className="w-4 h-4" />
            </Button>
          ) : row.PdfOriginalRuta ? (
            <Button variant="ghost" size="icon-sm" onClick={() => handleVerPdf(row.IdActa)} title="Ver PDF original">
              <FileText className="w-4 h-4" />
            </Button>
          ) : null}
          {(row.EstadoActa === 'PENDIENTE_FIRMA' || row.EstadoActa === 'VENCIDA') && (
            <Button variant="ghost" size="icon-sm" onClick={() => handleRegenerarEnlace(row.IdActa)} title="Generar nuevo enlace">
              <Link className="w-4 h-4" />
            </Button>
          )}
          {row.EstadoActa !== 'FIRMADA' && row.EstadoActa !== 'ANULADA' && (
            <Button variant="ghost" size="icon-sm" onClick={() => setAnularDialog(row)} title="Anular acta">
              <XCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Actas Electrónicas" description="Gestión de actas de entrega y devolución" />

      <div className="flex flex-wrap items-center gap-3">
        <Select value={tipoFiltro} onValueChange={(v) => { setTipoFiltro(v); setPage(1) }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los tipos</SelectItem>
            <SelectItem value="ENTREGA">Entrega</SelectItem>
            <SelectItem value="DEVOLUCION">Devolución</SelectItem>
          </SelectContent>
        </Select>
        <Select value={estadoFiltro} onValueChange={(v) => { setEstadoFiltro(v); setPage(1) }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los estados</SelectItem>
            <SelectItem value="PENDIENTE_FIRMA">Pendiente de firma</SelectItem>
            <SelectItem value="FIRMADA">Firmada</SelectItem>
            <SelectItem value="VENCIDA">Vencida</SelectItem>
            <SelectItem value="ANULADA">Anulada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isServer
        serverTotal={data?.total || 0}
        serverPage={page}
        serverTotalPages={data?.totalPages || 1}
        onPageChange={setPage}
        pageSize={pageSize}
        pageSizeOptions={[25, 50, 100]}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
        isLoading={isLoading}
      />

      {isError && (
        <div className="rounded-lg border border-destructive/30 p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Error al cargar actas: {error?.message}</span>
          </div>
        </div>
      )}

      <Dialog open={!!anularDialog} onOpenChange={(v) => { if (!v) { setAnularDialog(null); setMotivoAnula('') } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anular acta</DialogTitle>
            <DialogDescription>
              {anularDialog ? `¿Anular ${anularDialog.CodigoActa}?` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Motivo de anulación</label>
            <textarea
              value={motivoAnula}
              onChange={(e) => setMotivoAnula(e.target.value)}
              className="w-full min-h-[80px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="Indica el motivo (mín. 10 caracteres)"
              maxLength={500}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAnularDialog(null); setMotivoAnula('') }}>Cancelar</Button>
            <Button variant="destructive" onClick={handleAnular} disabled={motivoAnula.length < 10}>Anular acta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
