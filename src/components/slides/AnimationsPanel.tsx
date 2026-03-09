import React, { useState, useCallback } from 'react';
import { X, Play, Trash2, GripVertical, Plus } from 'lucide-react';
import { usePresentationStore } from '@/stores/presentationStore';
import type {
  AnimationCategory, AnimationEffect, AnimationTrigger, EasingType,
  TransitionDirection, ObjectAnimation, SlideObject,
} from '@/types/presentation';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  onClose: () => void;
}

interface AnimDef { effect: AnimationEffect; label: string; directions?: TransitionDirection[] }

const ENTRANCE_ANIMS: AnimDef[] = [
  { effect: 'fadeIn', label: 'Fade In' },
  { effect: 'flyIn', label: 'Fly In', directions: ['left', 'right', 'up', 'down'] },
  { effect: 'zoomIn', label: 'Zoom In' },
  { effect: 'bounceIn', label: 'Bounce In' },
  { effect: 'rotateIn', label: 'Rotate In' },
  { effect: 'wipeIn', label: 'Wipe In', directions: ['left', 'right', 'up', 'down'] },
  { effect: 'slideIn', label: 'Slide In', directions: ['left', 'right', 'up', 'down'] },
  { effect: 'growIn', label: 'Grow In' },
];

const EMPHASIS_ANIMS: AnimDef[] = [
  { effect: 'pulse', label: 'Pulse' },
  { effect: 'shake', label: 'Shake' },
  { effect: 'spin', label: 'Spin' },
  { effect: 'bounce', label: 'Bounce' },
  { effect: 'colorFlash', label: 'Color Flash' },
  { effect: 'growShrink', label: 'Grow/Shrink' },
  { effect: 'teeter', label: 'Teeter' },
];

const EXIT_ANIMS: AnimDef[] = [
  { effect: 'fadeOut', label: 'Fade Out' },
  { effect: 'flyOut', label: 'Fly Out', directions: ['left', 'right', 'up', 'down'] },
  { effect: 'zoomOut', label: 'Zoom Out' },
  { effect: 'collapse', label: 'Collapse' },
  { effect: 'rotateOut', label: 'Rotate Out' },
  { effect: 'wipeOut', label: 'Wipe Out', directions: ['left', 'right', 'up', 'down'] },
  { effect: 'slideOut', label: 'Slide Out', directions: ['left', 'right', 'up', 'down'] },
];

const TRIGGER_OPTIONS: { value: AnimationTrigger; label: string }[] = [
  { value: 'onClick', label: 'On Click' },
  { value: 'withPrevious', label: 'With Previous' },
  { value: 'afterPrevious', label: 'After Previous' },
  { value: 'auto', label: 'Auto (delay)' },
];

const EASING_OPTIONS: { value: EasingType; label: string }[] = [
  { value: 'linear', label: 'Linear' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In-Out' },
];

const CATEGORY_COLORS: Record<AnimationCategory, string> = {
  entrance: 'hsl(142 76% 36%)',
  emphasis: 'hsl(38 92% 50%)',
  exit: 'hsl(0 84% 60%)',
};

export const AnimationsPanel: React.FC<Props> = ({ onClose }) => {
  const store = usePresentationStore();
  const [tab, setTab] = useState<AnimationCategory>('entrance');
  const [selectedAnimId, setSelectedAnimId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const slide = store.getCurrentSlide();
  const selectedObjIds = store.selectedObjectIds;
  const selectedObj = slide?.objects.find(o => selectedObjIds.includes(o.id));

  const allAnimations = (slide?.objects || [])
    .flatMap(o => (o.animations || []).map(a => ({ ...a, objectId: o.id, objectLabel: getObjLabel(o) })))
    .sort((a, b) => a.order - b.order);

  const selectedAnim = selectedAnimId
    ? allAnimations.find(a => a.id === selectedAnimId)
    : null;

  const addAnimation = useCallback((effect: AnimationEffect, type: AnimationCategory, direction?: TransitionDirection) => {
    if (!selectedObj || !slide) return;
    const existing = selectedObj.animations || [];
    const maxOrder = allAnimations.length > 0 ? Math.max(...allAnimations.map(a => a.order)) : -1;
    const newAnim: ObjectAnimation = {
      id: uuidv4(),
      type,
      effect,
      direction,
      startTrigger: 'onClick',
      delay: 0,
      duration: 0.5,
      easing: 'ease-in-out',
      repeat: 1,
      order: maxOrder + 1,
    };
    store.pushHistory();
    store.updateObject(store.currentSlideIndex, selectedObj.id, {
      animations: [...existing, newAnim],
    });
    setSelectedAnimId(newAnim.id);
  }, [selectedObj, slide, allAnimations, store]);

  const updateAnimation = useCallback((animId: string, updates: Partial<ObjectAnimation>) => {
    if (!slide) return;
    const obj = slide.objects.find(o => o.animations?.some(a => a.id === animId));
    if (!obj) return;
    store.updateObject(store.currentSlideIndex, obj.id, {
      animations: (obj.animations || []).map(a => a.id === animId ? { ...a, ...updates } : a),
    });
  }, [slide, store]);

  const removeAnimation = useCallback((animId: string) => {
    if (!slide) return;
    const obj = slide.objects.find(o => o.animations?.some(a => a.id === animId));
    if (!obj) return;
    store.pushHistory();
    store.updateObject(store.currentSlideIndex, obj.id, {
      animations: (obj.animations || []).filter(a => a.id !== animId),
    });
    if (selectedAnimId === animId) setSelectedAnimId(null);
  }, [slide, store, selectedAnimId]);

  const previewAnimation = useCallback((animId: string) => {
    setPreviewingId(animId);
    const anim = allAnimations.find(a => a.id === animId);
    setTimeout(() => setPreviewingId(null), ((anim?.duration || 0.5) + (anim?.delay || 0)) * 1000 + 200);
  }, [allAnimations]);

  const animList = tab === 'entrance' ? ENTRANCE_ANIMS : tab === 'emphasis' ? EMPHASIS_ANIMS : EXIT_ANIMS;

  return (
    <div className="w-72 h-full border-l border-[hsl(var(--border))] bg-[hsl(var(--card))] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[hsl(var(--border))]">
        <span className="text-xs font-semibold">Animations</span>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-[hsl(var(--muted))]">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[hsl(var(--border))]">
        {(['entrance', 'emphasis', 'exit'] as AnimationCategory[]).map(c => (
          <button
            key={c}
            onClick={() => setTab(c)}
            className={`flex-1 text-[10px] py-1.5 font-medium capitalize transition-colors ${
              tab === c ? 'border-b-2 text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'
            }`}
            style={tab === c ? { borderBottomColor: CATEGORY_COLORS[c] } : undefined}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 flex flex-col gap-3">
        {/* Add Animation */}
        {selectedObj ? (
          <div>
            <label className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] mb-1.5 block">
              Add to: {getObjLabel(selectedObj)}
            </label>
            <div className="grid grid-cols-2 gap-1">
              {animList.map(a => (
                <button
                  key={a.effect}
                  onClick={() => addAnimation(a.effect, tab, a.directions?.[0])}
                  className="text-[10px] py-1.5 px-2 rounded border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] text-left flex items-center gap-1 transition-colors"
                >
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[tab] }} />
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-[10px] text-[hsl(var(--muted-foreground))] text-center py-4">
            Select an object to add animations
          </div>
        )}

        {/* Animation Timeline */}
        <div>
          <label className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] mb-1.5 block">
            Animation Order ({allAnimations.length})
          </label>
          {allAnimations.length === 0 ? (
            <div className="text-[10px] text-[hsl(var(--muted-foreground))] text-center py-3 border border-dashed border-[hsl(var(--border))] rounded">
              No animations on this slide
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {allAnimations.map((a, idx) => (
                <div
                  key={a.id}
                  onClick={() => setSelectedAnimId(a.id)}
                  className={`flex items-center gap-1 px-1.5 py-1 rounded text-[10px] cursor-pointer transition-colors ${
                    selectedAnimId === a.id ? 'bg-[hsl(var(--ppt-active))]' : 'hover:bg-[hsl(var(--muted))]'
                  } ${previewingId === a.id ? 'ring-2 ring-[hsl(var(--ppt-selection))]' : ''}`}
                >
                  <GripVertical className="w-3 h-3 text-[hsl(var(--muted-foreground))] flex-shrink-0" />
                  <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-[hsl(var(--primary-foreground))] flex-shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[a.type] }}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{getEffectLabel(a.effect)}</div>
                    <div className="truncate text-[8px] text-[hsl(var(--muted-foreground))]">{a.objectLabel}</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); previewAnimation(a.id); }}
                    className="p-0.5 hover:bg-[hsl(var(--muted))] rounded"
                  >
                    <Play className="w-2.5 h-2.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeAnimation(a.id); }}
                    className="p-0.5 hover:bg-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive-foreground))] rounded"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Animation Settings */}
        {selectedAnim && (
          <div className="border-t border-[hsl(var(--border))] pt-3">
            <label className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] mb-2 block">
              Settings: {getEffectLabel(selectedAnim.effect)}
            </label>

            {/* Direction */}
            {getDirectionsForEffect(selectedAnim.effect) && (
              <div className="mb-2">
                <span className="text-[9px] text-[hsl(var(--muted-foreground))]">Direction</span>
                <div className="flex gap-1 mt-0.5">
                  {getDirectionsForEffect(selectedAnim.effect)!.map(d => (
                    <button
                      key={d}
                      onClick={() => updateAnimation(selectedAnim.id, { direction: d })}
                      className={`text-[9px] px-2 py-0.5 rounded border capitalize ${
                        selectedAnim.direction === d
                          ? 'border-[hsl(var(--ppt-selection))] bg-[hsl(var(--ppt-active))]'
                          : 'border-[hsl(var(--border))]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trigger */}
            <div className="mb-2">
              <span className="text-[9px] text-[hsl(var(--muted-foreground))]">Start</span>
              <select
                className="ppt-select w-full text-[10px] mt-0.5"
                value={selectedAnim.startTrigger}
                onChange={(e) => updateAnimation(selectedAnim.id, { startTrigger: e.target.value as AnimationTrigger })}
              >
                {TRIGGER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Delay */}
            <div className="mb-2">
              <span className="text-[9px] text-[hsl(var(--muted-foreground))]">Delay: {selectedAnim.delay.toFixed(1)}s</span>
              <input
                type="range" min="0" max="10" step="0.1"
                value={selectedAnim.delay}
                onChange={(e) => updateAnimation(selectedAnim.id, { delay: parseFloat(e.target.value) })}
                className="w-full h-1 accent-[hsl(var(--ppt-brand))]"
              />
            </div>

            {/* Duration */}
            <div className="mb-2">
              <span className="text-[9px] text-[hsl(var(--muted-foreground))]">Duration: {selectedAnim.duration.toFixed(1)}s</span>
              <input
                type="range" min="0.3" max="5" step="0.1"
                value={selectedAnim.duration}
                onChange={(e) => updateAnimation(selectedAnim.id, { duration: parseFloat(e.target.value) })}
                className="w-full h-1 accent-[hsl(var(--ppt-brand))]"
              />
            </div>

            {/* Easing */}
            <div className="mb-2">
              <span className="text-[9px] text-[hsl(var(--muted-foreground))]">Easing</span>
              <select
                className="ppt-select w-full text-[10px] mt-0.5"
                value={selectedAnim.easing}
                onChange={(e) => updateAnimation(selectedAnim.id, { easing: e.target.value as EasingType })}
              >
                {EASING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Repeat */}
            <div className="mb-2">
              <span className="text-[9px] text-[hsl(var(--muted-foreground))]">Repeat</span>
              <select
                className="ppt-select w-full text-[10px] mt-0.5"
                value={selectedAnim.repeat}
                onChange={(e) => updateAnimation(selectedAnim.id, { repeat: parseInt(e.target.value) })}
              >
                <option value="1">1×</option>
                <option value="2">2×</option>
                <option value="3">3×</option>
                <option value="0">Loop</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Play All Button */}
      {allAnimations.length > 0 && (
        <div className="px-3 py-2 border-t border-[hsl(var(--border))]">
          <button
            onClick={() => {
              // Preview all sequentially
              let delay = 0;
              allAnimations.forEach(a => {
                setTimeout(() => previewAnimation(a.id), delay * 1000);
                delay += (a.delay || 0) + (a.duration || 0.5) + 0.1;
              });
            }}
            className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] rounded bg-[hsl(var(--ppt-brand))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
          >
            <Play className="w-3 h-3" /> Play All Animations
          </button>
        </div>
      )}
    </div>
  );
};

function getObjLabel(obj: SlideObject): string {
  if (obj.type === 'text' && obj.textProps) {
    const text = obj.textProps.content.substring(0, 20);
    return `Text: "${text}${obj.textProps.content.length > 20 ? '...' : ''}"`;
  }
  if (obj.type === 'shape') return `Shape: ${obj.shapeProps?.shapeType || 'shape'}`;
  if (obj.type === 'image') return 'Image';
  return 'Object';
}

function getEffectLabel(effect: AnimationEffect): string {
  const map: Record<AnimationEffect, string> = {
    fadeIn: 'Fade In', flyIn: 'Fly In', zoomIn: 'Zoom In', bounceIn: 'Bounce In',
    rotateIn: 'Rotate In', wipeIn: 'Wipe In', slideIn: 'Slide In', growIn: 'Grow In',
    pulse: 'Pulse', shake: 'Shake', spin: 'Spin', bounce: 'Bounce',
    colorFlash: 'Color Flash', growShrink: 'Grow/Shrink', teeter: 'Teeter',
    fadeOut: 'Fade Out', flyOut: 'Fly Out', zoomOut: 'Zoom Out', collapse: 'Collapse',
    rotateOut: 'Rotate Out', wipeOut: 'Wipe Out', slideOut: 'Slide Out',
  };
  return map[effect] || effect;
}

function getDirectionsForEffect(effect: AnimationEffect): TransitionDirection[] | null {
  const directional: AnimationEffect[] = ['flyIn', 'wipeIn', 'slideIn', 'flyOut', 'wipeOut', 'slideOut'];
  if (directional.includes(effect)) return ['left', 'right', 'up', 'down'];
  return null;
}
