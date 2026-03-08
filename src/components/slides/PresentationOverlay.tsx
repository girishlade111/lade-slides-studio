import React, { useEffect, useState, useCallback } from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import { ShapeRenderer } from './ShapeRenderer';

interface Props {
  startIndex: number;
  onExit: () => void;
}

export const PresentationOverlay: React.FC<Props> = ({ startIndex, onExit }) => {
  const { presentation } = usePresentationStore();
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const slide = presentation.slides[currentIndex];

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, presentation.slides.length - 1));
  }, [presentation.slides.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

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

  const bgStyle: React.CSSProperties = {};
  if (slide.background.type === 'color') bgStyle.backgroundColor = slide.background.value;
  else if (slide.background.type === 'gradient') {
    bgStyle.background = `linear-gradient(${slide.background.gradientDirection || '135deg'}, ${slide.background.value}, ${slide.background.secondaryValue || '#fff'})`;
  } else if (slide.background.type === 'image') {
    bgStyle.backgroundImage = `url(${slide.background.value})`;
    bgStyle.backgroundSize = 'cover';
    bgStyle.backgroundPosition = 'center';
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = Math.min(vw / presentation.slideWidth, vh / presentation.slideHeight);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black cursor-none"
      onClick={goNext}
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
                  backgroundColor: obj.textProps.backgroundColor !== 'transparent' ? obj.textProps.backgroundColor : undefined,
                  width: '100%',
                  height: '100%',
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
              return <img src={ip.src} alt="" className="w-full h-full" style={{ objectFit: ip.objectFit, opacity: ip.opacity / 100, filter: filterStr, borderRadius: ip.cornerRadius ? `${ip.cornerRadius}px` : undefined }} draggable={false} />;
            })()}
          </div>
        ))}
      </div>

      {/* Slide counter */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs select-none pointer-events-none">
        {currentIndex + 1} / {presentation.slides.length}
      </div>
    </div>
  );
};
