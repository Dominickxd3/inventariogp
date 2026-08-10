import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'

const MAX_HISTORY = 40

const InlineSignature = forwardRef(function InlineSignature(
  { value, onChange, onHistoryChange, width = 220, height = 64, className = '', highlight = false },
  ref,
) {
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const drawingRef = useRef(false)
  const currentStrokeRef = useRef([])
  const strokesRef = useRef([])
  const redoStackRef = useRef([])
  const hintRef = useRef(null)
  const skipValueSyncRef = useRef(false)

  const notifyHistory = useCallback(() => {
    onHistoryChange?.({
      canUndo: strokesRef.current.length > 0,
      canRedo: redoStackRef.current.length > 0,
    })
  }, [onHistoryChange])

  const syncHint = useCallback((filled) => {
    if (hintRef.current) hintRef.current.style.display = filled ? 'none' : 'flex'
  }, [])

  const getCanvasCtx = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const dpr = window.devicePixelRatio || 1
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#111'
    return { canvas, ctx }
  }, [width, height])

  const drawStroke = useCallback((ctx, stroke) => {
    if (stroke.length === 0) return
    ctx.beginPath()
    ctx.moveTo(stroke[0].x, stroke[0].y)
    for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y)
    if (stroke.length === 1) ctx.lineTo(stroke[0].x + 0.01, stroke[0].y)
    ctx.stroke()
  }, [])

  const redraw = useCallback(() => {
    const pair = getCanvasCtx()
    if (!pair) return
    pair.ctx.clearRect(0, 0, width, height)
    for (const s of strokesRef.current) drawStroke(pair.ctx, s)
    syncHint(strokesRef.current.length > 0)
  }, [getCanvasCtx, width, height, drawStroke, syncHint])

  const emit = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || strokesRef.current.length === 0) {
      skipValueSyncRef.current = true
      onChange(null)
      return
    }
    skipValueSyncRef.current = true
    onChange(canvas.toDataURL('image/png'))
  }, [onChange])

  const clear = useCallback(() => {
    strokesRef.current = []
    redoStackRef.current = []
    redraw()
    emit()
    notifyHistory()
  }, [redraw, emit, notifyHistory])

  const undo = useCallback(() => {
    if (strokesRef.current.length === 0) return
    const last = strokesRef.current.pop()
    if (last) redoStackRef.current.push(last)
    redraw()
    emit()
    notifyHistory()
  }, [redraw, emit, notifyHistory])

  const redo = useCallback(() => {
    if (redoStackRef.current.length === 0) return
    const next = redoStackRef.current.pop()
    if (next) {
      strokesRef.current.push(next)
      if (strokesRef.current.length > MAX_HISTORY) strokesRef.current.shift()
    }
    redraw()
    emit()
    notifyHistory()
  }, [redraw, emit, notifyHistory])

  useImperativeHandle(ref, () => ({
    clear, undo, redo,
    focus: () => { wrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); canvasRef.current?.focus() },
    hasSignature: () => strokesRef.current.length > 0,
    canUndo: () => strokesRef.current.length > 0,
    canRedo: () => redoStackRef.current.length > 0,
  }), [clear, undo, redo])

  useEffect(() => {
    if (skipValueSyncRef.current) { skipValueSyncRef.current = false; return }
    if (value) return
    strokesRef.current = []
    redoStackRef.current = []
    redraw()
    notifyHistory()
  }, [value, redraw, notifyHistory])

  useEffect(() => { redraw(); notifyHistory() }, [redraw, notifyHistory])

  const pos = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: (e.clientX - rect.left) * (width / rect.width), y: (e.clientY - rect.top) * (height / rect.height) }
  }

  const onPointerDown = (e) => {
    const pair = getCanvasCtx()
    if (!pair) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    drawingRef.current = true
    const p = pos(e)
    currentStrokeRef.current = [p]
    pair.ctx.beginPath()
    pair.ctx.moveTo(p.x, p.y)
  }

  const onPointerMove = (e) => {
    if (!drawingRef.current) return
    const pair = getCanvasCtx()
    if (!pair) return
    e.preventDefault()
    const p = pos(e)
    currentStrokeRef.current.push(p)
    pair.ctx.lineTo(p.x, p.y)
    pair.ctx.stroke()
    syncHint(true)
  }

  const onPointerUp = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    if (currentStrokeRef.current.length > 0) {
      strokesRef.current.push([...currentStrokeRef.current])
      if (strokesRef.current.length > MAX_HISTORY) strokesRef.current.shift()
      redoStackRef.current = []
      currentStrokeRef.current = []
      emit()
      notifyHistory()
    }
  }

  return (
    <div
      ref={wrapRef}
      className={`relative w-full rounded-sm transition ${className} ${highlight ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-white' : ''}`}
    >
      <canvas
        ref={canvasRef}
        tabIndex={0}
        className="touch-none mx-auto block w-full cursor-crosshair bg-transparent outline-none"
        style={{ height: `${height}px`, maxWidth: '100%' }}
        aria-label="Área de firma. Dibuje aquí con el mouse o el dedo."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      <p
        ref={hintRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center text-[9pt] text-neutral-400 select-none"
      >
        Firme aquí
      </p>
    </div>
  )
})

export default InlineSignature
