"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  onChange: (dataUrl: string | null) => void;
  width?: number;
  height?: number;
};

export default function SignaturePad({
  onChange,
  width = 360,
  height = 120,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    return { canvas, ctx };
  }, []);

  useEffect(() => {
    const pair = getCtx();
    if (!pair) return;
    const { canvas, ctx } = pair;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111";
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
  }, [getCtx, width, height]);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const emit = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(canvas.toDataURL("image/png"));
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pair = getCtx();
    if (!pair) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = pos(e);
    pair.ctx.beginPath();
    pair.ctx.moveTo(p.x, p.y);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const pair = getCtx();
    if (!pair) return;
    const p = pos(e);
    pair.ctx.lineTo(p.x, p.y);
    pair.ctx.stroke();
    setHasInk(true);
  };

  const onPointerUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (hasInk) emit();
    else {
      const pair = getCtx();
      if (pair) {
        // check if anything was drawn this stroke
        emit();
        setHasInk(true);
      }
    }
  };

  const clear = () => {
    const pair = getCtx();
    if (!pair) return;
    pair.ctx.fillStyle = "#fff";
    pair.ctx.fillRect(0, 0, width, height);
    pair.ctx.strokeStyle = "#111";
    setHasInk(false);
    onChange(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-neutral-600">
        Dibuje su firma en el recuadro (mouse o dedo):
      </p>
      <canvas
        ref={canvasRef}
        className="touch-none cursor-crosshair rounded border border-neutral-400 bg-white"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={clear}
          className="rounded border border-neutral-400 px-3 py-1.5 text-sm"
        >
          Borrar firma
        </button>
      </div>
    </div>
  );
}
