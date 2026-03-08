import React, { useEffect, useState, useCallback, useRef } from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import { ShapeRenderer } from './ShapeRenderer';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export const PresentationMode: React.FC = () => {
  const { presentation, currentSlideIndex, setCurrentSlide, setPresentationMode } = usePresentationStore();
  const [elapsed, setElapsed] = useState(0);
  const [laserPos, setLaserPos] = useState<{ x: number; y: number } | null>(null);
  const [ctrlHeld, setCtrlHeld] = useState(false);
  const startTime = useRef(Date.now());

  const slide = presentation.slides[currentSlideIndex];

  const goNext = useCallback(() => {
    if (currentSlideIndex < presentation.slides.length - 1) setCurrentSlide(currentSlideIndex + 1);
  }, [currentSlideIndex, presentation.slides.length, setCurrentSlide]);

  const goPrev = useCallback(() => {
    if (currentSlideIndex > 0) setCurrentSlide(currentSlideIndex - 1);
  }, [currentSlideIndex, setCurrentSlide]);

  const exit = useCallback(() => setPresentationMode(false), [setPresentationMode]);

  useEffect(() => {
    const el = document.documentElement;
    el.requestFullscreen?.().catch(() => {});
    return () => { document.exitFullscreen?.().catch(() => {}); };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exit();
      if (e.key === 'ArrowRight' || e.key === ' ') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Control') setCtrlHeld(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') { setCtrlHeld(false); setLaserPos(null); }
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [goNext, goPrev, exit]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (ctrlHeld) setLaserPos({ x: e.clientX, y: e.clientY });
  }, [ctrlHeld]);

  const handleClick = useCallback(() => { if (!ctrlHeld) goNext(); }, [ctrlHeld, goNext]);

  if (!slide) return null;

  const bgStyle: React.CSSProperties = { backgroundColor: '#000' };
  if (slide.background.type === 'color') bgStyle.backgroundColor = slide.background.value;
  else if (slide.background.type === 'gradient') {
    bgStyle.background = `linear-gradient(${slide.background.gradientDirection || '135deg'}, ${slide.background.value}, ${slide.background.secondaryValue || '#fff'})`;
  }

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // Scale to fit viewport
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = Math.min(vw / presentation.slideWidth, vh / presentation.slideHeight);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: '#000' }}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
    >
      <div
        className="relative"
        style={{
          width: presentation.slideWidth,
          height: presentation.slideHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          ...bgStyle,
        }}
      >
        {slide.objects.map((obj) => (
          <div
            key={obj.id}
            className="absolute"
            style={{
              left: obj.position.x,
              top: obj.position.y,
              width: obj.size.width,
              height: obj.size.height,
              transform: obj.rotation ? `rotate(${obj.rotation}deg)` : undefined,
              zIndex: obj.zIndex,
            }}
          >
            {obj.type === 'text' && obj.textProps && (
              <div
                style={{
                  fontFamily: obj.textProps.fontFamily,
                  fontSize: `${obj.textProps.fontSize}px`,
                  fontWeight: obj.textProps.fontWeight,
                  fontStyle: obj.textProps.fontStyle,
                  textDecoration: obj.textProps.textDecoration !== 'none' ? obj.textProps.textDecoration : undefined,
                  color: obj.textProps.color,
                  textAlign: obj.textProps.textAlign,
                  lineHeight: obj.textProps.lineHeight,
                }}
              >
                {obj.textProps.content}
              </div>
            )}
            {obj.type === 'shape' && <ShapeRenderer obj={obj} />}
            {obj.type === 'image' && obj.imageProps && (
              <img src={obj.imageProps.src} alt="" className="w-full h-full" style={{ objectFit: obj.imageProps.objectFit, opacity: obj.imageProps.opacity / 100 }} draggable={false} />
            )}
          </div>
        ))}
      </div>

      {/* Laser */}
      {laserPos && <div className="laser-dot" style={{ left: laserPos.x - 6, top: laserPos.y - 6 }} />}

      {/* Controls overlay */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-foreground/80 backdrop-blur rounded-full px-4 py-2 opacity-0 hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); goPrev(); }} className="text-background p-1">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-background text-xs font-medium">
          {currentSlideIndex + 1} / {presentation.slides.length}
        </span>
        <button onClick={(e) => { e.stopPropagation(); goNext(); }} className="text-background p-1">
          <ChevronRight className="w-5 h-5" />
        </button>
        <span className="text-background/60 text-xs">{formatTime(elapsed)}</span>
        <button onClick={(e) => { e.stopPropagation(); exit(); }} className="text-background p-1">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
