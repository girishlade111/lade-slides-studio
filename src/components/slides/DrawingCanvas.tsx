import React, { useRef, useState, useCallback, useEffect } from 'react';

interface DrawingCanvasProps {
  width: number;
  height: number;
  active: boolean;
  penColor: string;
  penSize: number;
  isEraser: boolean;
  onClear?: () => void;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  width, height, active, penColor, penSize, isEraser,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const getPos = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  const startDraw = useCallback((e: React.MouseEvent) => {
    if (!active) return;
    setDrawing(true);
    lastPos.current = getPos(e);
  }, [active, getPos]);

  const draw = useCallback((e: React.MouseEvent) => {
    if (!drawing || !active) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !lastPos.current) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = isEraser ? 'rgba(0,0,0,1)' : penColor;
    ctx.lineWidth = penSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    ctx.stroke();
    lastPos.current = pos;
  }, [drawing, active, getPos, penColor, penSize, isEraser]);

  const endDraw = useCallback(() => {
    setDrawing(false);
    lastPos.current = null;
  }, []);

  // Expose clear via imperative handle
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    (canvas as any).__clear = () => {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0"
      style={{
        width: '100%',
        height: '100%',
        cursor: active ? (isEraser ? 'crosshair' : 'crosshair') : 'none',
        pointerEvents: active ? 'auto' : 'none',
        zIndex: 10,
      }}
      onMouseDown={startDraw}
      onMouseMove={draw}
      onMouseUp={endDraw}
      onMouseLeave={endDraw}
    />
  );
};

export function clearDrawingCanvas(el: HTMLCanvasElement | null) {
  if (el && (el as any).__clear) (el as any).__clear();
}
