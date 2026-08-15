import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { invalidarPorEvento } from '../lib/realtime'

const RETRY_MS = 3000

export default function RealtimeSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    let source
    let reconnectTimer
    let stopped = false

    function conectar() {
      if (stopped) return
      source = new EventSource(`/api/events?token=${encodeURIComponent(token)}`)
      source.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data?.tipo) invalidarPorEvento(queryClient, data.tipo)
        } catch {}
      }
      source.onerror = () => {
        source?.close()
        if (!stopped) reconnectTimer = setTimeout(conectar, RETRY_MS)
      }
    }

    conectar()

    return () => {
      stopped = true
      clearTimeout(reconnectTimer)
      source?.close()
    }
  }, [queryClient])

  return null
}