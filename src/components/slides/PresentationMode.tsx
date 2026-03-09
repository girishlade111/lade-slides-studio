import React, { useEffect, useState, useCallback, useRef } from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import { buildBgStyle } from '@/lib/backgroundUtils';
import { ShapeRenderer } from './ShapeRenderer';
import { DrawingCanvas, clearDrawingCanvas } from './DrawingCanvas';
import { PresentationControls } from './PresentationControls';
import { PresenterView } from './PresenterView';
import type { TransitionType, TransitionDirection, EasingType, ObjectAnimation } from '@/types/presentation';

/* ---- Transition CSS generator ---- */
function getTransitionCSS(type: TransitionType, dir: TransitionDirection, duration: number, easing: EasingType): React.CSSProperties {
  const easingMap: Record<EasingType, string> = {
    'linear': 'linear', 'ease-in': 'ease-in', 'ease-out': 'ease-out', 'ease-in-out': 'ease-in-out',
  };
  const base: React.CSSProperties = { transition: `all ${duration}s ${easingMap[easing]}` };
  switch (type) {
    case 'fade': return { ...base, animation: `pres-fade-in ${duration}s ${easingMap[easing]} forwards` };
    case 'slide': case 'push': {
      const dirs: Record<string, string> = { left: '-100%, 0', right: '100%, 0', up: '0, -100%', down: '0, 100%' };
      return { ...base, animation: `pres-slide-from ${duration}s ${easingMap[easing]} forwards`, '--slide-from': dirs[dir] || '-100%, 0' } as any;
    }
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
  const repeat = anim.repeat === 0 ? 'infinite' : anim.repeat;
  const animName = `obj-${anim.effect}${anim.direction ? '-' + anim.direction : ''}`;
  return { animation: `${animName} ${anim.duration}s ${easingMap[anim.easing]} ${anim.delay}s ${repeat} both` };
}

type BlankScreen = 'none' | 'black' | 'white';

export const PresentationMode: React.FC = () => {
  const { presentation, currentSlideIndex, setCurrentSlide, setPresentationMode } = usePresentationStore();

  // Core state
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [blankScreen, setBlankScreen] = useState<BlankScreen>('none');
  const [transitioning, setTransitioning] = useState(false);
  const [animStep, setAnimStep] = useState(-1);
  const [triggeredAnims, setTriggeredAnims] = useState<Set<string>>(new Set());

  // Tools state
  const [penActive, setPenActive] = useState(false);
  const [penColor, setPenColor] = useState('#ef4444');
  const [penSize] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [laserActive, setLaserActive] = useState(false);
  const [laserPos, setLaserPos] = useState<{ x: number; y: number } | null>(null);
  const [ctrlHeld, setCtrlHeld] = useState(false);

  // View state
  const [presenterView, setPresenterView] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [numberBuffer, setNumberBuffer] = useState('');

  const startTime = useRef(Date.now());
  const prevSlideRef = useRef(currentSlideIndex);
  

  const slide = presentation.slides[currentSlideIndex];

  // Click-triggered animations
  const clickAnims = (slide?.objects || [])
    .flatMap(o => (o.animations || []).filter(a => a.startTrigger === 'onClick').map(a => ({ ...a, objectId: o.id })))
    .sort((a, b) => a.order - b.order);

  const autoAnims = (slide?.objects || [])
    .flatMap(o => (o.animations || []).filter(a => a.startTrigger !== 'onClick').map(a => ({ ...a, objectId: o.id })));

  // Handle slide change transitions
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
      // Clear drawing canvas on slide change
      const slideContainer = document.querySelector('[data-pres-slide]');
      const canvas = slideContainer?.querySelector('canvas');
      clearDrawingCanvas(canvas);
    }
  }, [currentSlideIndex, presentation.slides]);

  // Auto-trigger non-click animations
  useEffect(() => {
    if (!slide) return;
    setTriggeredAnims(prev => {
      const merged = new Set(prev);
      autoAnims.forEach(a => merged.add(a.id));
      return merged;
    });
  }, [currentSlideIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const goNext = useCallback(() => {
    if (blankScreen !== 'none') { setBlankScreen('none'); return; }
    if (animStep < clickAnims.length - 1) {
      const nextStep = animStep + 1;
      setAnimStep(nextStep);
      setTriggeredAnims(prev => { const n = new Set(prev); n.add(clickAnims[nextStep].id); return n; });
      return;
    }
    if (currentSlideIndex < presentation.slides.length - 1) setCurrentSlide(currentSlideIndex + 1);
  }, [currentSlideIndex, presentation.slides.length, setCurrentSlide, animStep, clickAnims, blankScreen]);

  const goPrev = useCallback(() => {
    if (blankScreen !== 'none') { setBlankScreen('none'); return; }
    if (animStep > -1) {
      setTriggeredAnims(prev => { const n = new Set(prev); n.delete(clickAnims[animStep].id); return n; });
      setAnimStep(animStep - 1);
      return;
    }
    if (currentSlideIndex > 0) setCurrentSlide(currentSlideIndex - 1);
  }, [currentSlideIndex, setCurrentSlide, animStep, clickAnims, blankScreen]);

  const exit = useCallback(() => {
    setPresentationMode(false);
  }, [setPresentationMode]);

  const jumpToSlide = useCallback((i: number) => {
    if (i >= 0 && i < presentation.slides.length) {
      setCurrentSlide(i);
      setShowGrid(false);
    }
  }, [presentation.slides.length, setCurrentSlide]);

  // Fullscreen
  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => { document.exitFullscreen?.().catch(() => {}); };
  }, []);

  // Timer
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [paused]);

  // Number buffer timeout
  useEffect(() => {
    if (!numberBuffer) return;
    const timer = setTimeout(() => setNumberBuffer(''), 2000);
    return () => clearTimeout(timer);
  }, [numberBuffer]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Number input for jump-to-slide
      if (e.key >= '0' && e.key <= '9') {
        setNumberBuffer(prev => prev + e.key);
        return;
      }
      if (e.key === 'Enter' && numberBuffer) {
        const num = parseInt(numberBuffer, 10);
        if (num >= 1 && num <= presentation.slides.length) jumpToSlide(num - 1);
        setNumberBuffer('');
        return;
      }

      switch (e.key) {
        case 'Escape': exit(); break;
        case 'ArrowRight': case ' ': e.preventDefault(); goNext(); break;
        case 'ArrowLeft': case 'Backspace': goPrev(); break;
        case 'Home': jumpToSlide(0); break;
        case 'End': jumpToSlide(presentation.slides.length - 1); break;
        case 'p': case 'P': setBlankScreen(prev => prev === 'black' ? 'none' : 'black'); break;
        case 'w': case 'W': setBlankScreen(prev => prev === 'white' ? 'none' : 'white'); break;
        case 'b': case 'B': setBlankScreen('black'); break;
        case '.': setBlankScreen(prev => prev !== 'none' ? 'none' : 'black'); break;
        case 'e': case 'E': setPenActive(prev => !prev); setIsEraser(false); break;
        case 's': case 'S': setPresenterView(prev => !prev); break;
        case 'g': case 'G': setShowGrid(prev => !prev); break;
        case 'Control': setCtrlHeld(true); break;
      }
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
  }, [goNext, goPrev, exit, jumpToSlide, numberBuffer, presentation.slides.length]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (ctrlHeld || laserActive) setLaserPos({ x: e.clientX, y: e.clientY });
    else setLaserPos(null);
  }, [ctrlHeld, laserActive]);

  const handleClick = useCallback(() => {
    if (penActive) return; // Don't advance when drawing
    if (!ctrlHeld && !laserActive) goNext();
  }, [ctrlHeld, laserActive, penActive, goNext]);

  const handleClearDrawings = useCallback(() => {
    const slideContainer = document.querySelector('[data-pres-slide]');
    const canvas = slideContainer?.querySelector('canvas');
    clearDrawingCanvas(canvas);
  }, []);

  const resetTimer = useCallback(() => {
    startTime.current = Date.now();
    setElapsed(0);
  }, []);

  if (!slide) return null;

  // Presenter view
  if (presenterView) {
    return (
      <PresenterView
        currentIndex={currentSlideIndex}
        elapsed={elapsed}
        paused={paused}
        onNext={goNext}
        onPrev={goPrev}
        onJump={jumpToSlide}
        onExit={exit}
        onTogglePause={() => setPaused(p => !p)}
        onResetTimer={resetTimer}
      />
    );
  }

  // Blank screen
  if (blankScreen !== 'none') {
    return (
      <div
        className="fixed inset-0 z-[9999] cursor-none"
        style={{ backgroundColor: blankScreen === 'black' ? '#000' : '#fff' }}
        onClick={() => setBlankScreen('none')}
        onKeyDown={() => setBlankScreen('none')}
      />
    );
  }

  // Grid view
  if (showGrid) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/95 p-8 overflow-auto" onClick={(e) => { if (e.target === e.currentTarget) setShowGrid(false); }}>
        <div className="grid grid-cols-4 gap-4 max-w-6xl mx-auto">
          {presentation.slides.map((s, i) => {
            const bgStyle = buildBgStyle(s.background);
            return (
              <button
                key={s.id}
                onClick={() => jumpToSlide(i)}
                className={`rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                  i === currentSlideIndex ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-white/20 hover:border-white/50'
                }`}
              >
                <div className="relative" style={{ aspectRatio: `${presentation.slideWidth}/${presentation.slideHeight}`, ...bgStyle }}>
                  {s.objects.map(obj => {
                    const sc = 240 / presentation.slideWidth;
                    return (
                      <div
                        key={obj.id}
                        className="absolute"
                        style={{
                          left: obj.position.x * sc,
                          top: obj.position.y * sc,
                          width: obj.size.width * sc,
                          height: obj.size.height * sc,
                          zIndex: obj.zIndex,
                        }}
                      >
                        {obj.type === 'text' && obj.textProps && (
                          <div style={{
                            fontFamily: obj.textProps.fontFamily,
                            fontSize: `${obj.textProps.fontSize * sc}px`,
                            fontWeight: obj.textProps.fontWeight,
                            color: obj.textProps.color,
                            textAlign: obj.textProps.textAlign,
                          }}>
                            {obj.textProps.content}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="bg-black/60 px-2 py-1 text-white/80 text-xs text-center">
                  Slide {i + 1}
                </div>
              </button>
            );
          })}
        </div>
        <div className="text-center mt-6 text-white/40 text-xs">Click a slide to jump to it, or press G to close</div>
      </div>
    );
  }

  // Normal presentation mode
  const bgStyle: React.CSSProperties = { backgroundColor: '#000', ...buildBgStyle(slide.background) };

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
        data-pres-slide
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
        {/* Slide objects */}
        {slide.objects.map((obj) => {
          const objAnims = (obj.animations || []).filter(a => triggeredAnims.has(a.id));
          const latestAnim = objAnims.length > 0 ? objAnims[objAnims.length - 1] : null;
          const animStyle = latestAnim ? getObjectAnimationCSS(latestAnim) : {};
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

        {/* Drawing canvas overlay */}
        <DrawingCanvas
          width={presentation.slideWidth}
          height={presentation.slideHeight}
          active={penActive}
          penColor={penColor}
          penSize={penSize}
          isEraser={isEraser}
        />
      </div>

      {/* Click indicator */}
      {clickAnims.length > 0 && animStep < clickAnims.length - 1 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 text-white/40 text-[10px] pointer-events-none animate-pulse">
          Click to advance ({animStep + 2}/{clickAnims.length + 1})
        </div>
      )}

      {/* Number buffer display */}
      {numberBuffer && (
        <div className="fixed top-4 right-4 bg-black/80 text-white font-mono text-lg px-3 py-1 rounded pointer-events-none z-[10020]">
          Go to: {numberBuffer}
        </div>
      )}

      {/* Laser pointer */}
      {laserPos && (
        <div
          className="fixed pointer-events-none z-[10020]"
          style={{
            left: laserPos.x - 8,
            top: laserPos.y - 8,
            width: 16,
            height: 16,
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.9)',
            boxShadow: '0 0 20px 8px rgba(239, 68, 68, 0.4), 0 0 40px 16px rgba(239, 68, 68, 0.2)',
          }}
        />
      )}

      {/* Controls overlay */}
      <PresentationControls
        currentIndex={currentSlideIndex}
        totalSlides={presentation.slides.length}
        elapsed={elapsed}
        penActive={penActive}
        laserActive={laserActive}
        penColor={penColor}
        isEraser={isEraser}
        onPrev={() => goPrev()}
        onNext={() => goNext()}
        onExit={() => exit()}
        onTogglePen={() => { setPenActive(p => !p); setIsEraser(false); }}
        onToggleLaser={() => setLaserActive(p => !p)}
        onSetPenColor={(c) => { setPenColor(c); setIsEraser(false); }}
        onToggleEraser={() => setIsEraser(p => !p)}
        onClearDrawings={handleClearDrawings}
        onTogglePresenterView={() => setPresenterView(true)}
        onToggleGrid={() => setShowGrid(true)}
      />
    </div>
  );
};
