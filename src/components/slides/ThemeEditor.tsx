import React from 'react';
import type { PresentationTheme } from '@/types/presentationTheme';
import { FONTS } from '@/types/presentation';

interface Props {
  theme: PresentationTheme;
  onChange: (t: PresentationTheme) => void;
  onSave: () => void;
  onCancel: () => void;
}

const colorFields: { key: keyof PresentationTheme['colors']; label: string }[] = [
  { key: 'background', label: 'Background' },
  { key: 'surface', label: 'Surface' },
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'accent', label: 'Accent' },
  { key: 'textPrimary', label: 'Text Primary' },
  { key: 'textSecondary', label: 'Text Secondary' },
];

export const ThemeEditor: React.FC<Props> = ({ theme, onChange, onSave, onCancel }) => {
  const updateColor = (key: keyof PresentationTheme['colors'], value: string) => {
    onChange({ ...theme, colors: { ...theme.colors, [key]: value } });
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] mb-1 block">Theme Name</label>
        <input
          type="text"
          value={theme.name}
          onChange={(e) => onChange({ ...theme, name: e.target.value })}
          className="ppt-input w-full px-2 py-1.5 text-xs"
          placeholder="My Theme"
        />
      </div>

      <div>
        <label className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] mb-1.5 block">Colors</label>
        <div className="grid grid-cols-2 gap-2">
          {colorFields.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <input
                type="color"
                value={theme.colors[key]}
                onChange={(e) => updateColor(key, e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border-0 p-0"
              />
              <span className="text-[10px]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] mb-1.5 block">Fonts</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[9px] text-[hsl(var(--muted-foreground))]">Heading</span>
            <select
              className="ppt-select w-full text-xs"
              value={theme.fonts.heading}
              onChange={(e) => onChange({ ...theme, fonts: { ...theme.fonts, heading: e.target.value } })}
            >
              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <span className="text-[9px] text-[hsl(var(--muted-foreground))]">Body</span>
            <select
              className="ppt-select w-full text-xs"
              value={theme.fonts.body}
              onChange={(e) => onChange({ ...theme, fonts: { ...theme.fonts, body: e.target.value } })}
            >
              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div>
        <label className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] mb-1.5 block">Preview</label>
        <div
          className="rounded-md p-3 border border-[hsl(var(--border))]"
          style={{ backgroundColor: theme.colors.background }}
        >
          <h3 className="text-sm font-bold mb-1" style={{ color: theme.colors.textPrimary, fontFamily: theme.fonts.heading }}>
            Sample Title
          </h3>
          <p className="text-[10px] mb-2" style={{ color: theme.colors.textSecondary, fontFamily: theme.fonts.body }}>
            Body text preview with theme fonts
          </p>
          <div className="flex gap-1">
            <div className="w-6 h-3 rounded-sm" style={{ backgroundColor: theme.colors.primary }} />
            <div className="w-6 h-3 rounded-sm" style={{ backgroundColor: theme.colors.secondary }} />
            <div className="w-6 h-3 rounded-sm" style={{ backgroundColor: theme.colors.accent }} />
            <div className="w-6 h-3 rounded-sm" style={{ backgroundColor: theme.colors.surface }} />
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={onSave}
          className="flex-1 px-3 py-1.5 text-xs rounded bg-[hsl(var(--ppt-brand))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
        >
          Save Theme
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs rounded border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
