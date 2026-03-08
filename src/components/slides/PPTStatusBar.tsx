import React from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import { Grid3X3, Minus, Plus, Monitor, LayoutGrid, StickyNote } from 'lucide-react';

export const PPTStatusBar: React.FC = () => {
  const {
    presentation, currentSlideIndex, zoom, setZoom,
    showGrid, setShowGrid, setPresentationMode,
  } = usePresentationStore();

  const zoomLevels = [50, 75, 100, 150, 200];
  const zoomIdx = zoomLevels.indexOf(zoom);

  return (
    <div className="ppt-status-bar">
      {/* Left: slide info */}
      <span className="text-[11px]">Slide {currentSlideIndex + 1} of {presentation.slides.length}</span>
      
      <div className="flex-1" />

      {/* Center: view buttons */}
      <div className="flex items-center gap-0.5">
        <button
          className="p-1 rounded hover:bg-black/5 transition-colors"
          title="Normal View"
        >
          <Monitor className="w-3.5 h-3.5" />
        </button>
        <button
          className={`p-1 rounded transition-colors ${showGrid ? 'bg-black/10' : 'hover:bg-black/5'}`}
          onClick={() => setShowGrid(!showGrid)}
          title="Grid"
        >
          <Grid3X3 className="w-3.5 h-3.5" />
        </button>
        <button
          className="p-1 rounded hover:bg-black/5 transition-colors"
          onClick={() => setPresentationMode(true)}
          title="Slide Show"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="w-px h-3 bg-[hsl(var(--border))] mx-2" />

      {/* Right: zoom */}
      <div className="flex items-center gap-1">
        <button
          className="p-0.5 rounded hover:bg-black/5 disabled:opacity-30"
          onClick={() => { if (zoomIdx > 0) setZoom(zoomLevels[zoomIdx - 1]); }}
          disabled={zoomIdx <= 0}
        >
          <Minus className="w-3 h-3" />
        </button>
        <div className="relative w-24 h-1 bg-black/10 rounded-full">
          <input
            type="range"
            min="0"
            max={zoomLevels.length - 1}
            step="1"
            value={zoomIdx >= 0 ? zoomIdx : 2}
            onChange={(e) => setZoom(zoomLevels[Number(e.target.value)])}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
          <div
            className="absolute top-0 left-0 h-1 bg-[hsl(var(--accent))] rounded-full transition-all"
            style={{ width: `${((zoomIdx >= 0 ? zoomIdx : 2) / (zoomLevels.length - 1)) * 100}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white border border-[hsl(var(--accent))] rounded-full shadow-sm transition-all"
            style={{ left: `calc(${((zoomIdx >= 0 ? zoomIdx : 2) / (zoomLevels.length - 1)) * 100}% - 5px)` }}
          />
        </div>
        <button
          className="p-0.5 rounded hover:bg-black/5 disabled:opacity-30"
          onClick={() => { if (zoomIdx < zoomLevels.length - 1) setZoom(zoomLevels[zoomIdx + 1]); }}
          disabled={zoomIdx >= zoomLevels.length - 1}
        >
          <Plus className="w-3 h-3" />
        </button>
        <span className="text-[10px] text-[hsl(var(--muted-foreground))] min-w-[2.5rem] text-right">{zoom}%</span>
      </div>
    </div>
  );
};
