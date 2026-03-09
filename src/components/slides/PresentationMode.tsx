import React, { useEffect, useState, useCallback, useRef } from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import { buildBgStyle } from '@/lib/backgroundUtils';
import { ShapeRenderer } from './ShapeRenderer';
import { X, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import type { TransitionType, TransitionDirection, EasingType, ObjectAnimation } from '@/types/presentation';

/* ---- CSS-based animation keyframe generator ---- */
function getTransitionCSS(type: TransitionType, dir: TransitionDirection, duration: number, easing: EasingType): React.CSSProperties {
  const easingMap: Record<EasingType, string> = {
    'linear': 'linear', 'ease-in': 'ease-in', 'ease-out': 'ease-out', 'ease-in-out': 'ease-in-out',
  };
  const base: React.CSSProperties = { transition: `all ${duration}s ${easingMap[easing]}` };

  switch (type) {
    case 'fade': return { ...base, animation: `pres-fade-in ${duration}s ${easingMap[easing]} forwards` };
    case 'slide': {
      const dirs: Record<string, string> = { left: '-100%, 0', right: '100%, 0', up: '0, -100%', down: '0, 100%' };
      return { ...base, animation: `pres-slide-from ${duration}s ${easingMap[easing]} forwards`, '--slide-from': dirs[dir] || '-100%, 0' } as any;
    }
    case 'push': return { ...base, animation: `pres-slide-from ${duration}s ${easingMap[easing]} forwards`, '--slide-from': dir === 'right' ? '100%, 0' : dir === 'up' ? '0, -100%' : dir === 'down' ? '0, 100%' : '-100%, 0' } as any;
    case 'zoom': return { ...base, animation: `pres-zoom-${dir === 'out' ? 'out' : 'in'} ${duration}s ${easingMap[easing]} forwards` };
    case 'rotate': return { ...base, animation: `pres-rotate ${duration}s ${easingMap[easing]} forwards` };
    case 'flip': return { ...base, animation: `pres-flip-${dir === 'vertical' ? 'v' : 'h'} ${duration}s ${easingMap[easing]} forwards` };
    case 'wipe': return { ...base, animation: `pres-wipe-${dir || 'left'} ${duration}s ${easingMap[easing]} forwards` };
    case 'cube': return { ...base, animation: `pres-cube ${duration}s ${easingMap[easing]} forwards` };
    case 'curtain': return { ...base, animation: `pres-curtain-${dir === 'close' ? 'close' : 'open'} ${duration}s ${easingMap[easing]} forwards` };
    default: return {};
  }
}

function getObjectAnimationCSS(anim: ObjectAnimation): React.CSSProperties {
  const easingMap: Record<EasingType, string> = {
    'linear': 'linear', 'ease-in': 'ease-in', 'ease-out': 'ease-out', 'ease-in-out': 'ease-in-out',
  };
  const dur = anim.duration;
  const ease = easingMap[anim.easing];
  const delay = anim.delay;
  const repeat = anim.repeat === 0 ? 'infinite' : anim.repeat;

  const animName = `obj-${anim.effect}${anim.direction ? '-' + anim.direction : ''}`;
  return {
    animation: `${animName} ${dur}s ${ease} ${delay}s ${repeat} both`,
  };
}

export const PresentationMode: React.FC = () => {
  const { presentation, currentSlideIndex, setCurrentSlide, setPresentationMode } = usePresentationStore();
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [laserPos, setLaserPos] = useState<{ x: number; y: number } | null>(null);
  const [ctrlHeld, setCtrlHeld] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [animStep, setAnimStep] = useState(-1); // -1 = all onClick anims not yet triggered
  const [triggeredAnims, setTriggeredAnims] = useState<Set<string>>(new Set());
  const startTime = useRef(Date.now());
  const prevSlideRef = useRef(currentSlideIndex);

  const slide = presentation.slides[currentSlideIndex];

  // Collect click-triggered animations in order
  const clickAnims = (slide?.objects || [])
    .flatMap(o => (o.animations || []).filter(a => a.startTrigger === 'onClick').map(a => ({ ...a, objectId: o.id })))
    .sort((a, b) => a.order - b.order);

  // Auto/withPrevious/afterPrevious anims
  const autoAnims = (slide?.objects || [])
    .flatMap(o => (o.animations || []).filter(a => a.startTrigger !== 'onClick').map(a => ({ ...a, objectId: o.id })));

  // Handle slide change - trigger transition
  useEffect(() => {
    if (prevSlideRef.current !== currentSlideIndex) {
      const newSlide = presentation.slides[currentSlideIndex];
      if (newSlide?.transition.type !== 'none') {
        setTransitioning(true);
        setTimeout(() => setTransitioning(false), (newSlide.transition.duration || 0.5) * 1000);
      }
      prevSlideRef.current = currentSlideIndex;
      setAnimStep(-1);
      setTriggeredAnims(new Set());
    }
  }, [currentSlideIndex, presentation.slides]);

  // Auto-trigger non-click animations when slide loads
  useEffect(() => {
    if (!slide) return;
    const newTriggered = new Set<string>();
    autoAnims.forEach(a => newTriggered.add(a.id));
    setTriggeredAnims(prev => {
      const merged = new Set(prev);
      autoAnims.forEach(a => merged.add(a.id));
      return merged;
    });
  }, [currentSlideIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const goNext = useCallback(() => {
    // First advance through click animations
    if (animStep < clickAnims.length - 1) {
      const nextStep = animStep + 1;
      setAnimStep(nextStep);
      setTriggeredAnims(prev => {
        const n = new Set(prev);
        n.add(clickAnims[nextStep].id);
        return n;
      });
      return;
    }
    // Then go to next slide
    if (currentSlideIndex < presentation.slides.length - 1) {
      setCurrentSlide(currentSlideIndex + 1);
    }
  }, [currentSlideIndex, presentation.slides.length, setCurrentSlide, animStep, clickAnims]);

  const goPrev = useCallback(() => {
    if (animStep > -1) {
      setTriggeredAnims(prev => {
        const n = new Set(prev);
        n.delete(clickAnims[animStep].id);
        return n;
      });
      setAnimStep(animStep - 1);
      return;
    }
    if (currentSlideIndex > 0) setCurrentSlide(currentSlideIndex - 1);
  }, [currentSlideIndex, setCurrentSlide, animStep, clickAnims]);

  const exit = useCallback(() => setPresentationMode(false), [setPresentationMode]);

  useEffect(() => {
    const el = document.documentElement;
    el.requestFullscreen?.().catch(() => {});
    return () => { document.exitFullscreen?.().catch(() => {}); };
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000);
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

  const transitionStyle = transitioning && slide.transition.type !== 'none'
    ? getTransitionCSS(slide.transition.type, slide.transition.direction, slide.transition.duration, slide.transition.easing)
    : {};

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: '#000' }}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
    >
      <div
        className="relative overflow-hidden"
        style={{
          width: presentation.slideWidth,
          height: presentation.slideHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          ...bgStyle,
          ...transitionStyle,
        }}
      >
        {slide.objects.map((obj) => {
          // Determine animation style for this object
          const objAnims = (obj.animations || []).filter(a => triggeredAnims.has(a.id));
          const latestAnim = objAnims.length > 0 ? objAnims[objAnims.length - 1] : null;
          const animStyle = latestAnim ? getObjectAnimationCSS(latestAnim) : {};

          // For entrance anims not yet triggered, hide the object
          const hasEntrance = (obj.animations || []).some(a => a.type === 'entrance');
          const entranceTriggered = (obj.animations || []).filter(a => a.type === 'entrance').some(a => triggeredAnims.has(a.id));
          const shouldHide = hasEntrance && !entranceTriggered;

          return (
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
                opacity: shouldHide ? 0 : undefined,
                ...animStyle,
              }}
            >
              {obj.type === 'text' && obj.textProps && (
                <div style={{
                  fontFamily: obj.textProps.fontFamily,
                  fontSize: `${obj.textProps.fontSize}px`,
                  fontWeight: obj.textProps.fontWeight,
                  fontStyle: obj.textProps.fontStyle,
                  textDecoration: obj.textProps.textDecoration !== 'none' ? obj.textProps.textDecoration : undefined,
                  color: obj.textProps.color,
                  textAlign: obj.textProps.textAlign,
                  lineHeight: obj.textProps.lineHeight,
                  backgroundColor: obj.textProps.backgroundColor !== 'transparent' ? obj.textProps.backgroundColor : undefined,
                }}>
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
          );
        })}
      </div>

      {/* Click indicator */}
      {clickAnims.length > 0 && animStep < clickAnims.length - 1 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 text-[hsl(var(--primary-foreground))]/60 text-[10px] pointer-events-none animate-pulse">
          Click to advance ({animStep + 2}/{clickAnims.length + 1})
        </div>
      )}

      {laserPos && <div className="laser-dot" style={{ left: laserPos.x - 6, top: laserPos.y - 6 }} />}

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
