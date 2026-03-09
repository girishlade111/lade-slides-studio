import React, { useState, useEffect, useRef } from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import { buildBgStyle } from '@/lib/backgroundUtils';
import { ShapeRenderer } from './ShapeRenderer';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, X } from 'lucide-react';

interface PresenterViewProps {
  currentIndex: number;
  elapsed: number;
  paused: boolean;
  onNext: () => void;
  onPrev: () => void;
  onJump: (i: number) => void;
  onExit: () => void;
  onTogglePause: () => void;
  onResetTimer: () => void;
}

const formatTime = (s: number) =>
  `${Math.floor(s / 3600).toString().padStart(2, '0')}:${Math.floor((s % 3600) / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

export const PresenterView: React.FC<PresenterViewProps> = ({
  currentIndex, elapsed, paused,
  onNext, onPrev, onJump, onExit, onTogglePause, onResetTimer,
}) => {
  const { presentation } = usePresentationStore();
  const [slideElapsed, setSlideElapsed] = useState(0);
  const slideStartRef = useRef(Date.now());
  const notesRef = useRef<HTMLDivElement>(null);

  const slide = presentation.slides[currentIndex];
  const nextSlide = presentation.slides[currentIndex + 1];

  // Track per-slide timer
  useEffect(() => {
    slideStartRef.current = Date.now();
    setSlideElapsed(0);
  }, [currentIndex]);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setSlideElapsed(Math.floor((Date.now() - slideStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [paused, currentIndex]);

  const renderSlidePreview = (s: typeof slide, scale: number) => {
    if (!s) return <div className="w-full h-full bg-black/20 flex items-center justify-center text-white/40 text-sm">End of presentation</div>;
    const bgStyle = buildBgStyle(s.background);
    return (
      <div className="relative w-full h-full overflow-hidden" style={bgStyle}>
        {s.objects.map(obj => (
          <div
            key={obj.id}
            className="absolute"
            style={{
              left: obj.position.x * scale,
              top: obj.position.y * scale,
              width: obj.size.width * scale,
              height: obj.size.height * scale,
              transform: obj.rotation ? `rotate(${obj.rotation}deg)` : undefined,
              zIndex: obj.zIndex,
            }}
          >
            {obj.type === 'text' && obj.textProps && (
              <div style={{
                fontFamily: obj.textProps.fontFamily,
                fontSize: `${obj.textProps.fontSize * scale}px`,
                fontWeight: obj.textProps.fontWeight,
                fontStyle: obj.textProps.fontStyle,
                color: obj.textProps.color,
                textAlign: obj.textProps.textAlign,
                lineHeight: obj.textProps.lineHeight,
              }}>
                {obj.textProps.content}
              </div>
            )}
            {obj.type === 'shape' && <ShapeRenderer obj={obj} />}
            {obj.type === 'image' && obj.imageProps && (
              <img src={obj.imageProps.src} alt="" className="w-full h-full" style={{ objectFit: obj.imageProps.objectFit }} draggable={false} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-[#1a1a2e] flex">
      {/* Left side - Current slide */}
      <div className="flex-[6] flex flex-col p-4 gap-3">
        <div className="flex-1 bg-black rounded-lg overflow-hidden flex items-center justify-center relative">
          <div
            className="relative"
            style={{
              width: presentation.slideWidth * 0.65,
              height: presentation.slideHeight * 0.65,
            }}
          >
            {slide && renderSlidePreview(slide, 0.65)}
          </div>
        </div>

        {/* Slide navigation strip */}
        <div className="h-20 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {presentation.slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => onJump(i)}
              className={`flex-shrink-0 rounded border-2 overflow-hidden transition-all ${
                i === currentIndex ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-white/20 hover:border-white/50'
              }`}
              style={{ width: 106, height: 60 }}
            >
              <div className="w-full h-full relative" style={{ transform: 'scale(1)', transformOrigin: 'top left' }}>
                {renderSlidePreview(s, 106 / presentation.slideWidth)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right side - Presenter panel */}
      <div className="flex-[4] flex flex-col p-4 gap-3 border-l border-white/10">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <span className="text-white/80 text-sm font-medium">Presenter View</span>
          <button onClick={onExit} className="p-1.5 rounded hover:bg-white/10 text-white/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Next slide preview */}
        <div className="flex-shrink-0">
          <span className="text-white/50 text-[10px] uppercase tracking-wider mb-1 block">Next Slide</span>
          <div className="bg-black rounded-lg overflow-hidden" style={{ height: 140 }}>
            <div className="w-full h-full flex items-center justify-center">
              <div style={{ width: 248, height: 140 }} className="relative">
                {renderSlidePreview(nextSlide, 248 / presentation.slideWidth)}
              </div>
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/50 text-[10px] uppercase tracking-wider">Timer</span>
            <div className="flex gap-1">
              <button onClick={onTogglePause} className="p-1 rounded hover:bg-white/10 text-white/60 transition-colors">
                {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              </button>
              <button onClick={onResetTimer} className="p-1 rounded hover:bg-white/10 text-white/60 transition-colors">
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="text-white font-mono text-3xl text-center">
            {formatTime(elapsed)}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-white/40">
            <span>This slide: {formatTime(slideElapsed)}</span>
            <span>Slide {currentIndex + 1} of {presentation.slides.length}</span>
          </div>
        </div>

        {/* Speaker notes */}
        <div className="flex-1 flex flex-col min-h-0">
          <span className="text-white/50 text-[10px] uppercase tracking-wider mb-1">Speaker Notes</span>
          <div
            ref={notesRef}
            className="flex-1 bg-white/5 rounded-lg p-3 overflow-y-auto scrollbar-thin text-white/80 text-sm leading-relaxed"
          >
            {slide?.notes || <span className="text-white/30 italic">No notes for this slide</span>}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPrev}
            disabled={currentIndex === 0}
            className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white text-xs flex items-center justify-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <button
            onClick={onNext}
            disabled={currentIndex === presentation.slides.length - 1}
            className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white text-xs flex items-center justify-center gap-1 transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
