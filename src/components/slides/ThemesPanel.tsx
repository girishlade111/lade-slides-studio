import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, Palette, Layout } from 'lucide-react';
import { usePresentationStore } from '@/stores/presentationStore';
import {
  BUILT_IN_THEMES,
  loadCustomThemes,
  saveCustomThemes,
  createDefaultCustomTheme,
  type PresentationTheme,
} from '@/types/presentationTheme';
import { ThemeEditor } from './ThemeEditor';
import { v4 as uuidv4 } from 'uuid';
import type { Slide, SlideObject } from '@/types/presentation';

interface Props {
  onClose: () => void;
}

function makeTemplateSlides(theme: PresentationTheme): Slide[] {
  const bg = { type: 'color' as const, value: theme.colors.background };
  const mkText = (content: string, x: number, y: number, w: number, h: number, fontSize: number, fontWeight: number, isHeading: boolean, textAlign: 'left' | 'center' = 'left'): SlideObject => ({
    id: uuidv4(),
    type: 'text',
    position: { x, y },
    size: { width: w, height: h },
    rotation: 0,
    zIndex: 1,
    locked: false,
    animation: 'none',
    textProps: {
      content,
      fontFamily: isHeading ? theme.fonts.heading : theme.fonts.body,
      fontSize,
      fontWeight,
      fontStyle: 'normal',
      textDecoration: 'none',
      color: isHeading ? theme.colors.textPrimary : theme.colors.textSecondary,
      textAlign,
      lineHeight: 1.3,
      backgroundColor: 'transparent',
    },
  });

  const mkShape = (x: number, y: number, w: number, h: number, fill: string): SlideObject => ({
    id: uuidv4(),
    type: 'shape',
    position: { x, y },
    size: { width: w, height: h },
    rotation: 0,
    zIndex: 0,
    locked: false,
    animation: 'none',
    shapeProps: {
      shapeType: 'rectangle',
      fill,
      fillOpacity: 100,
      stroke: 'transparent',
      strokeWidth: 0,
      strokeStyle: 'solid',
      borderRadius: 0,
      shadow: { enabled: false, color: 'rgba(0,0,0,0.3)', blur: 4, offsetX: 2, offsetY: 2 },
    },
  });

  const defaultTransition = { type: 'none' as const, duration: 0.5, direction: 'left' as const, easing: 'ease-in-out' as const, sound: false };
  const fadeTransition = { type: 'fade' as const, duration: 0.5, direction: 'left' as const, easing: 'ease-in-out' as const, sound: false };

  // 1. Title Slide
  const titleSlide: Slide = {
    id: uuidv4(), order: 0, background: bg, transition: defaultTransition, notes: '',
    objects: [
      mkShape(0, 0, 960, 200, theme.colors.primary),
      mkText('Presentation Title', 80, 220, 800, 80, 48, 700, true, 'center'),
      mkText('Your subtitle goes here', 180, 320, 600, 40, 20, 400, false, 'center'),
    ],
  };

  // 2. Agenda Slide
  const agendaSlide: Slide = {
    id: uuidv4(), order: 1, background: bg, transition: fadeTransition, notes: '',
    objects: [
      mkShape(0, 0, 960, 80, theme.colors.primary),
      mkText('Agenda', 60, 12, 300, 50, 32, 700, true, 'left'),
      { ...mkText('Agenda', 60, 12, 300, 50, 32, 700, true, 'left'), textProps: { ...mkText('Agenda', 60, 12, 300, 50, 32, 700, true, 'left').textProps!, color: '#ffffff' } },
      mkText('• Introduction & Overview\n• Key Findings\n• Detailed Analysis\n• Recommendations\n• Next Steps & Timeline', 80, 110, 500, 300, 22, 400, false, 'left'),
    ].filter((_, i) => i !== 2 ? true : true), // keep all
  };
  // fix agenda title color
  agendaSlide.objects[1] = { ...agendaSlide.objects[1], textProps: { ...agendaSlide.objects[1].textProps!, color: '#ffffff' } };

  // 3. Content Slide
  const contentSlide: Slide = {
    id: uuidv4(), order: 2, background: bg, transition: fadeTransition, notes: '',
    objects: [
      mkShape(0, 0, 960, 70, theme.colors.primary),
      { ...mkText('Content Title', 40, 12, 400, 45, 28, 700, true, 'left'), textProps: { ...mkText('Content Title', 40, 12, 400, 45, 28, 700, true, 'left').textProps!, color: '#ffffff' } },
      mkText('Add your main content here. This slide is great for presenting key information with supporting details.\n\nUse bullet points, images, or charts to illustrate your points effectively.', 60, 100, 520, 350, 18, 400, false, 'left'),
      mkShape(620, 100, 300, 350, theme.colors.surface),
      mkText('Image\nPlaceholder', 700, 220, 140, 60, 16, 400, false, 'center'),
    ],
  };

  // 4. Two-Column Slide
  const twoColSlide: Slide = {
    id: uuidv4(), order: 3, background: bg, transition: { type: 'fade', duration: 0.5 }, notes: '',
    objects: [
      mkShape(0, 0, 960, 70, theme.colors.primary),
      { ...mkText('Comparison', 40, 12, 400, 45, 28, 700, true, 'left'), textProps: { ...mkText('Comparison', 40, 12, 400, 45, 28, 700, true, 'left').textProps!, color: '#ffffff' } },
      mkShape(40, 90, 420, 400, theme.colors.surface),
      mkText('Left Column', 60, 105, 380, 35, 22, 700, true, 'left'),
      mkText('• Point one\n• Point two\n• Point three', 60, 150, 380, 200, 16, 400, false, 'left'),
      mkShape(500, 90, 420, 400, theme.colors.surface),
      mkText('Right Column', 520, 105, 380, 35, 22, 700, true, 'left'),
      mkText('• Point one\n• Point two\n• Point three', 520, 150, 380, 200, 16, 400, false, 'left'),
    ],
  };

  // 5. Thank You Slide
  const thankYouSlide: Slide = {
    id: uuidv4(), order: 4, background: bg, transition: { type: 'fade', duration: 0.5 }, notes: '',
    objects: [
      mkShape(0, 0, 960, 540, theme.colors.primary),
      { ...mkText('Thank You!', 130, 160, 700, 100, 56, 700, true, 'center'), textProps: { ...mkText('Thank You!', 130, 160, 700, 100, 56, 700, true, 'center').textProps!, color: '#ffffff' } },
      { ...mkText('Questions or feedback? Reach out anytime.', 180, 280, 600, 40, 20, 400, false, 'center'), textProps: { ...mkText('Questions or feedback? Reach out anytime.', 180, 280, 600, 40, 20, 400, false, 'center').textProps!, color: 'rgba(255,255,255,0.8)' } },
    ],
  };

  return [titleSlide, agendaSlide, contentSlide, twoColSlide, thankYouSlide];
}

export const ThemesPanel: React.FC<Props> = ({ onClose }) => {
  const store = usePresentationStore();
  const [customThemes, setCustomThemes] = useState<PresentationTheme[]>([]);
  const [editingTheme, setEditingTheme] = useState<PresentationTheme | null>(null);
  const [tab, setTab] = useState<'built-in' | 'custom'>('built-in');

  useEffect(() => {
    setCustomThemes(loadCustomThemes());
  }, []);

  const applyThemeToSlide = useCallback((theme: PresentationTheme, allSlides: boolean) => {
    store.pushHistory();
    const mapObjects = (objects: SlideObject[]) => objects.map(o => {
      if (o.type === 'text' && o.textProps) {
        const isHeading = o.textProps.fontSize >= 28;
        return {
          ...o,
          textProps: {
            ...o.textProps,
            color: isHeading ? theme.colors.textPrimary : theme.colors.textSecondary,
            fontFamily: isHeading ? theme.fonts.heading : theme.fonts.body,
          },
        };
      }
      if (o.type === 'shape' && o.shapeProps) {
        return { ...o, shapeProps: { ...o.shapeProps, fill: theme.colors.primary } };
      }
      return o;
    });

    if (allSlides) {
      const slides = store.presentation.slides.map(s => ({
        ...s,
        background: { type: 'color' as const, value: theme.colors.background },
        objects: mapObjects(s.objects),
      }));
      store.setPresentation({ ...store.presentation, theme: theme.id, slides, updatedAt: Date.now() });
    } else {
      const slides = [...store.presentation.slides];
      const idx = store.currentSlideIndex;
      slides[idx] = {
        ...slides[idx],
        background: { type: 'color' as const, value: theme.colors.background },
        objects: mapObjects(slides[idx].objects),
      };
      store.setPresentation({ ...store.presentation, theme: theme.id, slides, updatedAt: Date.now() });
    }
  }, [store]);

  const createSlidesFromTheme = useCallback((theme: PresentationTheme) => {
    store.pushHistory();
    const templateSlides = makeTemplateSlides(theme);
    const existing = store.presentation.slides;
    const newSlides = [...existing, ...templateSlides];
    newSlides.forEach((s, i) => (s.order = i));
    store.setPresentation({
      ...store.presentation,
      theme: theme.id,
      slides: newSlides,
      updatedAt: Date.now(),
    });
    store.setCurrentSlide(existing.length);
  }, [store]);

  const handleSaveCustomTheme = useCallback(() => {
    if (!editingTheme) return;
    const updated = customThemes.filter(t => t.id !== editingTheme.id);
    updated.push({ ...editingTheme, category: 'custom' });
    saveCustomThemes(updated);
    setCustomThemes(updated);
    setEditingTheme(null);
  }, [editingTheme, customThemes]);

  const handleDeleteCustomTheme = useCallback((id: string) => {
    const updated = customThemes.filter(t => t.id !== id);
    saveCustomThemes(updated);
    setCustomThemes(updated);
  }, [customThemes]);

  const allThemes = tab === 'built-in' ? BUILT_IN_THEMES : customThemes;

  return (
    <div className="w-72 h-full border-l border-[hsl(var(--border))] bg-[hsl(var(--card))] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-1.5">
          <Palette className="w-4 h-4 text-[hsl(var(--ppt-brand))]" />
          <span className="text-xs font-semibold">Themes</span>
        </div>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-[hsl(var(--muted))]">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabs */}
      {!editingTheme && (
        <div className="flex border-b border-[hsl(var(--border))]">
          <button
            onClick={() => setTab('built-in')}
            className={`flex-1 text-[10px] py-1.5 font-medium transition-colors ${
              tab === 'built-in' ? 'border-b-2 border-[hsl(var(--ppt-brand))] text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'
            }`}
          >
            Built-in ({BUILT_IN_THEMES.length})
          </button>
          <button
            onClick={() => setTab('custom')}
            className={`flex-1 text-[10px] py-1.5 font-medium transition-colors ${
              tab === 'custom' ? 'border-b-2 border-[hsl(var(--ppt-brand))] text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'
            }`}
          >
            Custom ({customThemes.length})
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        {editingTheme ? (
          <ThemeEditor
            theme={editingTheme}
            onChange={setEditingTheme}
            onSave={handleSaveCustomTheme}
            onCancel={() => setEditingTheme(null)}
          />
        ) : (
          <>
            {tab === 'custom' && (
              <button
                onClick={() => setEditingTheme(createDefaultCustomTheme())}
                className="w-full flex items-center justify-center gap-1.5 py-2 mb-2 rounded border border-dashed border-[hsl(var(--border))] text-[10px] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
              >
                <Plus className="w-3 h-3" /> Create Custom Theme
              </button>
            )}

            <div className="grid grid-cols-1 gap-2">
              {allThemes.map(theme => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  isActive={store.presentation.theme === theme.id}
                  onApplyCurrent={() => applyThemeToSlide(theme, false)}
                  onApplyAll={() => applyThemeToSlide(theme, true)}
                  onCreateSlides={() => createSlidesFromTheme(theme)}
                  onEdit={theme.category === 'custom' ? () => setEditingTheme(theme) : undefined}
                  onDelete={theme.category === 'custom' ? () => handleDeleteCustomTheme(theme.id) : undefined}
                />
              ))}
            </div>

            {tab === 'custom' && customThemes.length === 0 && (
              <div className="text-center text-[10px] text-[hsl(var(--muted-foreground))] py-8">
                No custom themes yet.<br />Click "Create Custom Theme" to get started.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

interface ThemeCardProps {
  theme: PresentationTheme;
  isActive: boolean;
  onApplyCurrent: () => void;
  onApplyAll: () => void;
  onCreateSlides: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const ThemeCard: React.FC<ThemeCardProps> = ({ theme, isActive, onApplyCurrent, onApplyAll, onCreateSlides, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-lg border-2 transition-all overflow-hidden ${
        isActive ? 'border-[hsl(var(--ppt-selection))] shadow-md' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--ppt-selection))]'
      }`}
    >
      {/* Thumbnail */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="h-14 relative" style={{ backgroundColor: theme.colors.background }}>
          {/* Mini slide preview */}
          <div className="absolute top-1 left-1 right-1 h-3 rounded-sm" style={{ backgroundColor: theme.colors.primary }} />
          <div className="absolute bottom-2 left-2">
            <span className="text-[8px] font-bold" style={{ color: theme.colors.textPrimary, fontFamily: theme.fonts.heading }}>
              Title
            </span>
          </div>
          <div className="absolute bottom-1.5 right-2 flex gap-0.5">
            {[theme.colors.primary, theme.colors.secondary, theme.colors.accent, theme.colors.surface].map((c, i) => (
              <div key={i} className="w-2 h-2 rounded-full border border-black/10" style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        <div className="px-2 py-1.5 flex items-center justify-between">
          <span className="text-[10px] font-medium">{theme.name}</span>
          <span className="text-[8px] text-[hsl(var(--muted-foreground))]">
            {theme.fonts.heading}/{theme.fonts.body}
          </span>
        </div>
      </button>

      {/* Expanded actions */}
      {expanded && (
        <div className="px-2 pb-2 flex flex-col gap-1 border-t border-[hsl(var(--border))]">
          <button
            onClick={onApplyCurrent}
            className="w-full text-[10px] py-1 px-2 rounded bg-[hsl(var(--ppt-brand))] text-[hsl(var(--primary-foreground))] hover:opacity-90 transition-opacity"
          >
            Apply to Current Slide
          </button>
          <button
            onClick={onApplyAll}
            className="w-full text-[10px] py-1 px-2 rounded bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:opacity-90 transition-opacity"
          >
            Apply to All Slides
          </button>
          <button
            onClick={onCreateSlides}
            className="w-full text-[10px] py-1 px-2 rounded border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors flex items-center justify-center gap-1"
          >
            <Layout className="w-3 h-3" /> Create 5 Template Slides
          </button>
          {(onEdit || onDelete) && (
            <div className="flex gap-1 pt-0.5">
              {onEdit && (
                <button onClick={onEdit} className="flex-1 text-[9px] py-0.5 rounded border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]">
                  Edit
                </button>
              )}
              {onDelete && (
                <button onClick={onDelete} className="text-[9px] py-0.5 px-2 rounded border border-[hsl(var(--destructive))] text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive-foreground))]">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
