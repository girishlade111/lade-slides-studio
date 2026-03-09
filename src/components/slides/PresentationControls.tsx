import React from 'react';
import {
  ChevronLeft, ChevronRight, Pen, Pointer, X, Eraser, Trash2,
  Monitor, Grid3X3,
} from 'lucide-react';

interface PresentationControlsProps {
  currentIndex: number;
  totalSlides: number;
  elapsed: number;
  penActive: boolean;
  laserActive: boolean;
  penColor: string;
  isEraser: boolean;
  onPrev: () => void;
  onNext: () => void;
  onExit: () => void;
  onTogglePen: () => void;
  onToggleLaser: () => void;
  onSetPenColor: (c: string) => void;
  onToggleEraser: () => void;
  onClearDrawings: () => void;
  onTogglePresenterView: () => void;
  onToggleGrid: () => void;
}

const PEN_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#000000'];

const formatTime = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

export const PresentationControls: React.FC<PresentationControlsProps> = ({
  currentIndex, totalSlides, elapsed,
  penActive, laserActive, penColor, isEraser,
  onPrev, onNext, onExit,
  onTogglePen, onToggleLaser, onSetPenColor, onToggleEraser, onClearDrawings,
  onTogglePresenterView, onToggleGrid,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[10010] opacity-0 hover:opacity-100 transition-opacity duration-300">
      <div className="flex items-center justify-center pb-3">
        <div className="flex items-center gap-1 bg-black/80 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-2xl">
          {/* Navigation */}
          <button onClick={onPrev} className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors" title="Previous (←)">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-white/90 text-xs font-medium px-2 min-w-[60px] text-center">
            {currentIndex + 1} / {totalSlides}
          </span>
          <button onClick={onNext} className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors" title="Next (→)">
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-white/30 mx-1" />

          {/* Timer */}
          <span className="text-white/60 text-[10px] font-mono px-1">{formatTime(elapsed)}</span>

          <div className="w-px h-5 bg-white/30 mx-1" />

          {/* Pen tool */}
          <button
            onClick={onTogglePen}
            className={`p-1.5 rounded-full transition-colors ${penActive && !isEraser ? 'bg-white/30 text-white' : 'hover:bg-white/20 text-white/70'}`}
            title="Pen (E)"
          >
            <Pen className="w-3.5 h-3.5" />
          </button>

          {penActive && (
            <>
              {PEN_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => onSetPenColor(c)}
                  className={`w-4 h-4 rounded-full border-2 transition-transform ${penColor === c ? 'border-white scale-125' : 'border-white/40'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <button
                onClick={onToggleEraser}
                className={`p-1.5 rounded-full transition-colors ${isEraser ? 'bg-white/30 text-white' : 'hover:bg-white/20 text-white/70'}`}
                title="Eraser"
              >
                <Eraser className="w-3.5 h-3.5" />
              </button>
              <button onClick={onClearDrawings} className="p-1.5 rounded-full hover:bg-white/20 text-white/70 transition-colors" title="Clear drawings">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* Laser */}
          <button
            onClick={onToggleLaser}
            className={`p-1.5 rounded-full transition-colors ${laserActive ? 'bg-red-500/50 text-white' : 'hover:bg-white/20 text-white/70'}`}
            title="Laser pointer (Ctrl+mouse)"
          >
            <Pointer className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-5 bg-white/30 mx-1" />

          {/* Grid view */}
          <button onClick={onToggleGrid} className="p-1.5 rounded-full hover:bg-white/20 text-white/70 transition-colors" title="Thumbnail grid (G)">
            <Grid3X3 className="w-3.5 h-3.5" />
          </button>

          {/* Presenter view */}
          <button onClick={onTogglePresenterView} className="p-1.5 rounded-full hover:bg-white/20 text-white/70 transition-colors" title="Presenter view (S)">
            <Monitor className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-5 bg-white/30 mx-1" />

          {/* Exit */}
          <button onClick={onExit} className="p-1.5 rounded-full hover:bg-red-500/40 text-white/70 transition-colors" title="Exit (Esc)">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
