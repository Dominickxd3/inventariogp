import { useState, useEffect, useRef } from 'react'
import { Combobox } from './ui/combobox.jsx'
import { api } from '../lib/api'

export default function AutocompleteInput({ value, onChange, placeholder, catalogoNombre, disabled }) {
  const [options, setOptions] = useState([])
  const timerRef = useRef(null)

  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  const handleSearch = (q) => {
    if (!catalogoNombre || !q || q.length < 1) return
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await api.componentes.searchCatalogo(catalogoNombre, q)
        setOptions((res || []).map(v => ({ value: v.NombreValor, label: v.NombreValor })))
      } catch { setOptions([]) }
    }, 200)
  }

  const handleSelect = (v) => {
    onChange(v.toUpperCase())
  }

  return (
    <Combobox
      options={options}
      value={value}
      onSelect={handleSelect}
      onSearch={handleSearch}
      placeholder={placeholder}
      searchPlaceholder="Buscar..."
      emptyText="Sin resultados"
      disabled={disabled}
    />
  )
}
