import React from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import { FONTS, PRESET_COLORS } from '@/types/presentation';
import type { TransitionType, AnimationType } from '@/types/presentation';
import { Trash2, ArrowUp, ArrowDown, RotateCw, Lock, Unlock, X } from 'lucide-react';

const ANIMATION_TYPES: { value: AnimationType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'fade-in', label: 'Fade In' },
  { value: 'fly-in', label: 'Fly In' },
  { value: 'zoom-in', label: 'Zoom In' },
  { value: 'fade-out', label: 'Fade Out' },
  { value: 'fly-out', label: 'Fly Out' },
  { value: 'pulse', label: 'Pulse' },
  { value: 'shake', label: 'Shake' },
];

export const PropertiesPanel: React.FC = () => {
  const {
    presentation, currentSlideIndex, selectedObjectIds,
    updateObject, deleteObjects, pushHistory,
    updateSlideBackground,
  } = usePresentationStore();

  const slide = presentation.slides[currentSlideIndex];
  const selectedObj = slide?.objects.find((o) => selectedObjectIds.includes(o.id));

  if (!selectedObj) {
    return (
      <div className="w-56 bg-white border-l border-[hsl(var(--border))] flex flex-col">
        <div className="px-3 py-2 border-b border-[hsl(var(--border))] flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[hsl(var(--foreground))]">Format Slide</span>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
          <SlideBackgroundEditor
            slide={slide}
            slideIndex={currentSlideIndex}
            updateSlideBackground={updateSlideBackground}
            pushHistory={pushHistory}
          />
        </div>
      </div>
    );
  }

  const update = (updates: any) => {
    updateObject(currentSlideIndex, selectedObj.id, updates);
  };

  return (
    <div className="w-56 bg-white border-l border-[hsl(var(--border))] flex flex-col">
      <div className="px-3 py-2 border-b border-[hsl(var(--border))] flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[hsl(var(--foreground))] capitalize">Format {selectedObj.type}</span>
        <div className="flex gap-0.5">
          <button onClick={() => update({ locked: !selectedObj.locked })} className="p-0.5 rounded hover:bg-black/5" title={selectedObj.locked ? 'Unlock' : 'Lock'}>
            {selectedObj.locked ? <Lock className="w-3 h-3 text-amber-500" /> : <Unlock className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />}
          </button>
          <button onClick={() => deleteObjects([selectedObj.id])} className="p-0.5 rounded hover:bg-red-50" title="Delete">
            <Trash2 className="w-3 h-3 text-red-500" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
        <Section title="Size & Position">
          <div className="grid grid-cols-2 gap-1.5">
            <PptInput label="X" value={Math.round(selectedObj.position.x)} onChange={(v) => update({ position: { ...selectedObj.position, x: v } })} />
            <PptInput label="Y" value={Math.round(selectedObj.position.y)} onChange={(v) => update({ position: { ...selectedObj.position, y: v } })} />
            <PptInput label="W" value={Math.round(selectedObj.size.width)} onChange={(v) => update({ size: { ...selectedObj.size, width: v } })} />
            <PptInput label="H" value={Math.round(selectedObj.size.height)} onChange={(v) => update({ size: { ...selectedObj.size, height: v } })} />
          </div>
          <div className="flex items-center gap-1 mt-1.5">
            <RotateCw className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
            <PptInput label="°" value={selectedObj.rotation} onChange={(v) => update({ rotation: v })} />
          </div>
        </Section>

        <Section title="Animation">
          <select
            className="ppt-select w-full"
            value={selectedObj.animation}
            onChange={(e) => update({ animation: e.target.value })}
          >
            {ANIMATION_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </Section>

        {selectedObj.type === 'text' && selectedObj.textProps && <TextPropsEditor obj={selectedObj} update={update} />}
        {selectedObj.type === 'shape' && selectedObj.shapeProps && <ShapePropsEditor obj={selectedObj} update={update} />}
        {selectedObj.type === 'image' && selectedObj.imageProps && <ImagePropsEditor obj={selectedObj} update={update} />}
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h4 className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] mb-1.5 uppercase tracking-wider">{title}</h4>
    {children}
  </div>
);

const PptInput: React.FC<{ label: string; value: number; onChange: (v: number) => void }> = ({ label, value, onChange }) => (
  <div className="flex items-center gap-1">
    <span className="text-[10px] text-[hsl(var(--muted-foreground))] w-3">{label}</span>
    <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="ppt-input flex-1" />
  </div>
);

const ColorPicker: React.FC<{ value: string; onChange: (v: string) => void; label: string }> = ({ value, onChange, label }) => (
  <div>
    <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{label}</span>
    <div className="flex items-center gap-1.5 mt-0.5">
      <input type="color" value={value === 'transparent' ? '#ffffff' : value} onChange={(e) => onChange(e.target.value)} className="w-5 h-5 border border-[hsl(var(--border))] p-0 cursor-pointer rounded-sm" />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="ppt-input flex-1 text-left" style={{ width: 'auto' }} />
    </div>
    <div className="flex flex-wrap gap-0.5 mt-1">
      {PRESET_COLORS.slice(0, 10).map((c) => (
        <button key={c} onClick={() => onChange(c)} className="w-3.5 h-3.5 rounded-sm border border-[hsl(var(--border))] hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
      ))}
    </div>
  </div>
);

const TextPropsEditor: React.FC<{ obj: any; update: (u: any) => void }> = ({ obj, update }) => {
  const tp = obj.textProps;
  const up = (changes: any) => update({ textProps: { ...tp, ...changes } });
  return (
    <>
      <Section title="Text Color">
        <ColorPicker value={tp.color} onChange={(v) => up({ color: v })} label="" />
      </Section>
      <Section title="Background">
        <ColorPicker value={tp.backgroundColor} onChange={(v) => up({ backgroundColor: v })} label="" />
      </Section>
      <Section title="Line Height">
        <input type="range" min="1" max="3" step="0.1" value={tp.lineHeight} onChange={(e) => up({ lineHeight: parseFloat(e.target.value) })} className="w-full" style={{ accentColor: 'hsl(var(--accent))' }} />
        <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{tp.lineHeight}</span>
      </Section>
    </>
  );
};

const ShapePropsEditor: React.FC<{ obj: any; update: (u: any) => void }> = ({ obj, update }) => {
  const sp = obj.shapeProps;
  const up = (changes: any) => update({ shapeProps: { ...sp, ...changes } });
  return (
    <>
      <Section title="Fill">
        <ColorPicker value={sp.fill} onChange={(v) => up({ fill: v })} label="" />
        <div className="mt-1.5">
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Opacity: {sp.fillOpacity}%</span>
          <input type="range" min="0" max="100" value={sp.fillOpacity} onChange={(e) => up({ fillOpacity: Number(e.target.value) })} className="w-full" style={{ accentColor: 'hsl(var(--accent))' }} />
        </div>
      </Section>
      <Section title="Line">
        <ColorPicker value={sp.stroke === 'transparent' ? '#000000' : sp.stroke} onChange={(v) => up({ stroke: v })} label="Color" />
        <div className="mt-1">
          <PptInput label="W" value={sp.strokeWidth} onChange={(v) => up({ strokeWidth: Math.max(0, Math.min(10, v)) })} />
        </div>
      </Section>
      {sp.shapeType === 'rectangle' && (
        <Section title="Corner Radius">
          <input type="range" min="0" max="50" value={sp.borderRadius} onChange={(e) => up({ borderRadius: Number(e.target.value) })} className="w-full" style={{ accentColor: 'hsl(var(--accent))' }} />
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{sp.borderRadius}px</span>
        </Section>
      )}
    </>
  );
};

const ImagePropsEditor: React.FC<{ obj: any; update: (u: any) => void }> = ({ obj, update }) => {
  const ip = obj.imageProps;
  const up = (changes: any) => update({ imageProps: { ...ip, ...changes } });
  return (
    <>
      <Section title="Fit">
        <select className="ppt-select w-full" value={ip.objectFit} onChange={(e) => up({ objectFit: e.target.value })}>
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
          <option value="fill">Fill</option>
        </select>
      </Section>
      <Section title="Opacity">
        <input type="range" min="0" max="100" value={ip.opacity} onChange={(e) => up({ opacity: Number(e.target.value) })} className="w-full" style={{ accentColor: 'hsl(var(--accent))' }} />
        <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{ip.opacity}%</span>
      </Section>
      <Section title="Effect">
        <select className="ppt-select w-full" value={ip.filter} onChange={(e) => up({ filter: e.target.value })}>
          <option value="none">None</option>
          <option value="grayscale(100%)">Grayscale</option>
          <option value="sepia(100%)">Sepia</option>
          <option value="blur(3px)">Blur</option>
          <option value="brightness(1.3)">Bright</option>
          <option value="contrast(1.5)">High Contrast</option>
        </select>
      </Section>
    </>
  );
};

const SlideBackgroundEditor: React.FC<{
  slide: any; slideIndex: number;
  updateSlideBackground: (i: number, bg: any) => void;
  pushHistory: () => void;
}> = ({ slide, slideIndex, updateSlideBackground, pushHistory }) => {
  if (!slide) return null;
  return (
    <div className="space-y-2">
      <Section title="Background">
        <select
          className="ppt-select w-full"
          value={slide.background.type}
          onChange={(e) => {
            pushHistory();
            const type = e.target.value;
            if (type === 'color') updateSlideBackground(slideIndex, { type: 'color', value: '#ffffff' });
            else if (type === 'gradient') updateSlideBackground(slideIndex, { type: 'gradient', value: '#667eea', secondaryValue: '#764ba2', gradientDirection: '135deg' });
          }}
        >
          <option value="color">Solid Fill</option>
          <option value="gradient">Gradient Fill</option>
        </select>
      </Section>
      {slide.background.type === 'color' && (
        <ColorPicker
          value={slide.background.value}
          onChange={(v) => { pushHistory(); updateSlideBackground(slideIndex, { ...slide.background, value: v }); }}
          label="Color"
        />
      )}
      {slide.background.type === 'gradient' && (
        <>
          <ColorPicker value={slide.background.value} onChange={(v) => { pushHistory(); updateSlideBackground(slideIndex, { ...slide.background, value: v }); }} label="Color 1" />
          <ColorPicker value={slide.background.secondaryValue || '#ffffff'} onChange={(v) => { pushHistory(); updateSlideBackground(slideIndex, { ...slide.background, secondaryValue: v }); }} label="Color 2" />
          <div>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Direction</span>
            <select className="ppt-select w-full mt-0.5" value={slide.background.gradientDirection || '135deg'} onChange={(e) => { pushHistory(); updateSlideBackground(slideIndex, { ...slide.background, gradientDirection: e.target.value }); }}>
              <option value="0deg">↓ Top to Bottom</option>
              <option value="90deg">→ Left to Right</option>
              <option value="135deg">↘ Diagonal</option>
              <option value="180deg">↑ Bottom to Top</option>
              <option value="270deg">← Right to Left</option>
            </select>
          </div>
        </>
      )}
    </div>
  );
};
