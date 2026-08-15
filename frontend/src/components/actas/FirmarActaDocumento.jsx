import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import InlineSignature from './InlineSignature'
import FloatingToolbar from './FloatingToolbar'
import Icons from './Icons'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

const ZOOM_MIN = 0.7
const ZOOM_MAX = 1.4
const ZOOM_STEP = 0.1

export default function FirmarActaDocumento({ pdfUrl, tipoActa, onFirmar, enviando = false }) {
  const sigRef = useRef(null)
  const contenedorRef = useRef(null)
  const zonaFirmaRef = useRef(null)
  const [firmaSrc, setFirmaSrc] = useState(null)
  const [posicionFirma, setPosicionFirma] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [anchoPagina, setAnchoPagina] = useState(760)
  const [dimFirma, setDimFirma] = useState({ w: 760, h: 1075 })
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const ajustar = () => {
      const w = contenedorRef.current?.clientWidth || window.innerWidth
      setAnchoPagina(Math.min(w - 20, 794))
    }
    ajustar()
    window.addEventListener('resize', ajustar)
    return () => window.removeEventListener('resize', ajustar)
  }, [])

  useEffect(() => {
    const node = zonaFirmaRef.current
    if (!node) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) setDimFirma({ w: Math.round(width), h: Math.round(height) })
    })
    ro.observe(node)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      const k = e.key.toLowerCase()
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); sigRef.current?.undo() }
      else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); sigRef.current?.redo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }, [])

  const onHistoryChange = useCallback((s) => { setCanUndo(s.canUndo); setCanRedo(s.canRedo) }, [])

  const onFirmaChange = useCallback((img, rect) => {
    setFirmaSrc(img)
    if (img && rect) {
      setPosicionFirma({
        left: (rect.left / dimFirma.w) * 100,
        top: (rect.top / dimFirma.h) * 100,
        width: (rect.width / dimFirma.w) * 100,
        height: (rect.height / dimFirma.h) * 100,
      })
    } else {
      setPosicionFirma(null)
    }
  }, [dimFirma])

  const undo = useCallback(() => sigRef.current?.undo(), [])
  const redo = useCallback(() => sigRef.current?.redo(), [])
  const clearSign = useCallback(() => { sigRef.current?.clear(); setFirmaSrc(null); setPosicionFirma(null); showToast('Firma borrada') }, [showToast])
  const zoomIn = useCallback(() => setZoom((z) => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 10) / 10)), [])
  const zoomOut = useCallback(() => setZoom((z) => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 10) / 10)), [])
  const zoomReset = useCallback(() => setZoom(1), [])

  const confirmarFirma = useCallback(async () => {
    if (!firmaSrc) { showToast('Debe firmar el documento'); return }
    await onFirmar(firmaSrc, posicionFirma)
  }, [firmaSrc, posicionFirma, onFirmar, showToast])

  const actions = useMemo(() => [
    { id: 'undo', label: 'Deshacer (Ctrl+Z)', icon: Icons.undo, onClick: undo, disabled: !canUndo },
    { id: 'redo', label: 'Rehacer (Ctrl+Y)', icon: Icons.redo, onClick: redo, disabled: !canRedo },
    { id: 'clear', label: 'Borrar firma', icon: Icons.eraser, onClick: clearSign, disabled: !firmaSrc && !canUndo, danger: true, dividerBefore: true },
    { id: 'zoom-out', label: 'Alejar', icon: Icons.zoomOut, onClick: zoomOut, disabled: zoom <= ZOOM_MIN, dividerBefore: true },
    { id: 'zoom-reset', label: `Zoom ${Math.round(zoom * 100)}%`, icon: Icons.resetZoom, onClick: zoomReset, disabled: zoom === 1 },
    { id: 'zoom-in', label: 'Acercar', icon: Icons.zoomIn, onClick: zoomIn, disabled: zoom >= ZOOM_MAX },
    { id: 'send', label: enviando ? 'Guardando...' : 'Confirmar firma', icon: Icons.send, onClick: confirmarFirma, disabled: !firmaSrc || enviando, loading: enviando, primary: true, dividerBefore: true },
  ], [undo, redo, canUndo, canRedo, clearSign, firmaSrc, zoom, zoomIn, zoomOut, zoomReset, confirmarFirma, enviando])

  const hint = canUndo ? undefined : 'Firme en cualquier parte del documento con el mouse o el dedo · Deshacer / Rehacer por trazo'

  return (
    <div className="relative min-h-screen bg-neutral-200 pb-28">
      {toast && (
        <div className="pointer-events-none fixed left-1/2 top-4 z-50 -translate-x-1/2">
          <p className="rounded-full bg-neutral-900/90 px-4 py-2 text-sm text-white shadow-lg">{toast}</p>
        </div>
      )}

      <div ref={contenedorRef} className="flex justify-center overflow-auto px-3 py-6">
        <div
          className="origin-top transition-transform duration-200"
          style={{ transform: `scale(${zoom})`, marginBottom: zoom !== 1 ? `${(zoom - 1) * 297}mm` : undefined }}
        >
          <div className="relative mx-auto w-fit bg-white shadow-xl">
            <Document
              file={pdfUrl}
              loading={<div className="flex h-[600px] items-center justify-center">Cargando documento...</div>}
              error={<div className="p-10 text-center text-red-600">No se pudo cargar el documento.</div>}
            >
              <Page pageNumber={1} width={anchoPagina} renderTextLayer={false} renderAnnotationLayer={false} />
            </Document>

            <div
              ref={zonaFirmaRef}
              className="absolute inset-0 z-10"
              style={{ touchAction: 'none' }}
            >
              <InlineSignature
                ref={sigRef}
                value={firmaSrc}
                onChange={onFirmaChange}
                onHistoryChange={onHistoryChange}
                width={dimFirma.w}
                height={dimFirma.h}
                hideHint
              />
            </div>
          </div>
        </div>
      </div>

      <FloatingToolbar
        actions={actions}
        hint={hint}
      />
    </div>
  )
}