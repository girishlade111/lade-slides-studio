import React from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import { PRESET_COLORS, THEMES } from '@/types/presentation';
import type { AnimationType } from '@/types/presentation';
import { Trash2, RotateCw, Lock, Unlock, Plus, Minus } from 'lucide-react';
import { FONTS } from '@/types/presentation';

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
            applyBackgroundToAll={applyBackgroundToAll}
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
        {selectedObj.type === 'table' && selectedObj.tableProps && <TablePropsEditor obj={selectedObj} update={update} />}
        {selectedObj.type === 'chart' && selectedObj.chartProps && <ChartPropsEditor obj={selectedObj} update={update} />}
      </div>
    </div>
  );
};

const ChartPropsEditor: React.FC<{ obj: any; update: (u: any) => void }> = ({ obj, update }) => {
  const cp = obj.chartProps;
  const up = (changes: any) => update({ chartProps: { ...cp, ...changes } });

  return (
    <>
      <Section title="Chart Settings">
        <div className="space-y-1.5">
          <div>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Type</span>
            <select className="ppt-select w-full mt-0.5" value={cp.type} onChange={(e) => up({ type: e.target.value })}>
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="pie">Pie Chart</option>
            </select>
          </div>
          <div>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Title</span>
            <input type="text" className="ppt-input w-full mt-0.5" value={cp.title} onChange={(e) => up({ title: e.target.value })} />
          </div>
          <div>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Data Range (e.g. A1:C5)</span>
            <input type="text" className="ppt-input w-full mt-0.5" value={cp.dataRange} onChange={(e) => up({ dataRange: e.target.value })} />
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer pt-1">
            <input type="checkbox" checked={cp.showLegend} onChange={(e) => up({ showLegend: e.target.checked })} className="accent-[hsl(var(--accent))]" />
            <span className="text-[10px]">Show Legend</span>
          </label>
        </div>
      </Section>
    </>
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

const TablePropsEditor: React.FC<{ obj: any; update: (u: any) => void }> = ({ obj, update }) => {
  const tp = obj.tableProps;
  const up = (changes: any) => update({ tableProps: { ...tp, ...changes } });
  const store = usePresentationStore();

  const TABLE_STYLE_PRESETS = [
    { label: 'Blue Header', header: '#3b82f6', headerText: '#ffffff', banded: false, bandedColor: '#f3f4f6' },
    { label: 'Green Header', header: '#16a34a', headerText: '#ffffff', banded: false, bandedColor: '#f0fdf4' },
    { label: 'Dark', header: '#1f2937', headerText: '#ffffff', banded: true, bandedColor: '#f9fafb' },
    { label: 'Purple', header: '#7c3aed', headerText: '#ffffff', banded: false, bandedColor: '#faf5ff' },
    { label: 'Orange', header: '#ea580c', headerText: '#ffffff', banded: true, bandedColor: '#fff7ed' },
    { label: 'Minimal', header: '#f3f4f6', headerText: '#1f2937', banded: true, bandedColor: '#f9fafb' },
  ];

  return (
    <>
      <Section title="Table Style">
        <div className="grid grid-cols-3 gap-1">
          {TABLE_STYLE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              className="text-[9px] px-1.5 py-1 rounded border border-[hsl(var(--border))] hover:bg-[hsl(var(--ppt-hover))] transition-colors"
              onClick={() => {
                store.pushHistory();
                const cells = tp.cells.map((row: any[], ri: number) =>
                  row.map((c: any) => ({
                    ...c,
                    backgroundColor: tp.headerRow && ri === 0 ? preset.header : '#ffffff',
                    textColor: tp.headerRow && ri === 0 ? preset.headerText : '#1f2937',
                    fontWeight: tp.headerRow && ri === 0 ? 600 : 400,
                  }))
                );
                up({
                  headerBackgroundColor: preset.header,
                  headerTextColor: preset.headerText,
                  bandedRows: preset.banded,
                  bandedRowColor: preset.bandedColor,
                  cells,
                });
              }}
            >
              <div className="w-full h-3 rounded-sm mb-0.5" style={{ backgroundColor: preset.header }} />
              {preset.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Structure">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Rows: {tp.rows}</span>
            <div className="flex gap-0.5">
              <button className="p-0.5 rounded hover:bg-black/5" onClick={() => store.addTableRow(obj.id, tp.rows - 1)} title="Add Row">
                <Plus className="w-3 h-3" />
              </button>
              <button className="p-0.5 rounded hover:bg-red-50" onClick={() => tp.rows > 1 && store.deleteTableRow(obj.id, tp.rows - 1)} title="Remove Row" disabled={tp.rows <= 1}>
                <Minus className="w-3 h-3 text-red-500" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Columns: {tp.columns}</span>
            <div className="flex gap-0.5">
              <button className="p-0.5 rounded hover:bg-black/5" onClick={() => store.addTableColumn(obj.id, tp.columns - 1)} title="Add Column">
                <Plus className="w-3 h-3" />
              </button>
              <button className="p-0.5 rounded hover:bg-red-50" onClick={() => tp.columns > 1 && store.deleteTableColumn(obj.id, tp.columns - 1)} title="Remove Column" disabled={tp.columns <= 1}>
                <Minus className="w-3 h-3 text-red-500" />
              </button>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Options">
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={tp.headerRow} onChange={(e) => up({ headerRow: e.target.checked })} className="accent-[hsl(var(--accent))]" />
            <span className="text-[10px]">Header Row</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={tp.bandedRows} onChange={(e) => up({ bandedRows: e.target.checked })} className="accent-[hsl(var(--accent))]" />
            <span className="text-[10px]">Banded Rows</span>
          </label>
        </div>
      </Section>

      <Section title="Header Colors">
        <ColorPicker value={tp.headerBackgroundColor} onChange={(v) => {
          const cells = tp.cells.map((row: any[], ri: number) =>
            row.map((c: any) => ri === 0 && tp.headerRow ? { ...c, backgroundColor: v } : c)
          );
          up({ headerBackgroundColor: v, cells });
        }} label="Background" />
        <ColorPicker value={tp.headerTextColor} onChange={(v) => {
          const cells = tp.cells.map((row: any[], ri: number) =>
            row.map((c: any) => ri === 0 && tp.headerRow ? { ...c, textColor: v } : c)
          );
          up({ headerTextColor: v, cells });
        }} label="Text" />
      </Section>

      {tp.bandedRows && (
        <Section title="Banded Row Color">
          <ColorPicker value={tp.bandedRowColor} onChange={(v) => up({ bandedRowColor: v })} label="" />
        </Section>
      )}

      <Section title="Font">
        <select className="ppt-select w-full" value={tp.defaultFontFamily} onChange={(e) => up({ defaultFontFamily: e.target.value })}>
          {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <div className="mt-1.5">
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Size: {tp.defaultFontSize}px</span>
          <input type="range" min="8" max="24" value={tp.defaultFontSize} onChange={(e) => up({ defaultFontSize: Number(e.target.value) })} className="w-full" style={{ accentColor: 'hsl(var(--accent))' }} />
        </div>
      </Section>

      {store.activeTableId === obj.id && store.activeTableCell && (
        <Section title="Selected Cell Formatting">
          {(() => {
            const cell = tp.cells[store.activeTableCell.r][store.activeTableCell.c];
            if (!cell) return null;
            return (
              <div className="space-y-1.5 mt-1">
                <div>
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Data Format</span>
                  <select 
                    className="ppt-select w-full mt-0.5" 
                    value={cell.dataFormat || 'general'} 
                    onChange={(e) => store.updateTableCell(store.currentSlideIndex, obj.id, store.activeTableCell!.r, store.activeTableCell!.c, { dataFormat: e.target.value as any })}
                  >
                    <option value="general">General</option>
                    <option value="currency">Currency</option>
                    <option value="percentage">Percentage</option>
                    <option value="date">Date</option>
                  </select>
                </div>
                <div>
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Data Validation</span>
                  <select 
                    className="ppt-select w-full mt-0.5" 
                    value={cell.validationType || 'none'} 
                    onChange={(e) => store.updateTableCell(store.currentSlideIndex, obj.id, store.activeTableCell!.r, store.activeTableCell!.c, { validationType: e.target.value as any })}
                  >
                    <option value="none">None</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="dropdown">Dropdown</option>
                  </select>
                </div>
                {cell.validationType === 'dropdown' && (
                  <div>
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Dropdown Options (comma separated)</span>
                    <input 
                      type="text" 
                      className="ppt-input w-full mt-0.5" 
                      value={(cell.validationOptions || []).join(', ')} 
                      onChange={(e) => store.updateTableCell(store.currentSlideIndex, obj.id, store.activeTableCell!.r, store.activeTableCell!.c, { validationOptions: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      placeholder="Option 1, Option 2"
                    />
                  </div>
                )}
              </div>
            );
          })()}
        </Section>
      )}
    </>
  );
};

const BG_TABS = ['Color', 'Gradient', 'Image', 'Pattern', 'Texture'] as const;
type BgTab = typeof BG_TABS[number];

const PATTERN_TYPES = ['dots', 'grid', 'diagonal-stripes', 'horizontal-stripes', 'vertical-stripes', 'checkerboard', 'hexagons', 'triangles'] as const;
const TEXTURE_TYPES = ['paper', 'canvas', 'fabric', 'wood', 'marble', 'concrete', 'leather'] as const;
const GRADIENT_TYPES = [
  { value: 'linear', label: 'Linear' },
  { value: 'radial', label: 'Radial' },
  { value: 'diagonal-lr', label: 'Diagonal ↘' },
  { value: 'diagonal-rl', label: 'Diagonal ↙' },
] as const;

const SlideBackgroundEditor: React.FC<{
  slide: any; slideIndex: number;
  updateSlideBackground: (i: number, bg: any) => void;
  applyBackgroundToAll: (bg: any) => void;
  pushHistory: () => void;
}> = ({ slide, slideIndex, updateSlideBackground, applyBackgroundToAll, pushHistory }) => {
  const [activeTab, setActiveTab] = React.useState<BgTab>(() => {
    if (!slide) return 'Color';
    const t = slide.background.type;
    if (t === 'color') return 'Color';
    if (t === 'gradient') return 'Gradient';
    if (t === 'image') return 'Image';
    if (t === 'pattern') return 'Pattern';
    if (t === 'texture') return 'Texture';
    return 'Color';
  });
  const bgImgRef = React.useRef<HTMLInputElement>(null);

  if (!slide) return null;
  const bg = slide.background;

  const setBg = (newBg: any) => { pushHistory(); updateSlideBackground(slideIndex, newBg); };
  const applyAll = () => applyBackgroundToAll(bg);
  const reset = () => setBg({ type: 'color', value: '#ffffff' });

  // Gradient helpers
  const gradient = bg.gradient || { type: 'linear' as const, stops: [{ color: bg.value || '#667eea', position: 0 }, { color: bg.secondaryValue || '#764ba2', position: 100 }], angle: 135 };
  const setGradient = (changes: any) => setBg({ ...bg, type: 'gradient', gradient: { ...gradient, ...changes } });
  const updateStop = (idx: number, changes: any) => {
    const stops = [...gradient.stops];
    stops[idx] = { ...stops[idx], ...changes };
    setGradient({ stops });
  };
  const addStop = () => {
    if (gradient.stops.length >= 5) return;
    const stops = [...gradient.stops, { color: '#ffffff', position: 50 }].sort((a: any, b: any) => a.position - b.position);
    setGradient({ stops });
  };
  const removeStop = (idx: number) => {
    if (gradient.stops.length <= 2) return;
    setGradient({ stops: gradient.stops.filter((_: any, i: number) => i !== idx) });
  };

  // Pattern helpers
  const pattern = bg.pattern || { type: 'dots', color: '#6b7280', backgroundColor: '#ffffff', scale: 1 };
  const setPattern = (changes: any) => setBg({ ...bg, type: 'pattern', pattern: { ...pattern, ...changes } });

  // Texture helpers
  const texture = bg.texture || { type: 'paper', opacity: 100, tint: '' };
  const setTexture = (changes: any) => setBg({ ...bg, type: 'texture', texture: { ...texture, ...changes } });

  // Image helpers
  const image = bg.image || { src: '', fit: 'fill' as const, opacity: 100, blur: 0 };
  const setImage = (changes: any) => setBg({ ...bg, type: 'image', image: { ...image, ...changes } });

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImage({ src: ev.target?.result as string });
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Preview gradient string
  const gradientPreview = (() => {
    const stops = gradient.stops.map((s: any) => `${s.color} ${s.position}%`).join(', ');
    if (gradient.type === 'radial') return `radial-gradient(circle, ${stops})`;
    const angle = gradient.type === 'diagonal-lr' ? '135deg' : gradient.type === 'diagonal-rl' ? '225deg' : `${gradient.angle}deg`;
    return `linear-gradient(${angle}, ${stops})`;
  })();

  return (
    <div className="space-y-2">
      {/* Tab selector */}
      <div className="flex flex-wrap gap-0.5">
        {BG_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
              activeTab === tab ? 'bg-[hsl(var(--ppt-brand))] text-white' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--ppt-hover))]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Color Tab */}
      {activeTab === 'Color' && (
        <div className="space-y-2">
          <ColorPicker value={bg.value || '#ffffff'} onChange={(v) => setBg({ type: 'color', value: v })} label="Color" />
          <div>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Theme Colors</span>
            <div className="flex flex-wrap gap-0.5 mt-0.5">
              {(() => {
                const theme = THEMES.find(t => t.id === usePresentationStore.getState().presentation.theme);
                if (!theme) return null;
                return Object.values(theme.colors).map((c, i) => (
                  <button key={i} onClick={() => setBg({ type: 'color', value: c })} className="w-4 h-4 rounded-sm border border-[hsl(var(--border))] hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Gradient Tab */}
      {activeTab === 'Gradient' && (
        <div className="space-y-2">
          <div className="h-8 rounded border border-[hsl(var(--border))]" style={{ background: gradientPreview }} />
          <div>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Type</span>
            <select className="ppt-select w-full mt-0.5" value={gradient.type} onChange={(e) => setGradient({ type: e.target.value })}>
              {GRADIENT_TYPES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
          {(gradient.type === 'linear') && (
            <div>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Angle: {gradient.angle}°</span>
              <input type="range" min="0" max="360" value={gradient.angle} onChange={(e) => setGradient({ angle: Number(e.target.value) })} className="w-full" style={{ accentColor: 'hsl(var(--accent))' }} />
            </div>
          )}
          <div className="space-y-1.5">
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Color Stops</span>
            {gradient.stops.map((stop: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1">
                <input type="color" value={stop.color} onChange={(e) => updateStop(idx, { color: e.target.value })} className="w-5 h-5 border border-[hsl(var(--border))] p-0 cursor-pointer rounded-sm" />
                <input type="range" min="0" max="100" value={stop.position} onChange={(e) => updateStop(idx, { position: Number(e.target.value) })} className="flex-1" style={{ accentColor: stop.color }} />
                <span className="text-[9px] w-6 text-right text-[hsl(var(--muted-foreground))]">{stop.position}%</span>
                {gradient.stops.length > 2 && (
                  <button onClick={() => removeStop(idx)} className="text-[10px] text-red-400 hover:text-red-600">×</button>
                )}
              </div>
            ))}
            {gradient.stops.length < 5 && (
              <button onClick={addStop} className="text-[10px] text-[hsl(var(--accent))] hover:underline">+ Add Stop</button>
            )}
          </div>
        </div>
      )}

      {/* Image Tab */}
      {activeTab === 'Image' && (
        <div className="space-y-2">
          {image.src ? (
            <div className="h-16 rounded border border-[hsl(var(--border))] overflow-hidden">
              <img src={image.src} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="h-16 rounded border-2 border-dashed border-[hsl(var(--border))] flex items-center justify-center">
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">No image</span>
            </div>
          )}
          <button onClick={() => bgImgRef.current?.click()} className="text-[10px] px-2 py-1 rounded border border-[hsl(var(--border))] hover:bg-[hsl(var(--ppt-hover))] w-full">
            Upload Image
          </button>
          <input ref={bgImgRef} type="file" accept=".jpg,.jpeg,.png,.gif,.webp" className="hidden" onChange={handleBgImageUpload} />
          {image.src && (
            <>
              <div>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Fit</span>
                <select className="ppt-select w-full mt-0.5" value={image.fit} onChange={(e) => setImage({ fit: e.target.value })}>
                  <option value="fill">Fill (Cover)</option>
                  <option value="fit">Fit (Contain)</option>
                  <option value="stretch">Stretch</option>
                  <option value="tile">Tile</option>
                  <option value="center">Center</option>
                </select>
              </div>
              <div>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Opacity: {image.opacity}%</span>
                <input type="range" min="0" max="100" value={image.opacity} onChange={(e) => setImage({ opacity: Number(e.target.value) })} className="w-full" style={{ accentColor: 'hsl(var(--accent))' }} />
              </div>
              <div>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Blur: {image.blur}px</span>
                <input type="range" min="0" max="20" value={image.blur} onChange={(e) => setImage({ blur: Number(e.target.value) })} className="w-full" style={{ accentColor: 'hsl(var(--accent))' }} />
              </div>
            </>
          )}
        </div>
      )}

      {/* Pattern Tab */}
      {activeTab === 'Pattern' && (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-1">
            {PATTERN_TYPES.map(p => (
              <button
                key={p}
                onClick={() => setPattern({ type: p })}
                className={`text-[8px] p-1.5 rounded border transition-colors text-center leading-tight ${
                  pattern.type === p ? 'border-[hsl(var(--ppt-selection))] bg-[hsl(var(--ppt-active))]' : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--ppt-hover))]'
                }`}
              >
                {p.replace(/-/g, ' ')}
              </button>
            ))}
          </div>
          <ColorPicker value={pattern.color} onChange={(v) => setPattern({ color: v })} label="Pattern Color" />
          <ColorPicker value={pattern.backgroundColor} onChange={(v) => setPattern({ backgroundColor: v })} label="Background" />
          <div>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Scale: {pattern.scale.toFixed(1)}x</span>
            <input type="range" min="0.5" max="3" step="0.1" value={pattern.scale} onChange={(e) => setPattern({ scale: parseFloat(e.target.value) })} className="w-full" style={{ accentColor: 'hsl(var(--accent))' }} />
          </div>
        </div>
      )}

      {/* Texture Tab */}
      {activeTab === 'Texture' && (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-1">
            {TEXTURE_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setTexture({ type: t })}
                className={`text-[8px] p-1.5 rounded border transition-colors capitalize ${
                  texture.type === t ? 'border-[hsl(var(--ppt-selection))] bg-[hsl(var(--ppt-active))]' : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--ppt-hover))]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Opacity: {texture.opacity}%</span>
            <input type="range" min="10" max="100" value={texture.opacity} onChange={(e) => setTexture({ opacity: Number(e.target.value) })} className="w-full" style={{ accentColor: 'hsl(var(--accent))' }} />
          </div>
          <ColorPicker value={texture.tint || '#ffffff'} onChange={(v) => setTexture({ tint: v })} label="Tint Color" />
        </div>
      )}

      {/* Apply buttons */}
      <div className="pt-2 border-t border-[hsl(var(--border))] space-y-1">
        <button onClick={applyAll} className="text-[10px] px-2 py-1 rounded border border-[hsl(var(--border))] hover:bg-[hsl(var(--ppt-hover))] w-full">
          Apply to All Slides
        </button>
        <button onClick={reset} className="text-[10px] px-2 py-1 rounded border border-[hsl(var(--border))] hover:bg-[hsl(var(--ppt-hover))] w-full text-red-500">
          Reset to Default
        </button>
      </div>
    </div>
  );
};
