import React, { useState, useCallback } from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import { THEMES } from '@/types/presentation';
import {
  Save, FileDown, FilePlus, Undo2, Redo2, Play, Edit3, Check,
  Palette, Download, FileText, Image as ImageIcon, FileType, Code,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ExportDialog } from './ExportDialog';

export const HeaderMenu: React.FC = () => {
  const {
    presentation, undo, redo, history,
    savePresentation, newPresentation, renamePres,
    setPresentationMode, autoSaveIndicator, savedPresentations,
    loadPresentation, setPresentation,
  } = usePresentationStore();

  const [isRenaming, setIsRenaming] = useState(false);
  const [nameInput, setNameInput] = useState(presentation.name);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportTab, setExportTab] = useState<'pdf' | 'pptx' | 'png' | 'html'>('pdf');

  const handleRename = useCallback(() => {
    renamePres(nameInput);
    setIsRenaming(false);
  }, [nameInput, renamePres]);

  const applyTheme = useCallback((themeId: string) => {
    const theme = THEMES.find(t => t.id === themeId);
    if (!theme) return;
    const slides = presentation.slides.map(s => ({
      ...s,
      background: { type: 'color' as const, value: theme.colors.background },
      objects: s.objects.map(o => {
        if (o.type === 'text' && o.textProps) {
          return { ...o, textProps: { ...o.textProps, color: theme.colors.text, fontFamily: theme.fontFamily } };
        }
        if (o.type === 'shape' && o.shapeProps) {
          return { ...o, shapeProps: { ...o.shapeProps, fill: theme.colors.primary } };
        }
        return o;
      }),
    }));
    setPresentation({ ...presentation, theme: themeId, slides, updatedAt: Date.now() });
    setShowThemePicker(false);
  }, [presentation, setPresentation]);

  const handleExportPDF = useCallback(async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const { toPng } = await import('html-to-image');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [960, 540] });
      const store = usePresentationStore.getState();
      const origIdx = store.currentSlideIndex;

      for (let i = 0; i < presentation.slides.length; i++) {
        store.setCurrentSlide(i);
        await new Promise(r => setTimeout(r, 200));
        const el = document.querySelector('[data-slide-export]') as HTMLElement;
        if (!el) continue;
        const dataUrl = await toPng(el, { width: 960, height: 540, pixelRatio: 2 });
        if (i > 0) pdf.addPage([960, 540], 'landscape');
        pdf.addImage(dataUrl, 'PNG', 0, 0, 960, 540);
      }
      store.setCurrentSlide(origIdx);
      pdf.save(`${presentation.name}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('PDF export failed. Please try again.');
    }
  }, [presentation]);

  const handleExportPPTX = useCallback(async () => {
    try {
      const PptxGenJS = (await import('pptxgenjs')).default;
      const pptx = new PptxGenJS();
      pptx.title = presentation.name;
      pptx.layout = 'LAYOUT_16x9';

      for (const slide of presentation.slides) {
        const pSlide = pptx.addSlide();
        if (slide.background.type === 'color') {
          pSlide.background = { color: slide.background.value.replace('#', '') };
        }
        for (const obj of slide.objects) {
          const xInch = obj.position.x / 96;
          const yInch = obj.position.y / 54 * 7.5;
          const wInch = obj.size.width / 96;
          const hInch = obj.size.height / 54 * 7.5;
          if (obj.type === 'text' && obj.textProps) {
            pSlide.addText(obj.textProps.content, {
              x: xInch, y: obj.position.y / 540 * 7.5,
              w: obj.size.width / 960 * 10, h: obj.size.height / 540 * 7.5,
              fontSize: Math.round(obj.textProps.fontSize * 0.75),
              fontFace: obj.textProps.fontFamily,
              color: obj.textProps.color.replace('#', ''),
              bold: obj.textProps.fontWeight >= 600,
              italic: obj.textProps.fontStyle === 'italic',
              align: obj.textProps.textAlign === 'justify' ? 'left' : obj.textProps.textAlign,
            });
          }
          if (obj.type === 'shape' && obj.shapeProps) {
            const shapeMap: Record<string, string> = {
              rectangle: 'rect', circle: 'ellipse', triangle: 'triangle',
            };
            pSlide.addShape(shapeMap[obj.shapeProps.shapeType] as any || 'rect', {
              x: obj.position.x / 960 * 10, y: obj.position.y / 540 * 7.5,
              w: obj.size.width / 960 * 10, h: obj.size.height / 540 * 7.5,
              fill: { color: obj.shapeProps.fill.replace('#', '') },
            });
          }
          if (obj.type === 'image' && obj.imageProps) {
            pSlide.addImage({
              data: obj.imageProps.src,
              x: obj.position.x / 960 * 10, y: obj.position.y / 540 * 7.5,
              w: obj.size.width / 960 * 10, h: obj.size.height / 540 * 7.5,
            });
          }
        }
      }
      await pptx.writeFile({ fileName: `${presentation.name}.pptx` });
    } catch (err) {
      console.error('PPTX export failed:', err);
      alert('PPTX export failed.');
    }
  }, [presentation]);

  const handleExportPNG = useCallback(async () => {
    const { toPng } = await import('html-to-image');
    const el = document.querySelector('[data-slide-export]') as HTMLElement;
    if (!el) return;
    try {
      const dataUrl = await toPng(el, { pixelRatio: 2 });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${presentation.name}-slide-${usePresentationStore.getState().currentSlideIndex + 1}.png`;
      a.click();
    } catch {
      alert('Failed to export PNG');
    }
  }, [presentation.name]);

  return (
    <>
      <header className="h-12 bg-card border-b border-border flex items-center px-4 gap-3">
        <div className="flex items-center gap-2 mr-4">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">LS</span>
          </div>
          <span className="font-semibold text-sm text-foreground hidden sm:inline">Lade Slides</span>
        </div>

        {isRenaming ? (
          <div className="flex items-center gap-1">
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              className="bg-muted rounded px-2 py-1 text-sm text-foreground outline-none border border-primary"
              autoFocus
            />
            <button onClick={handleRename} className="p-1 rounded hover:bg-muted">
              <Check className="w-4 h-4 text-primary" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setNameInput(presentation.name); setIsRenaming(true); }}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-muted text-sm text-foreground"
          >
            {presentation.name}
            <Edit3 className="w-3 h-3 text-muted-foreground" />
          </button>
        )}

        {autoSaveIndicator && (
          <span className="text-[10px] text-success animate-pulse">Saved ✓</span>
        )}

        <div className="flex-1" />

        <button onClick={undo} disabled={history.past.length === 0} className="p-2 rounded hover:bg-muted disabled:opacity-30 transition-colors" title="Undo (Ctrl+Z)">
          <Undo2 className="w-4 h-4 text-foreground" />
        </button>
        <button onClick={redo} disabled={history.future.length === 0} className="p-2 rounded hover:bg-muted disabled:opacity-30 transition-colors" title="Redo (Ctrl+Y)">
          <Redo2 className="w-4 h-4 text-foreground" />
        </button>

        <div className="w-px h-6 bg-border mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="px-2 py-1.5 rounded hover:bg-muted text-sm text-foreground">File</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => newPresentation()}>
              <FilePlus className="w-4 h-4 mr-2" /> New Presentation
            </DropdownMenuItem>
            <DropdownMenuItem onClick={savePresentation}>
              <Save className="w-4 h-4 mr-2" /> Save (Ctrl+S)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Download className="w-4 h-4 mr-2" /> Export
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => { setShowExportDialog(true); setExportTab('pdf'); }}>
                  <FileText className="w-4 h-4 mr-2" /> Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setShowExportDialog(true); setExportTab('pptx'); }}>
                  <FileType className="w-4 h-4 mr-2" /> Export as PPTX
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setShowExportDialog(true); setExportTab('png'); }}>
                  <ImageIcon className="w-4 h-4 mr-2" /> Export as PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setShowExportDialog(true); setExportTab('html'); }}>
                  <Code className="w-4 h-4 mr-2" /> Export as HTML
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            {savedPresentations.length > 0 && (
              <>
                <div className="px-2 py-1 text-[10px] text-muted-foreground uppercase tracking-wider">Recent</div>
                {savedPresentations.map((p) => (
                  <DropdownMenuItem key={p.id} onClick={() => loadPresentation(p.id)}>
                    📄 {p.name}
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={() => setShowThemePicker(true)}
          className="px-2 py-1.5 rounded hover:bg-muted text-sm text-foreground flex items-center gap-1"
        >
          <Palette className="w-4 h-4" />
          <span className="hidden md:inline">Themes</span>
        </button>

        <button
          onClick={() => setPresentationMode(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Play className="w-4 h-4" />
          Present
        </button>
      </header>

      {/* Theme Picker Dialog */}
      <Dialog open={showThemePicker} onOpenChange={setShowThemePicker}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose a Theme</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto p-1">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => applyTheme(theme.id)}
                className={`group rounded-lg border-2 p-3 text-left transition-all hover:shadow-md ${
                  presentation.theme === theme.id ? 'border-primary shadow-md' : 'border-border hover:border-primary/50'
                }`}
              >
                <div
                  className="w-full h-20 rounded-md mb-2 flex items-center justify-center"
                  style={{ backgroundColor: theme.colors.background }}
                >
                  <div className="flex gap-1">
                    {Object.values(theme.colors).slice(0, 4).map((c, i) => (
                      <div key={i} className="w-5 h-5 rounded-full border border-border/50" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <span className="text-xs font-medium text-foreground">{theme.name}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <ExportDialog open={showExportDialog} onOpenChange={setShowExportDialog} defaultTab={exportTab} />
    </>
  );
};
