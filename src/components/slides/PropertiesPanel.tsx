import React, { useState } from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import { PRESET_COLORS, THEMES } from '@/types/presentation';
import type { AnimationType, SlideBackground, GradientStop } from '@/types/presentation';
import { Trash2, RotateCw, Lock, Unlock } from 'lucide-react';

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
    updateSlideBackground, applyBackgroundToAll,
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
  const shadow = sp.shadow || { enabled: false, color: 'rgba(0,0,0,0.3)', blur: 4, offsetX: 2, offsetY: 2 };
  const upShadow = (changes: any) => up({ shadow: { ...shadow, ...changes } });

  return (
    <>
      <Section title="Fill">
        <ColorPicker value={sp.fill} onChange={(v) => up({ fill: v })} label="" />
        <div className="mt-1.5">
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Opacity: {sp.fillOpacity}%</span>
          <input type="range" min="0" max="100" value={sp.fillOpacity} onChange={(e) => up({ fillOpacity: Number(e.target.value) })} className="w-full" style={{ accentColor: 'hsl(var(--accent))' }} />
        </div>
        <button className="text-[10px] text-[hsl(var(--accent))] mt-1 hover:underline" onClick={() => up({ fill: 'transparent', fillOpacity: 0 })}>
          No Fill
        </button>
      </Section>

      <Section title="Border">
        <ColorPicker value={sp.stroke === 'transparent' ? '#000000' : sp.stroke} onChange={(v) => up({ stroke: v })} label="Color" />
        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          <div>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Width</span>
            <input type="range" min="0" max="10" value={sp.strokeWidth} onChange={(e) => up({ strokeWidth: Number(e.target.value) })} className="w-full" style={{ accentColor: 'hsl(var(--accent))' }} />
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{sp.strokeWidth}px</span>
          </div>
          <div>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Style</span>
            <select className="ppt-select w-full mt-0.5" value={sp.strokeStyle || 'solid'} onChange={(e) => up({ strokeStyle: e.target.value })}>
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </div>
        </div>
        <button className="text-[10px] text-[hsl(var(--accent))] mt-1 hover:underline" onClick={() => up({ stroke: 'transparent', strokeWidth: 0 })}>
          No Border
        </button>
      </Section>

      {(sp.shapeType === 'rectangle' || sp.shapeType === 'rounded-rectangle') && (
        <Section title="Corner Radius">
          <input type="range" min="0" max="50" value={sp.borderRadius} onChange={(e) => up({ borderRadius: Number(e.target.value) })} className="w-full" style={{ accentColor: 'hsl(var(--accent))' }} />
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{sp.borderRadius}px</span>
        </Section>
      )}

      <Section title="Shadow">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={shadow.enabled} onChange={(e) => upShadow({ enabled: e.target.checked })} className="accent-[hsl(var(--accent))]" />
          <span className="text-[10px]">Drop Shadow</span>
        </label>
        {shadow.enabled && (
          <div className="mt-1.5 space-y-1.5">
            <div>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Color</span>
              <input type="color" value={shadow.color?.startsWith('rgba') ? '#000000' : (shadow.color || '#000000')} onChange={(e) => upShadow({ color: e.target.value })} className="w-5 h-5 border border-[hsl(var(--border))] p-0 cursor-pointer rounded-sm block mt-0.5" />
            </div>
            <div>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Blur: {shadow.blur}px</span>
              <input type="range" min="0" max="20" value={shadow.blur} onChange={(e) => upShadow({ blur: Number(e.target.value) })} className="w-full" style={{ accentColor: 'hsl(var(--accent))' }} />
            </div>
            <div className="grid grid-cols-2 gap-1">
              <PptInput label="X" value={shadow.offsetX} onChange={(v) => upShadow({ offsetX: v })} />
              <PptInput label="Y" value={shadow.offsetY} onChange={(v) => upShadow({ offsetY: v })} />
            </div>
          </div>
        )}
      </Section>
    </>
  );
};

const ImagePropsEditor: React.FC<{ obj: any; update: (u: any) => void }> = ({ obj, update }) => {
  const ip = obj.imageProps;
  const up = (changes: any) => update({ imageProps: { ...ip, ...changes } });
  const filters = ip.filters || { grayscale: 0, sepia: 0, blur: 0, brightness: 100, contrast: 100, saturation: 100 };
  const upFilter = (changes: any) => up({ filters: { ...filters, ...changes } });
  const border = ip.border || { enabled: false, color: '#000000', width: 2 };
  const upBorder = (changes: any) => up({ border: { ...border, ...changes } });
  const shadow = ip.shadow || { enabled: false, color: 'rgba(0,0,0,0.3)', blur: 8, offsetX: 4, offsetY: 4 };
  const upShadow = (changes: any) => up({ shadow: { ...shadow, ...changes } });

  const replaceInputRef = React.useRef<HTMLInputElement>(null);

  const handleReplace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => up({ src: ev.target?.result as string, originalSrc: ev.target?.result as string });
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <>
      <Section title="Fit & Opacity">
        <select className="ppt-select w-full" value={ip.objectFit} onChange={(e) => up({ objectFit: e.target.value })}>
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
          <option value="fill">Fill</option>
        </select>
        <div className="mt-1.5">
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Opacity: {ip.opacity}%</span>
          <input type="range" min="0" max="100" value={ip.opacity} onChange={(e) => up({ opacity: Number(e.target.value) })} className="w-full" style={{ accentColor: 'hsl(var(--accent))' }} />
        </div>
      </Section>

      <Section title="Filters">
        <div className="space-y-1.5">
          <div>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Grayscale: {filters.grayscale}%</span>
            <input type="range" min="0" max="100" value={filters.grayscale} onChange={(e) => upFilter({ grayscale: Number(e.target.value) })} className="w-full" style={{ accentColor: 'hsl(var(--accent))' }} />
          </div>
          <div>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Sepia: {filters.sepia}%</span>
            <input type="range" min="0" max="100" value={filters.sepia} onChange={(e) => upFilter({ sepia: Number(e.target.value) })} className="w-full" style={{ accentColor: 'hsl(var(--accent))' }} />
          </div>
          <div>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Blur: {filters.blur}px</span>
            <input type="range" min="0" max="20" value={filters.blur} onChange={(e) => upFilter({ blur: Number(e.target.value) })} className="w-full" style={{ accentColor: 'hsl(var(--accent))' }} />
          </div>
          <div>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Brightness: {filters.brightness}%</span>
            <input type="range" min="50" max="150" value={filters.brightness} onChange={(e) => upFilter({ brightness: Number(e.target.value) })} className="w-full" style={{ accentColor: 'hsl(var(--accent))' }} />
          </div>
          <div>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Contrast: {filters.contrast}%</span>
            <input type="range" min="50" max="150" value={filters.contrast} onChange={(e) => upFilter({ contrast: Number(e.target.value) })} className="w-full" style={{ accentColor: 'hsl(var(--accent))' }} />
          </div>
          <div>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Saturation: {filters.saturation}%</span>
            <input type="range" min="0" max="200" value={filters.saturation} onChange={(e) => upFilter({ saturation: Number(e.target.value) })} className="w-full" style={{ accentColor: 'hsl(var(--accent))' }} />
          </div>
          <button className="text-[10px] text-[hsl(var(--accent))] hover:underline" onClick={() => up({ filters: { grayscale: 0, sepia: 0, blur: 0, brightness: 100, contrast: 100, saturation: 100 } })}>
            Reset Filters
          </button>
        </div>
      </Section>

      <Section title="Filter Presets">
        <div className="grid grid-cols-3 gap-1">
          {[
            { label: 'None', f: { grayscale: 0, sepia: 0, blur: 0, brightness: 100, contrast: 100, saturation: 100 } },
            { label: 'Gray', f: { grayscale: 100, sepia: 0, blur: 0, brightness: 100, contrast: 100, saturation: 100 } },
            { label: 'Sepia', f: { grayscale: 0, sepia: 100, blur: 0, brightness: 100, contrast: 100, saturation: 100 } },
            { label: 'Vintage', f: { grayscale: 20, sepia: 40, blur: 0, brightness: 110, contrast: 90, saturation: 80 } },
            { label: 'Cool', f: { grayscale: 0, sepia: 0, blur: 0, brightness: 105, contrast: 110, saturation: 80 } },
            { label: 'Warm', f: { grayscale: 0, sepia: 30, blur: 0, brightness: 110, contrast: 100, saturation: 120 } },
          ].map(preset => (
            <button key={preset.label} onClick={() => up({ filters: preset.f })} className="text-[10px] px-2 py-1 rounded border border-[hsl(var(--border))] hover:bg-[hsl(var(--ppt-hover))] transition-colors">
              {preset.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Border">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={border.enabled} onChange={(e) => upBorder({ enabled: e.target.checked })} className="accent-[hsl(var(--accent))]" />
          <span className="text-[10px]">Show Border</span>
        </label>
        {border.enabled && (
          <div className="mt-1.5 space-y-1.5">
            <ColorPicker value={border.color} onChange={(v) => upBorder({ color: v })} label="Color" />
            <div>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Width: {border.width}px</span>
              <input type="range" min="1" max="10" value={border.width} onChange={(e) => upBorder({ width: Number(e.target.value) })} className="w-full" style={{ accentColor: 'hsl(var(--accent))' }} />
            </div>
          </div>
        )}
      </Section>

      <Section title="Shadow">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={shadow.enabled} onChange={(e) => upShadow({ enabled: e.target.checked })} className="accent-[hsl(var(--accent))]" />
          <span className="text-[10px]">Drop Shadow</span>
        </label>
        {shadow.enabled && (
          <div className="mt-1.5 space-y-1.5">
            <div>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Blur: {shadow.blur}px</span>
              <input type="range" min="0" max="20" value={shadow.blur} onChange={(e) => upShadow({ blur: Number(e.target.value) })} className="w-full" style={{ accentColor: 'hsl(var(--accent))' }} />
            </div>
            <div className="grid grid-cols-2 gap-1">
              <PptInput label="X" value={shadow.offsetX} onChange={(v) => upShadow({ offsetX: v })} />
              <PptInput label="Y" value={shadow.offsetY} onChange={(v) => upShadow({ offsetY: v })} />
            </div>
          </div>
        )}
      </Section>

      <Section title="Corner Radius">
        <input type="range" min="0" max="50" value={ip.cornerRadius || 0} onChange={(e) => up({ cornerRadius: Number(e.target.value) })} className="w-full" style={{ accentColor: 'hsl(var(--accent))' }} />
        <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{ip.cornerRadius || 0}px</span>
      </Section>

      <Section title="Transform">
        <div className="flex gap-1">
          <button className={`text-[10px] px-2 py-1 rounded border border-[hsl(var(--border))] hover:bg-[hsl(var(--ppt-hover))] ${ip.flipH ? 'bg-[hsl(var(--ppt-active))]' : ''}`} onClick={() => up({ flipH: !ip.flipH })}>Flip H</button>
          <button className={`text-[10px] px-2 py-1 rounded border border-[hsl(var(--border))] hover:bg-[hsl(var(--ppt-hover))] ${ip.flipV ? 'bg-[hsl(var(--ppt-active))]' : ''}`} onClick={() => up({ flipV: !ip.flipV })}>Flip V</button>
          <button className="text-[10px] px-2 py-1 rounded border border-[hsl(var(--border))] hover:bg-[hsl(var(--ppt-hover))]" onClick={() => update({ rotation: (obj.rotation || 0) - 90 })}>↺ 90°</button>
          <button className="text-[10px] px-2 py-1 rounded border border-[hsl(var(--border))] hover:bg-[hsl(var(--ppt-hover))]" onClick={() => update({ rotation: (obj.rotation || 0) + 90 })}>↻ 90°</button>
        </div>
      </Section>

      <Section title="Replace Image">
        <button className="text-[10px] px-2 py-1 rounded border border-[hsl(var(--border))] hover:bg-[hsl(var(--ppt-hover))] w-full" onClick={() => replaceInputRef.current?.click()}>
          Choose New Image
        </button>
        <input ref={replaceInputRef} type="file" accept=".jpg,.jpeg,.png,.gif,.svg,.webp" className="hidden" onChange={handleReplace} />
      </Section>

      <Section title="Set as Background">
        <div className="flex gap-1 flex-wrap">
          {(['fill', 'cover', 'contain'] as const).map(fit => (
            <button key={fit} className="text-[10px] px-2 py-1 rounded border border-[hsl(var(--border))] hover:bg-[hsl(var(--ppt-hover))] capitalize" onClick={() => {
              const { presentation, currentSlideIndex, updateSlideBackground, pushHistory } = usePresentationStore.getState();
              pushHistory();
              updateSlideBackground(currentSlideIndex, { type: 'image', value: ip.src });
            }}>
              {fit}
            </button>
          ))}
        </div>
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
