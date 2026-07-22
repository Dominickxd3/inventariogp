import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import SignaturePad from '../components/actas/SignaturePad'

const ESTADOS = {
  loading: 'loading',
  validar: 'validar',
  firmando: 'firmando',
  exito: 'exito',
  error: 'error',
}

export default function FirmarActa() {
  const [searchParams] = useSearchParams()
  const [token, setToken] = useState('')
  const [estado, setEstado] = useState(ESTADOS.loading)
  const [actaData, setActaData] = useState(null)
  const [ultimosCuatroDni, setUltimosCuatroDni] = useState('')
  const [acepta, setAcepta] = useState(false)
  const [firmaBase64, setFirmaBase64] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    const hashToken = window.location.hash.replace(/^#token=/, '')
    if (hashToken) {
      setToken(hashToken)
      window.history.replaceState(null, '', window.location.pathname)
      setEstado(ESTADOS.validar)
    } else {
      setErrorMsg('Enlace inválido: no se encontró el token de firma.')
      setEstado(ESTADOS.error)
    }
  }, [])

  async function handleValidar(e) {
    e.preventDefault()
    if (ultimosCuatroDni.length !== 4) return

    setSubmitting(true)
    setErrorMsg('')
    try {
      const data = await api.public.validarActa(token, ultimosCuatroDni)
      setActaData(data.acta)
      setEstado(ESTADOS.firmando)
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleFirmar(e) {
    e.preventDefault()
    if (!acepta) {
      setErrorMsg('Debes aceptar las condiciones para firmar.')
      return
    }
    if (!firmaBase64 || firmaBase64.length < 100) {
      setErrorMsg('Debes dibujar tu firma en el recuadro.')
      return
    }

    setSubmitting(true)
    setErrorMsg('')
    try {
      const data = await api.public.firmarActa(token, ultimosCuatroDni, true, firmaBase64)
      setResultado(data)
      setEstado(ESTADOS.exito)
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (estado === ESTADOS.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (estado === ESTADOS.error && !actaData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold mb-2">Enlace inválido</h1>
          <p className="text-muted-foreground">{errorMsg}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-blue-900 text-white p-6 text-center">
            <h1 className="text-xl font-bold">Grupo Pecuario S.A.C.</h1>
            <p className="text-sm opacity-80 mt-1">RUC: 20513967234</p>
            <h2 className="text-lg font-semibold mt-3">Firma Electrónica de Documentos</h2>
          </div>

          <div className="p-6 space-y-6">
            {estado === ESTADOS.validar && (
              <form onSubmit={handleValidar} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Para acceder al documento, ingresa los últimos 4 dígitos de tu DNI.
                </p>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Últimos 4 dígitos del DNI
                  </label>
                  <input
                    value={ultimosCuatroDni}
                    onChange={(e) => setUltimosCuatroDni(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="####"
                    maxLength={4}
                    className="w-32 rounded-lg border border-input bg-transparent px-3 py-2 text-center text-lg tracking-widest outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    aria-label="Últimos 4 dígitos del DNI"
                    autoFocus
                  />
                </div>
                {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
                <button
                  type="submit"
                  disabled={submitting || ultimosCuatroDni.length !== 4}
                  className="w-full bg-blue-900 text-white py-2.5 rounded-lg font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Validando...' : 'Validar documento'}
                </button>
              </form>
            )}

            {estado === ESTADOS.firmando && actaData && (
              <>
                <div className="border-b border-border pb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Documento:</span>
                    <span className="text-sm">{actaData.codigo}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm font-medium">Tipo:</span>
                    <span className="text-sm">{actaData.tipo === 'ENTREGA' ? 'Cargo de Entrega' : 'Cargo de Devolución'}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm font-medium">Trabajador:</span>
                    <span className="text-sm">{actaData.trabajador}</span>
                  </div>
                </div>

                {actaData.equipo && (
                  <div className="border-b border-border pb-4">
                    <h3 className="text-sm font-medium mb-2">Equipo</h3>
                    <div className="grid grid-cols-2 gap-1 text-sm">
                      <span className="text-muted-foreground">Código:</span>
                      <span>{actaData.equipo.codigo || '—'}</span>
                      <span className="text-muted-foreground">Marca:</span>
                      <span>{actaData.equipo.marca || '—'}</span>
                      <span className="text-muted-foreground">Modelo:</span>
                      <span>{actaData.equipo.modelo || '—'}</span>
                      <span className="text-muted-foreground">Serie:</span>
                      <span>{actaData.equipo.serie || '—'}</span>
                    </div>
                  </div>
                )}

                {actaData.accesorios?.length > 0 && (
                  <div className="border-b border-border pb-4">
                    <h3 className="text-sm font-medium mb-2">Accesorios</h3>
                    <ul className="text-sm space-y-1">
                      {actaData.accesorios.map((a, i) => (
                        <li key={i}>• {a.codigo} {a.descripcion}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <form onSubmit={handleFirmar} className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      Declaro haber recibido el equipo descrito en buen estado y acepto las condiciones de uso
                      y responsabilidad sobre el cuidado del mismo. Entiendo que soy responsable por cualquier
                      daño, pérdida o extravío del equipo y accesorios asignados.
                    </p>
                  </div>

                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={acepta}
                      onChange={(e) => setAcepta(e.target.checked)}
                      className="mt-0.5"
                      aria-label="Acepto las condiciones"
                    />
                    <span>Acepto las condiciones y declaro que los datos son correctos.</span>
                  </label>

                  <div>
                    <label className="block text-sm font-medium mb-2">Firma</label>
                    <SignaturePad
                      value={firmaBase64}
                      onChange={setFirmaBase64}
                      disabled={submitting}
                    />
                  </div>

                  {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}

                  <button
                    type="submit"
                    disabled={submitting || !acepta || !firmaBase64}
                    className="w-full bg-blue-900 text-white py-2.5 rounded-lg font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Firmar documento"
                  >
                    {submitting ? 'Firmando...' : 'Firmar documento'}
                  </button>
                </form>
              </>
            )}

            {estado === ESTADOS.exito && resultado && (
              <div className="text-center space-y-4 py-6">
                <div className="text-5xl">✅</div>
                <h2 className="text-xl font-bold">Documento firmado correctamente</h2>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Fecha de firma: {new Date(resultado.acta.fechaFirma).toLocaleString('es-PE')}</p>
                  <p>Código: {resultado.acta.codigo}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-100 p-4 text-center text-xs text-muted-foreground">
            Av. Canto Bello 200 Urb. Canto Bello Lima 36 - Telf. 3872967 - 922386045
          </div>
        </div>
      </div>
    </div>
  )
}
