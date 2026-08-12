import { useState, useRef, useEffect } from 'react'
import { Input } from '#components/ui/input.jsx'
import { api } from '../lib/api'

export default function AutocompleteInput({ value, onChange, placeholder, catalogoNombre, disabled }) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const search = (q) => {
    if (!q || q.length < 2) { setOptions([]); setOpen(false); return }
    setLoading(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await api.componentes.searchCatalogo(catalogoNombre, q)
        setOptions(res || [])
        setOpen(true)
      } catch { setOptions([]) }
      setLoading(false)
    }, 200)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        value={value}
        onChange={(e) => { onChange(e.target.value); search(e.target.value) }}
        onFocus={() => { if (value && options.length > 0) setOpen(true) }}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />
      {loading && <span className="absolute right-2 top-2 text-xs text-muted-foreground">...</span>}
      {open && options.length > 0 && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.IdValor}
              type="button"
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50"
              onClick={() => { onChange(opt.NombreValor); setOpen(false) }}
            >
              {opt.NombreValor}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
