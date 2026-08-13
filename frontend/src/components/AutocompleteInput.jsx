import { useState, useRef } from 'react'
import { Input } from './ui/input.jsx'

function toOption(item) {
  if (item && typeof item === 'object' && item !== null) {
    return { id: item.id ?? item.IdValor ?? null, label: String(item.label ?? item.NombreValor ?? item.nombre ?? '') }
  }
  return { id: null, label: String(item ?? '') }
}

export default function AutocompleteInput({ value, onChange, placeholder, searchFn, disabled }) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState([])
  const timerRef = useRef(null)
  const focusedRef = useRef(false)

  const handleChange = (v) => {
    onChange(v.toUpperCase())
    setOpen(true)
    clearTimeout(timerRef.current)
    const q = v.trim()
    if (!q) { setOptions([]); setOpen(false); return }
    timerRef.current = setTimeout(async () => {
      try {
        const res = await searchFn(q)
        const list = (res || []).map(toOption).filter(o => o.label)
        setOptions(list)
        setOpen(focusedRef.current && list.length > 0)
      } catch {
        setOptions([])
        setOpen(false)
      }
    }, 200)
  }

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => { focusedRef.current = true }}
        onBlur={() => { setTimeout(() => { focusedRef.current = false; setOpen(false) }, 150) }}
      />
      {open && options.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-lg border bg-popover text-popover-foreground shadow-md">
          {options.map((opt, i) => (
            <button
              type="button"
              key={opt.id ?? `${opt.label}-${i}`}
              onMouseDown={(e) => { e.preventDefault(); onChange(opt.label.toUpperCase(), opt); setOpen(false) }}
              className="block w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
