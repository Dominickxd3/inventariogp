import { useRef, useEffect, useState } from 'react'

export default function SignaturePad({ value, onChange, disabled }) {
  const canvasRef = useRef(null)
  const [drawing, setDrawing] = useState(false)
  const [hasTrazo, setHasTrazo] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#000'
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  function getPos(e) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const t = e.touches ? e.touches[0] : e
    return {
      x: (t.clientX - rect.left) * scaleX,
      y: (t.clientY - rect.top) * scaleY,
    }
  }

  function startDraw(e) {
    if (disabled) return
    e.preventDefault()
    setDrawing(true)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  function draw(e) {
    if (!drawing || disabled) return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setHasTrazo(true)
  }

  function endDraw() {
    if (!drawing) return
    setDrawing(false)
    const canvas = canvasRef.current
    const dataUrl = canvas.toDataURL('image/png')
    onChange(dataUrl)
  }

  function handleClear() {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasTrazo(false)
    onChange('')
  }

  return (
    <div className="space-y-2">
      <div
        className={`border border-border rounded-lg overflow-hidden ${disabled ? 'opacity-50' : 'cursor-crosshair'}`}
        style={{ width: 400, height: 160 }}
      >
        <canvas
          ref={canvasRef}
          width={400}
          height={160}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
          aria-label="Panel de firma: dibuja tu firma aquí"
          role="application"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !drawing) startDraw({ clientX: 200, clientY: 80, preventDefault: () => {} })
          }}
        />
      </div>
      <div className="flex gap-2">
        {hasTrazo && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="text-sm text-muted-foreground hover:text-foreground underline"
            aria-label="Limpiar firma"
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  )
}
