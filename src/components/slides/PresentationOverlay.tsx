import React, { useEffect, useState, useCallback, useRef } from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import { buildBgStyle } from '@/lib/backgroundUtils';
import { ShapeRenderer } from './ShapeRenderer';
import type { TransitionType, TransitionDirection, EasingType } from '@/types/presentation';

interface Props {
  startIndex: number;
  onExit: () => void;
}

function getTransitionCSS(type: TransitionType, dir: TransitionDirection, duration: number, easing: EasingType): React.CSSProperties {
  const easingMap: Record<EasingType, string> = {
    'linear': 'linear', 'ease-in': 'ease-in', 'ease-out': 'ease-out', 'ease-in-out': 'ease-in-out',
  };
  switch (type) {
    case 'fade': return { animation: `pres-fade-in ${duration}s ${easingMap[easing]} forwards` };
    case 'slide': case 'push': {
      const dirs: Record<string, string> = { left: '-100%, 0', right: '100%, 0', up: '0, -100%', down: '0, 100%' };
      const result: React.CSSProperties & Record<string, string> = { animation: `pres-slide-from ${duration}s ${easingMap[easing]} forwards`, '--slide-from': dirs[dir] || '-100%, 0' };
      return result;
    }
    case 'zoom': return { animation: `pres-zoom-${dir === 'out' ? 'out' : 'in'} ${duration}s ${easingMap[easing]} forwards` };
    case 'rotate': return { animation: `pres-rotate ${duration}s ${easingMap[easing]} forwards` };
    case 'flip': return { animation: `pres-flip-${dir === 'vertical' ? 'v' : 'h'} ${duration}s ${easingMap[easing]} forwards` };
    case 'wipe': return { animation: `pres-wipe-${dir || 'left'} ${duration}s ${easingMap[easing]} forwards` };
    case 'cube': return { animation: `pres-cube ${duration}s ${easingMap[easing]} forwards` };
    case 'curtain': return { animation: `pres-curtain-${dir === 'close' ? 'close' : 'open'} ${duration}s ${easingMap[easing]} forwards` };
    default: return {};
  }
}

export const PresentationOverlay: React.FC<Props> = ({ startIndex, onExit }) => {
  const { presentation } = usePresentationStore();
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [transitioning, setTransitioning] = useState(false);
  const prevIdxRef = useRef(startIndex);
  const slide = presentation.slides[currentIndex];

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, presentation.slides.length - 1));
  }, [presentation.slides.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  useEffect(() => {
    if (prevIdxRef.current !== currentIndex) {
      const s = presentation.slides[currentIndex];
      if (s?.transition.type !== 'none') {
        setTransitioning(true);
        setTimeout(() => setTransitioning(false), (s.transition.duration || 0.5) * 1000);
      }
      prevIdxRef.current = currentIndex;
    }
  }, [currentIndex, presentation.slides]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit();
      if (e.key === 'ArrowRight' || e.key === ' ') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, onExit]);

  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => { document.exitFullscreen?.().catch(() => {}); };
  }, []);

  if (!slide) return null;

  const bgStyle: React.CSSProperties = buildBgStyle(slide.background);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = Math.min(vw / presentation.slideWidth, vh / presentation.slideHeight);

  const transitionStyle = transitioning && slide.transition.type !== 'none'
    ? getTransitionCSS(slide.transition.type, slide.transition.direction, slide.transition.duration, slide.transition.easing)
    : {};

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black cursor-none" onClick={goNext}>
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
                width: '100%', height: '100%',
              }}>
                {obj.textProps.content}
              </div>
            )}
            {obj.type === 'shape' && <ShapeRenderer obj={obj} />}
            {obj.type === 'image' && obj.imageProps && (() => {
              const ip = obj.imageProps!;
              const f = ip.filters || { grayscale: 0, sepia: 0, blur: 0, brightness: 100, contrast: 100, saturation: 100 };
              const filterStr = [f.grayscale ? `grayscale(${f.grayscale}%)` : '', f.sepia ? `sepia(${f.sepia}%)` : '', f.blur ? `blur(${f.blur}px)` : '', f.brightness !== 100 ? `brightness(${f.brightness}%)` : '', f.contrast !== 100 ? `contrast(${f.contrast}%)` : '', f.saturation !== 100 ? `saturate(${f.saturation}%)` : ''].filter(Boolean).join(' ') || undefined;
              return <img src={ip.src} alt="" className="w-full h-full" style={{ objectFit: ip.objectFit, opacity: ip.opacity / 100, filter: filterStr, borderRadius: ip.cornerRadius ? `${ip.cornerRadius}px` : undefined }} draggable={false} />;
            })()}
          </div>
        ))}
      </div>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs select-none pointer-events-none">
        {currentIndex + 1} / {presentation.slides.length}
      </div>
    </div>
  );
};
