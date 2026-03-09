import React, { useState, useCallback } from 'react';
import { X, Play, Volume2, VolumeX } from 'lucide-react';
import { usePresentationStore } from '@/stores/presentationStore';
import type { TransitionType, TransitionDirection, EasingType, SlideTransition } from '@/types/presentation';

interface Props {
  onClose: () => void;
}

const TRANSITION_TYPES: { type: TransitionType; label: string; directions?: { dir: TransitionDirection; label: string }[] }[] = [
  { type: 'none', label: 'None' },
  { type: 'fade', label: 'Fade' },
  { type: 'slide', label: 'Slide', directions: [
    { dir: 'left', label: '← Left' }, { dir: 'right', label: '→ Right' },
    { dir: 'up', label: '↑ Up' }, { dir: 'down', label: '↓ Down' },
  ]},
  { type: 'push', label: 'Push', directions: [
    { dir: 'left', label: '← Left' }, { dir: 'right', label: '→ Right' },
    { dir: 'up', label: '↑ Up' }, { dir: 'down', label: '↓ Down' },
  ]},
  { type: 'wipe', label: 'Wipe', directions: [
    { dir: 'left', label: '← Left' }, { dir: 'right', label: '→ Right' },
    { dir: 'up', label: '↑ Up' }, { dir: 'down', label: '↓ Down' },
  ]},
  { type: 'zoom', label: 'Zoom', directions: [
    { dir: 'in', label: 'In' }, { dir: 'out', label: 'Out' },
  ]},
  { type: 'rotate', label: 'Rotate' },
  { type: 'flip', label: 'Flip', directions: [
    { dir: 'horizontal', label: 'Horizontal' }, { dir: 'vertical', label: 'Vertical' },
  ]},
  { type: 'cube', label: 'Cube' },
  { type: 'curtain', label: 'Curtain', directions: [
    { dir: 'open', label: 'Open' }, { dir: 'close', label: 'Close' },
  ]},
];

const EASING_OPTIONS: { value: EasingType; label: string }[] = [
  { value: 'linear', label: 'Linear' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In-Out' },
];

export const TransitionsPanel: React.FC<Props> = ({ onClose }) => {
  const store = usePresentationStore();
  const slide = store.getCurrentSlide();
  const transition = slide?.transition || { type: 'none' as TransitionType, direction: 'left' as TransitionDirection, duration: 0.5, easing: 'ease-in-out' as EasingType, sound: false };
  const [previewing, setPreviewing] = useState(false);

  const updateTransition = useCallback((updates: Partial<SlideTransition>) => {
    store.pushHistory();
    const slides = [...store.presentation.slides];
    slides[store.currentSlideIndex] = {
      ...slides[store.currentSlideIndex],
      transition: { ...slides[store.currentSlideIndex].transition, ...updates },
    };
    store.setPresentation({ ...store.presentation, slides, updatedAt: Date.now() });
  }, [store]);

  const applyToAll = useCallback(() => {
    if (!slide) return;
    store.pushHistory();
    const t = slide.transition;
    const slides = store.presentation.slides.map(s => ({ ...s, transition: { ...t } }));
    store.setPresentation({ ...store.presentation, slides, updatedAt: Date.now() });
  }, [store, slide]);

  const handlePreview = useCallback(() => {
    setPreviewing(true);
    setTimeout(() => setPreviewing(false), (transition.duration || 0.5) * 1000 + 100);
  }, [transition.duration]);

  const selectedType = TRANSITION_TYPES.find(t => t.type === transition.type);

  return (
    <div className="w-72 h-full border-l border-[hsl(var(--border))] bg-[hsl(var(--card))] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[hsl(var(--border))]">
        <span className="text-xs font-semibold">Slide Transitions</span>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-[hsl(var(--muted))]">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 flex flex-col gap-4">
        {/* Transition Types */}
        <div>
          <label className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] mb-1.5 block">Type</label>
          <div className="grid grid-cols-3 gap-1.5">
            {TRANSITION_TYPES.map(t => (
              <button
                key={t.type}
                onClick={() => updateTransition({ type: t.type, direction: t.directions?.[0]?.dir || 'left' })}
                className={`rounded border-2 py-2 px-1 text-[10px] text-center transition-all ${
                  transition.type === t.type
                    ? 'border-[hsl(var(--ppt-selection))] bg-[hsl(var(--ppt-active))]'
                    : 'border-[hsl(var(--border))] hover:border-[hsl(var(--ppt-selection))]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Direction */}
        {selectedType?.directions && (
          <div>
            <label className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] mb-1.5 block">Direction</label>
            <div className="flex flex-wrap gap-1">
              {selectedType.directions.map(d => (
                <button
                  key={d.dir}
                  onClick={() => updateTransition({ direction: d.dir })}
                  className={`rounded border px-2.5 py-1 text-[10px] transition-all ${
                    transition.direction === d.dir
                      ? 'border-[hsl(var(--ppt-selection))] bg-[hsl(var(--ppt-active))]'
                      : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Duration */}
        <div>
          <label className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] mb-1.5 block">
            Duration: {transition.duration.toFixed(1)}s
          </label>
          <input
            type="range"
            min="0.3"
            max="3"
            step="0.1"
            value={transition.duration}
            onChange={(e) => updateTransition({ duration: parseFloat(e.target.value) })}
            className="w-full h-1.5 accent-[hsl(var(--ppt-brand))]"
          />
          <div className="flex justify-between text-[8px] text-[hsl(var(--muted-foreground))]">
            <span>0.3s</span><span>3.0s</span>
          </div>
        </div>

        {/* Easing */}
        <div>
          <label className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] mb-1.5 block">Easing</label>
          <select
            className="ppt-select w-full text-xs"
            value={transition.easing}
            onChange={(e) => updateTransition({ easing: e.target.value as EasingType })}
          >
            {EASING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Sound */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))]">Sound Effect</span>
          <button
            onClick={() => updateTransition({ sound: !transition.sound })}
            className={`p-1.5 rounded transition-colors ${
              transition.sound ? 'bg-[hsl(var(--ppt-active))] text-[hsl(var(--ppt-selection))]' : 'hover:bg-[hsl(var(--muted))]'
            }`}
          >
            {transition.sound ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Preview */}
        <div>
          <label className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] mb-1.5 block">Preview</label>
          <div className="relative rounded border border-[hsl(var(--border))] overflow-hidden" style={{ height: 100 }}>
            <div
              className="absolute inset-0 flex items-center justify-center text-[9px] text-[hsl(var(--muted-foreground))]"
              style={{ backgroundColor: 'hsl(var(--muted))' }}
            >
              Previous Slide
            </div>
            <div
              className="absolute inset-0 flex items-center justify-center text-[9px] font-medium"
              style={{
                backgroundColor: 'hsl(var(--card))',
                animation: previewing ? `preview-${transition.type}-${transition.direction || 'left'} ${transition.duration}s ${transition.easing} forwards` : undefined,
                opacity: previewing ? undefined : (transition.type === 'none' ? 1 : 0),
              }}
            >
              Current Slide
            </div>
          </div>
          <button
            onClick={handlePreview}
            disabled={previewing || transition.type === 'none'}
            className="w-full mt-1.5 flex items-center justify-center gap-1 py-1.5 text-[10px] rounded bg-[hsl(var(--ppt-brand))] text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50"
          >
            <Play className="w-3 h-3" /> Preview Transition
          </button>
        </div>

        {/* Apply to all */}
        <button
          onClick={applyToAll}
          className="w-full py-1.5 text-[10px] rounded border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors"
        >
          Apply to All Slides
        </button>
      </div>
    </div>
  );
};
