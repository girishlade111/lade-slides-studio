import React, { useEffect, useState, useCallback, useRef } from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import { ShapeRenderer } from './ShapeRenderer';
import { X, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

export const PresentationMode: React.FC = () => {
  const { presentation, currentSlideIndex, setCurrentSlide, setPresentationMode } = usePresentationStore();
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [laserPos, setLaserPos] = useState<{ x: number; y: number } | null>(null);
  const [ctrlHeld, setCtrlHeld] = useState(false);
  const [transitionClass, setTransitionClass] = useState('');
  const startTime = useRef(Date.now());
  const pausedTime = useRef(0);

  const slide = presentation.slides[currentSlideIndex];
  const prevSlideRef = useRef(currentSlideIndex);

  const goNext = useCallback(() => {
    if (currentSlideIndex < presentation.slides.length - 1) {
      const nextSlide = presentation.slides[currentSlideIndex + 1];
      if (nextSlide.transition.type !== 'none') {
        setTransitionClass(`slide-transition-${nextSlide.transition.type}`);
        setTimeout(() => setTransitionClass(''), (nextSlide.transition.duration || 0.5) * 1000);
      }
      setCurrentSlide(currentSlideIndex + 1);
    }
  }, [currentSlideIndex, presentation.slides, setCurrentSlide]);

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
    if (paused) return;
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current - pausedTime.current) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [paused]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exit();
      if (e.key === 'ArrowRight' || e.key === ' ') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Control') setCtrlHeld(true);
      if (e.key === 'p' || e.key === 'P') setPaused(p => !p);
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

  const bgStyle: React.CSSProperties = { backgroundColor: '#000', ...buildBgStyle(slide.background) };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

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
        className={`relative ${transitionClass}`}
        style={{
          width: presentation.slideWidth,
          height: presentation.slideHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          transition: transitionClass ? `all ${slide.transition.duration || 0.5}s ease` : undefined,
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
                  backgroundColor: obj.textProps.backgroundColor !== 'transparent' ? obj.textProps.backgroundColor : undefined,
                }}
              >
                {obj.textProps.content}
              </div>
            )}
            {obj.type === 'shape' && <ShapeRenderer obj={obj} />}
            {obj.type === 'image' && obj.imageProps && (() => {
              const ip = obj.imageProps!;
              const f = ip.filters || { grayscale: 0, sepia: 0, blur: 0, brightness: 100, contrast: 100, saturation: 100 };
              const filterStr = [f.grayscale ? `grayscale(${f.grayscale}%)` : '', f.sepia ? `sepia(${f.sepia}%)` : '', f.blur ? `blur(${f.blur}px)` : '', f.brightness !== 100 ? `brightness(${f.brightness}%)` : '', f.contrast !== 100 ? `contrast(${f.contrast}%)` : '', f.saturation !== 100 ? `saturate(${f.saturation}%)` : ''].filter(Boolean).join(' ') || undefined;
              return <img src={ip.src} alt="" className="w-full h-full" style={{ objectFit: ip.objectFit, opacity: ip.opacity / 100, filter: filterStr, borderRadius: ip.cornerRadius ? `${ip.cornerRadius}px` : undefined, border: ip.border?.enabled ? `${ip.border.width}px solid ${ip.border.color}` : undefined, boxShadow: ip.shadow?.enabled ? `${ip.shadow.offsetX}px ${ip.shadow.offsetY}px ${ip.shadow.blur}px ${ip.shadow.color}` : undefined, transform: (ip.flipH || ip.flipV) ? `scale(${ip.flipH ? -1 : 1}, ${ip.flipV ? -1 : 1})` : undefined }} draggable={false} />;
            })()}
          </div>
        ))}
      </div>

      {laserPos && <div className="laser-dot" style={{ left: laserPos.x - 6, top: laserPos.y - 6 }} />}

      {/* Presenter notes overlay (bottom) */}
      {slide.notes && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 max-w-xl bg-foreground/70 backdrop-blur rounded-lg px-4 py-2 opacity-0 hover:opacity-100 transition-opacity">
          <p className="text-background text-xs">{slide.notes}</p>
        </div>
      )}

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
        <button onClick={(e) => { e.stopPropagation(); setPaused(p => !p); }} className="text-background p-1">
          {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>
        <span className="text-background/60 text-xs">{formatTime(elapsed)}{paused && ' ⏸'}</span>
        <button onClick={(e) => { e.stopPropagation(); exit(); }} className="text-background p-1">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
