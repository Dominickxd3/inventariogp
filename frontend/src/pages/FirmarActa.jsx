import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import FirmarActaDocumento from '../components/actas/FirmarActaDocumento'

const PASO = { VALIDAR: 0, FIRMAR: 1, EXITO: 2, ERROR: 3 }

function obtenerToken() {
  const hash = window.location.hash
  if (hash) return new URLSearchParams(hash.slice(1)).get('token') || ''
  return new URLSearchParams(window.location.search).get('token') || ''
}

export default function FirmarActa() {
  const [token] = useState(obtenerToken)
  const [paso, setPaso] = useState(token ? PASO.VALIDAR : PASO.ERROR)
  const [ultimosCuatroDni, setUltimosCuatroDni] = useState('')
  const [errorMsg, setErrorMsg] = useState(token ? '' : 'Enlace inválido: no se encontró el token de firma.')
  const [submitting, setSubmitting] = useState(false)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [tipoActa, setTipoActa] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [enviandoFirma, setEnviandoFirma] = useState(false)

  useEffect(() => {
    if (token) window.history.replaceState(null, '', window.location.pathname)
  }, [token])

  useEffect(() => {
    return () => {
      if (pdfUrl instanceof Blob) URL.revokeObjectURL(pdfUrl)
    }
  }, [pdfUrl])

  async function handleValidar(e) {
    e.preventDefault()
    if (ultimosCuatroDni.length !== 4) return
    setSubmitting(true)
    setErrorMsg('')
    try {
      const data = await api.public.validarActa(token, ultimosCuatroDni)
      setTipoActa(data.acta.tipo)
      const blob = await api.public.previewActa(token, ultimosCuatroDni)
      setPdfUrl(URL.createObjectURL(blob))
      setPaso(PASO.FIRMAR)
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleFirmar(firmaBase64) {
    setEnviandoFirma(true)
    try {
      const data = await api.public.firmarActa(token, ultimosCuatroDni, true, firmaBase64)
      setResultado(data)
      setPaso(PASO.EXITO)
    } catch (err) {
      alert(err.message || 'No se pudo registrar la firma.')
    } finally {
      setEnviandoFirma(false)
    }
  }

  if (paso === PASO.ERROR) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-200 p-4">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-bold mb-2">Enlace inválido</h1>
          <p className="text-muted-foreground">{errorMsg}</p>
        </div>
      </div>
    )
  }

  if (paso === PASO.VALIDAR) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-200 p-4">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-sm w-full">
          <p className="text-sm text-muted-foreground mb-4">
            Para acceder al documento, ingresa los últimos 4 dígitos de tu DNI.
          </p>
          <form onSubmit={handleValidar} className="space-y-4">
            <input
              value={ultimosCuatroDni}
              onChange={(e) => setUltimosCuatroDni(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="####"
              maxLength={4}
              className="w-full text-center text-lg tracking-widest rounded-lg border px-3 py-2 outline-none"
              autoFocus
            />
            {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
            <button
              type="submit"
              disabled={submitting || ultimosCuatroDni.length !== 4}
              className="w-full bg-blue-900 text-white py-2.5 rounded-lg font-medium hover:bg-blue-800 disabled:opacity-50"
            >
              {submitting ? 'Validando...' : 'Validar documento'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (paso === PASO.EXITO && resultado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-200 p-4">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center space-y-4">
          <h2 className="text-xl font-bold">Documento firmado correctamente</h2>
          <p className="text-sm text-muted-foreground">
            Fecha: {new Date(resultado.acta.fechaFirma).toLocaleString('es-PE')}
          </p>
          <p className="text-sm text-muted-foreground">
            Código: {resultado.acta.codigo}
          </p>
        </div>
      </div>
    )
  }

  return (
    <FirmarActaDocumento
      pdfUrl={pdfUrl}
      tipoActa={tipoActa}
      enviando={enviandoFirma}
      onFirmar={handleFirmar}
    />
  )
}
