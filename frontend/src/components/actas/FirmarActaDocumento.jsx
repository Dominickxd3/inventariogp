import { useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import SignatureCanvas from 'react-signature-canvas'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

const POSICIONES_FIRMA = {
  ENTREGA: {
    left: 8,
    top: 76,
    width: 42,
    height: 9,
  },
  DEVOLUCION_COLABORADOR: {
    left: 56,
    top: 67,
    width: 37,
    height: 8,
  },
}

export default function FirmarActaDocumento({
  pdfUrl,
  tipoActa,
  onFirmar,
  enviando = false,
}) {
  const firmaRef = useRef(null)
  const contenedorRef = useRef(null)
  const [anchoPagina, setAnchoPagina] = useState(760)

  const posicion =
    tipoActa === 'DEVOLUCION'
      ? POSICIONES_FIRMA.DEVOLUCION_COLABORADOR
      : POSICIONES_FIRMA.ENTREGA

  useEffect(() => {
    const ajustarAncho = () => {
      const anchoDisponible =
        contenedorRef.current?.clientWidth || window.innerWidth
      setAnchoPagina(Math.min(anchoDisponible, 794))
    }
    ajustarAncho()
    window.addEventListener('resize', ajustarAncho)
    return () => window.removeEventListener('resize', ajustarAncho)
  }, [])

  function limpiarFirma() {
    firmaRef.current?.clear()
  }

  async function confirmarFirma() {
    if (!firmaRef.current || firmaRef.current.isEmpty()) {
      alert('Debe firmar el documento.')
      return
    }
    const firmaBase64 = firmaRef.current
      .getTrimmedCanvas()
      .toDataURL('image/png')
    await onFirmar(firmaBase64)
  }

  return (
    <main className="min-h-screen bg-neutral-200">
      <div
        ref={contenedorRef}
        className="mx-auto w-full max-w-[820px] px-2 py-4"
      >
        <div className="relative mx-auto w-fit overflow-hidden bg-white shadow-xl">
          <Document
            file={pdfUrl}
            loading={
              <div className="flex h-[600px] items-center justify-center">
                Cargando documento...
              </div>
            }
            error={
              <div className="p-10 text-center text-red-600">
                No se pudo cargar el documento.
              </div>
            }
          >
            <Page
              pageNumber={1}
              width={anchoPagina}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>

          <div
            className="absolute border border-dashed border-transparent"
            style={{
              left: `${posicion.left}%`,
              top: `${posicion.top}%`,
              width: `${posicion.width}%`,
              height: `${posicion.height}%`,
            }}
          >
            <SignatureCanvas
              ref={firmaRef}
              penColor="black"
              minWidth={0.7}
              maxWidth={2}
              canvasProps={{
                className:
                  'h-full w-full touch-none bg-transparent cursor-crosshair',
              }}
            />
          </div>
        </div>

        <div className="sticky bottom-0 mt-3 flex gap-3 bg-white/95 p-3 shadow-lg backdrop-blur">
          <button
            type="button"
            onClick={limpiarFirma}
            disabled={enviando}
            className="flex-1 rounded-lg border px-4 py-3 font-medium"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={confirmarFirma}
            disabled={enviando}
            className="flex-[2] rounded-lg bg-blue-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {enviando ? 'Guardando firma...' : 'Confirmar firma'}
          </button>
        </div>
      </div>
    </main>
  )
}
