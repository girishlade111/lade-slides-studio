import React from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import { FONTS, PRESET_COLORS } from '@/types/presentation';
import type { TransitionType, AnimationType } from '@/types/presentation';
import { Trash2, ArrowUp, ArrowDown, RotateCw, Lock, Unlock } from 'lucide-react';

const TRANSITION_TYPES: { value: TransitionType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'fade', label: 'Fade' },
  { value: 'slide-left', label: 'Slide Left' },
  { value: 'slide-right', label: 'Slide Right' },
  { value: 'slide-up', label: 'Slide Up' },
  { value: 'slide-down', label: 'Slide Down' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'flip', label: 'Flip' },
];

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
      <div className="w-64 bg-card border-l border-border p-4 overflow-y-auto scrollbar-thin">
        <h3 className="text-sm font-semibold mb-4 text-foreground">Slide Properties</h3>
        <SlideBackgroundEditor
          slide={slide}
          slideIndex={currentSlideIndex}
          updateSlideBackground={updateSlideBackground}
          pushHistory={pushHistory}
        />
        {slide && (
          <TransitionEditor slide={slide} slideIndex={currentSlideIndex} />
        )}
      </div>
    );
  }

  const update = (updates: any) => {
    updateObject(currentSlideIndex, selectedObj.id, updates);
  };

  return (
    <div className="w-64 bg-card border-l border-border p-4 overflow-y-auto scrollbar-thin space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground capitalize">{selectedObj.type}</h3>
        <div className="flex gap-1">
          <button
            onClick={() => update({ locked: !selectedObj.locked })}
            className="p-1 rounded hover:bg-muted"
            title={selectedObj.locked ? 'Unlock' : 'Lock'}
          >
            {selectedObj.locked ? <Lock className="w-4 h-4 text-warning" /> : <Unlock className="w-4 h-4 text-muted-foreground" />}
          </button>
          <button onClick={() => deleteObjects([selectedObj.id])} className="p-1 rounded hover:bg-destructive/10" title="Delete">
            <Trash2 className="w-4 h-4 text-destructive" />
          </button>
        </div>
      </div>

      <Section title="Position & Size">
        <div className="grid grid-cols-2 gap-2">
          <NumInput label="X" value={Math.round(selectedObj.position.x)} onChange={(v) => update({ position: { ...selectedObj.position, x: v } })} />
          <NumInput label="Y" value={Math.round(selectedObj.position.y)} onChange={(v) => update({ position: { ...selectedObj.position, y: v } })} />
          <NumInput label="W" value={Math.round(selectedObj.size.width)} onChange={(v) => update({ size: { ...selectedObj.size, width: v } })} />
          <NumInput label="H" value={Math.round(selectedObj.size.height)} onChange={(v) => update({ size: { ...selectedObj.size, height: v } })} />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <RotateCw className="w-3 h-3 text-muted-foreground" />
          <NumInput label="°" value={selectedObj.rotation} onChange={(v) => update({ rotation: v })} />
        </div>
      </Section>

      <Section title="Layer">
        <div className="flex gap-1">
          <SmallBtn onClick={() => {
            const maxZ = Math.max(...slide.objects.map(o => o.zIndex));
            update({ zIndex: maxZ + 1 });
          }}>
            <ArrowUp className="w-3 h-3" /> Front
          </SmallBtn>
          <SmallBtn onClick={() => update({ zIndex: Math.max(0, selectedObj.zIndex - 1) })}>
            <ArrowDown className="w-3 h-3" /> Back
          </SmallBtn>
        </div>
      </Section>

      <Section title="Animation">
        <select
          value={selectedObj.animation}
          onChange={(e) => update({ animation: e.target.value })}
          className="w-full bg-muted rounded px-2 py-1.5 text-xs text-foreground outline-none"
        >
          {ANIMATION_TYPES.map(a => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
      </Section>

      {selectedObj.type === 'text' && selectedObj.textProps && (
        <TextPropsEditor obj={selectedObj} update={update} />
      )}
      {selectedObj.type === 'shape' && selectedObj.shapeProps && (
        <ShapePropsEditor obj={selectedObj} update={update} />
      )}
      {selectedObj.type === 'image' && selectedObj.imageProps && (
        <ImagePropsEditor obj={selectedObj} update={update} />
      )}
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">{title}</h4>
    {children}
  </div>
);

const NumInput: React.FC<{ label: string; value: number; onChange: (v: number) => void }> = ({ label, value, onChange }) => (
  <div className="flex items-center gap-1">
    <span className="text-[10px] text-muted-foreground w-3">{label}</span>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full bg-muted rounded px-2 py-1 text-xs text-foreground border-none outline-none"
    />
  </div>
);

const SmallBtn: React.FC<{ children: React.ReactNode; onClick: () => void }> = ({ children, onClick }) => (
  <button onClick={onClick} className="flex items-center gap-1 px-2 py-1 text-xs bg-muted rounded hover:bg-muted-foreground/20 transition-colors text-foreground">
    {children}
  </button>
);

const ColorPicker: React.FC<{ value: string; onChange: (v: string) => void; label: string }> = ({ value, onChange, label }) => (
  <div>
    <span className="text-[10px] text-muted-foreground">{label}</span>
    <div className="flex items-center gap-2 mt-1">
      <input type="color" value={value === 'transparent' ? '#ffffff' : value} onChange={(e) => onChange(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-muted rounded px-2 py-1 text-xs text-foreground outline-none"
      />
    </div>
    <div className="flex flex-wrap gap-1 mt-1">
      {PRESET_COLORS.slice(0, 12).map((c) => (
        <button key={c} onClick={() => onChange(c)} className="w-4 h-4 rounded-sm border border-border" style={{ backgroundColor: c }} />
      ))}
    </div>
  </div>
);

const TextPropsEditor: React.FC<{ obj: any; update: (u: any) => void }> = ({ obj, update }) => {
  const tp = obj.textProps;
  const up = (changes: any) => update({ textProps: { ...tp, ...changes } });
  return (
    <>
      <Section title="Font">
        <select
          value={tp.fontFamily}
          onChange={(e) => up({ fontFamily: e.target.value })}
          className="w-full bg-muted rounded px-2 py-1.5 text-xs text-foreground outline-none mb-2"
        >
          {FONTS.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <NumInput label="Sz" value={tp.fontSize} onChange={(v) => up({ fontSize: Math.max(8, Math.min(96, v)) })} />
          <select
            value={tp.fontWeight}
            onChange={(e) => up({ fontWeight: Number(e.target.value) })}
            className="bg-muted rounded px-2 py-1 text-xs text-foreground outline-none"
          >
            <option value={300}>Light</option>
            <option value={400}>Regular</option>
            <option value={500}>Medium</option>
            <option value={600}>Semi Bold</option>
            <option value={700}>Bold</option>
          </select>
        </div>
      </Section>

      <Section title="Style">
        <div className="flex gap-1">
          <SmallBtn onClick={() => up({ fontStyle: tp.fontStyle === 'italic' ? 'normal' : 'italic' })}>
            <span className={tp.fontStyle === 'italic' ? 'italic font-bold' : 'italic'}>I</span>
          </SmallBtn>
          <SmallBtn onClick={() => up({ textDecoration: tp.textDecoration === 'underline' ? 'none' : 'underline' })}>
            <span className={tp.textDecoration === 'underline' ? 'underline font-bold' : 'underline'}>U</span>
          </SmallBtn>
          <SmallBtn onClick={() => up({ textDecoration: tp.textDecoration === 'line-through' ? 'none' : 'line-through' })}>
            <span className={tp.textDecoration === 'line-through' ? 'line-through font-bold' : 'line-through'}>S</span>
          </SmallBtn>
        </div>
        <div className="flex gap-1 mt-2">
          {(['left', 'center', 'right', 'justify'] as const).map((a) => (
            <SmallBtn key={a} onClick={() => up({ textAlign: a })}>
              <span className={`text-[10px] ${tp.textAlign === a ? 'font-bold text-primary' : ''}`}>{a[0].toUpperCase()}</span>
            </SmallBtn>
          ))}
        </div>
      </Section>

      <Section title="Color">
        <ColorPicker value={tp.color} onChange={(v) => up({ color: v })} label="Text Color" />
        <div className="mt-2">
          <ColorPicker value={tp.backgroundColor} onChange={(v) => up({ backgroundColor: v })} label="Background" />
        </div>
      </Section>

      <Section title="Line Height">
        <input
          type="range" min="1" max="3" step="0.1"
          value={tp.lineHeight}
          onChange={(e) => up({ lineHeight: parseFloat(e.target.value) })}
          className="w-full accent-primary"
        />
        <span className="text-[10px] text-muted-foreground">{tp.lineHeight}</span>
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
        <ColorPicker value={sp.fill} onChange={(v) => up({ fill: v })} label="Fill Color" />
        <div className="mt-2">
          <span className="text-[10px] text-muted-foreground">Opacity: {sp.fillOpacity}%</span>
          <input
            type="range" min="0" max="100" value={sp.fillOpacity}
            onChange={(e) => up({ fillOpacity: Number(e.target.value) })}
            className="w-full accent-primary"
          />
        </div>
      </Section>
      <Section title="Border">
        <ColorPicker value={sp.stroke === 'transparent' ? '#000000' : sp.stroke} onChange={(v) => up({ stroke: v })} label="Border Color" />
        <div className="mt-1">
          <NumInput label="W" value={sp.strokeWidth} onChange={(v) => up({ strokeWidth: Math.max(0, Math.min(10, v)) })} />
        </div>
      </Section>
      {sp.shapeType === 'rectangle' && (
        <Section title="Corner Radius">
          <input
            type="range" min="0" max="50" value={sp.borderRadius}
            onChange={(e) => up({ borderRadius: Number(e.target.value) })}
            className="w-full accent-primary"
          />
          <span className="text-[10px] text-muted-foreground">{sp.borderRadius}px</span>
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
        <select
          value={ip.objectFit}
          onChange={(e) => up({ objectFit: e.target.value })}
          className="w-full bg-muted rounded px-2 py-1.5 text-xs text-foreground outline-none"
        >
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
          <option value="fill">Fill</option>
        </select>
      </Section>
      <Section title="Opacity">
        <input
          type="range" min="0" max="100" value={ip.opacity}
          onChange={(e) => up({ opacity: Number(e.target.value) })}
          className="w-full accent-primary"
        />
        <span className="text-[10px] text-muted-foreground">{ip.opacity}%</span>
      </Section>
      <Section title="Filter">
        <select
          value={ip.filter}
          onChange={(e) => up({ filter: e.target.value })}
          className="w-full bg-muted rounded px-2 py-1.5 text-xs text-foreground outline-none"
        >
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

const TransitionEditor: React.FC<{ slide: any; slideIndex: number }> = ({ slide, slideIndex }) => {
  const { updateObject, pushHistory, presentation, setPresentation } = usePresentationStore();

  const updateTransition = (updates: Partial<{ type: TransitionType; duration: number }>) => {
    pushHistory();
    const slides = [...presentation.slides];
    slides[slideIndex] = {
      ...slides[slideIndex],
      transition: { ...slides[slideIndex].transition, ...updates },
    };
    setPresentation({ ...presentation, slides, updatedAt: Date.now() });
  };

  return (
    <div className="mt-4">
      <Section title="Slide Transition">
        <select
          value={slide.transition.type}
          onChange={(e) => updateTransition({ type: e.target.value as TransitionType })}
          className="w-full bg-muted rounded px-2 py-1.5 text-xs text-foreground outline-none mb-2"
        >
          {TRANSITION_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        {slide.transition.type !== 'none' && (
          <div>
            <span className="text-[10px] text-muted-foreground">Duration: {slide.transition.duration}s</span>
            <input
              type="range" min="0.3" max="3" step="0.1"
              value={slide.transition.duration}
              onChange={(e) => updateTransition({ duration: parseFloat(e.target.value) })}
              className="w-full accent-primary"
            />
          </div>
        )}
      </Section>
    </div>
  );
};

const SlideBackgroundEditor: React.FC<{
  slide: any;
  slideIndex: number;
  updateSlideBackground: (i: number, bg: any) => void;
  pushHistory: () => void;
}> = ({ slide, slideIndex, updateSlideBackground, pushHistory }) => {
  if (!slide) return null;
  return (
    <div className="space-y-3">
      <Section title="Background Type">
        <select
          value={slide.background.type}
          onChange={(e) => {
            pushHistory();
            const type = e.target.value as any;
            if (type === 'color') updateSlideBackground(slideIndex, { type: 'color', value: '#ffffff' });
            else if (type === 'gradient') updateSlideBackground(slideIndex, { type: 'gradient', value: '#667eea', secondaryValue: '#764ba2', gradientDirection: '135deg' });
          }}
          className="w-full bg-muted rounded px-2 py-1.5 text-xs text-foreground outline-none"
        >
          <option value="color">Solid Color</option>
          <option value="gradient">Gradient</option>
        </select>
      </Section>
      {slide.background.type === 'color' && (
        <ColorPicker
          value={slide.background.value}
          onChange={(v) => { pushHistory(); updateSlideBackground(slideIndex, { ...slide.background, value: v }); }}
          label="Background Color"
        />
      )}
      {slide.background.type === 'gradient' && (
        <>
          <ColorPicker
            value={slide.background.value}
            onChange={(v) => { pushHistory(); updateSlideBackground(slideIndex, { ...slide.background, value: v }); }}
            label="Start Color"
          />
          <ColorPicker
            value={slide.background.secondaryValue || '#ffffff'}
            onChange={(v) => { pushHistory(); updateSlideBackground(slideIndex, { ...slide.background, secondaryValue: v }); }}
            label="End Color"
          />
          <div>
            <span className="text-[10px] text-muted-foreground">Direction</span>
            <select
              value={slide.background.gradientDirection || '135deg'}
              onChange={(e) => { pushHistory(); updateSlideBackground(slideIndex, { ...slide.background, gradientDirection: e.target.value }); }}
              className="w-full bg-muted rounded px-2 py-1.5 text-xs text-foreground outline-none mt-1"
            >
              <option value="0deg">Top → Bottom</option>
              <option value="90deg">Left → Right</option>
              <option value="135deg">Diagonal ↘</option>
              <option value="180deg">Bottom → Top</option>
              <option value="270deg">Right → Left</option>
              <option value="45deg">Diagonal ↗</option>
            </select>
          </div>
        </>
      )}
    </div>
  );
};
