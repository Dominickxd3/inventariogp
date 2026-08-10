"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

export type InlineSignatureHandle = {
  clear: () => void;
  undo: () => void;
  redo: () => void;
  focus: () => void;
  hasSignature: () => boolean;
  canUndo: () => boolean;
  canRedo: () => boolean;
};

type Point = { x: number; y: number };
type Stroke = Point[];

type Props = {
  value?: string | null;
  onChange: (dataUrl: string | null) => void;
  onHistoryChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
  width?: number;
  height?: number;
  className?: string;
  highlight?: boolean;
};

const MAX_HISTORY = 40;

/**
 * Firma in-place con historial por trazo (deshacer / rehacer como Word).
 */
const InlineSignature = forwardRef<InlineSignatureHandle, Props>(
  function InlineSignature(
    {
      value,
      onChange,
      onHistoryChange,
      width = 220,
      height = 64,
      className = "",
      highlight = false,
    },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const drawing = useRef(false);
    const currentStroke = useRef<Stroke>([]);
    const strokes = useRef<Stroke[]>([]);
    const redoStack = useRef<Stroke[]>([]);
    const hintRef = useRef<HTMLParagraphElement>(null);
    const skipValueSync = useRef(false);

    const notifyHistory = useCallback(() => {
      onHistoryChange?.({
        canUndo: strokes.current.length > 0,
        canRedo: redoStack.current.length > 0,
      });
    }, [onHistoryChange]);

    const syncChrome = useCallback((filled: boolean) => {
      if (hintRef.current) {
        hintRef.current.style.display = filled ? "none" : "flex";
      }
    }, []);

    const setupCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#111";
      return { canvas, ctx };
    }, [width, height]);

    const drawStroke = useCallback(
      (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
        if (stroke.length === 0) return;
        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i++) {
          ctx.lineTo(stroke[i].x, stroke[i].y);
        }
        if (stroke.length === 1) {
          ctx.lineTo(stroke[0].x + 0.01, stroke[0].y);
        }
        ctx.stroke();
      },
      [],
    );

    const redraw = useCallback(() => {
      const pair = setupCanvas();
      if (!pair) return;
      const { ctx } = pair;
      ctx.clearRect(0, 0, width, height);
      for (const stroke of strokes.current) {
        drawStroke(ctx, stroke);
      }
      const filled = strokes.current.length > 0;
      syncChrome(filled);
    }, [setupCanvas, width, height, drawStroke, syncChrome]);

    const emit = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas || strokes.current.length === 0) {
        skipValueSync.current = true;
        onChange(null);
        return;
      }
      skipValueSync.current = true;
      onChange(canvas.toDataURL("image/png"));
    }, [onChange]);

    const clear = useCallback(() => {
      strokes.current = [];
      redoStack.current = [];
      redraw();
      emit();
      notifyHistory();
    }, [redraw, emit, notifyHistory]);

    const undo = useCallback(() => {
      if (strokes.current.length === 0) return;
      const last = strokes.current.pop();
      if (last) redoStack.current.push(last);
      redraw();
      emit();
      notifyHistory();
    }, [redraw, emit, notifyHistory]);

    const redo = useCallback(() => {
      if (redoStack.current.length === 0) return;
      const next = redoStack.current.pop();
      if (next) {
        strokes.current.push(next);
        if (strokes.current.length > MAX_HISTORY) {
          strokes.current.shift();
        }
      }
      redraw();
      emit();
      notifyHistory();
    }, [redraw, emit, notifyHistory]);

    useImperativeHandle(
      ref,
      () => ({
        clear,
        undo,
        redo,
        focus: () => {
          wrapRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          canvasRef.current?.focus();
        },
        hasSignature: () => strokes.current.length > 0,
        canUndo: () => strokes.current.length > 0,
        canRedo: () => redoStack.current.length > 0,
      }),
      [clear, undo, redo],
    );

    // Ignora updates de value que vienen de nuestros propios emit();
    // solo reacciona a borrado externo (value → null).
    useEffect(() => {
      if (skipValueSync.current) {
        skipValueSync.current = false;
        return;
      }
      if (value) return;
      strokes.current = [];
      redoStack.current = [];
      redraw();
      notifyHistory();
    }, [value, redraw, notifyHistory]);

    useEffect(() => {
      setupCanvas();
      redraw();
      notifyHistory();
    }, [setupCanvas, redraw, notifyHistory]);

    const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const scaleX = width / rect.width;
      const scaleY = height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const pair = setupCanvas();
      if (!pair) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      drawing.current = true;
      const p = pos(e);
      currentStroke.current = [p];
      pair.ctx.beginPath();
      pair.ctx.moveTo(p.x, p.y);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawing.current) return;
      const pair = setupCanvas();
      if (!pair) return;
      e.preventDefault();
      const p = pos(e);
      currentStroke.current.push(p);
      pair.ctx.lineTo(p.x, p.y);
      pair.ctx.stroke();
      syncChrome(true);
    };

    const onPointerUp = () => {
      if (!drawing.current) return;
      drawing.current = false;
      if (currentStroke.current.length > 0) {
        strokes.current.push([...currentStroke.current]);
        if (strokes.current.length > MAX_HISTORY) {
          strokes.current.shift();
        }
        // Nuevo trazo invalida el rehacer (como Word)
        redoStack.current = [];
        currentStroke.current = [];
        emit();
        notifyHistory();
      }
    };

    return (
      <div
        ref={wrapRef}
        className={`relative w-full rounded-sm transition ${className} ${
          highlight
            ? "ring-2 ring-sky-400 ring-offset-2 ring-offset-white"
            : ""
        }`}
      >
        <canvas
          ref={canvasRef}
          tabIndex={0}
          className="touch-none mx-auto block w-full cursor-crosshair bg-transparent outline-none"
          style={{ height: `${height}px`, maxWidth: "100%" }}
          aria-label="Área de firma. Dibuje aquí con el mouse o el dedo."
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
        <p
          ref={hintRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-[9pt] text-neutral-400 select-none print:hidden"
        >
          Firme aquí
        </p>
      </div>
    );
  },
);

export default InlineSignature;
