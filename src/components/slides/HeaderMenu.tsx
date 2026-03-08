import React, { useState, useCallback } from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import {
  Save, FileDown, FilePlus, Undo2, Redo2, Play, Edit3, Check,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export const HeaderMenu: React.FC = () => {
  const {
    presentation, undo, redo, history,
    savePresentation, newPresentation, renamePres,
    setPresentationMode, autoSaveIndicator, savedPresentations,
    loadPresentation, loadSavedList,
  } = usePresentationStore();

  const [isRenaming, setIsRenaming] = useState(false);
  const [nameInput, setNameInput] = useState(presentation.name);

  const handleRename = useCallback(() => {
    renamePres(nameInput);
    setIsRenaming(false);
  }, [nameInput, renamePres]);

  const handleExportPDF = useCallback(async () => {
    const { jsPDF } = await import('jspdf');
    const { toPng } = await import('html-to-image');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [960, 540] });

    // Simple approach: export current view
    const slides = document.querySelectorAll('[data-slide-export]');
    // Fallback: just alert for now
    alert('PDF export: For production, use a proper slide rendering pipeline. This is a demo.');
  }, []);

  const handleExportPNG = useCallback(async () => {
    const { toPng } = await import('html-to-image');
    const slideEl = document.querySelector('[data-slide-export]') as HTMLElement;
    if (!slideEl) return;
    try {
      const dataUrl = await toPng(slideEl);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${presentation.name}-slide.png`;
      a.click();
    } catch {
      alert('Failed to export PNG');
    }
  }, [presentation.name]);

  return (
    <header className="h-12 bg-card border-b border-border flex items-center px-4 gap-3">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-xs font-bold">LS</span>
        </div>
        <span className="font-semibold text-sm text-foreground hidden sm:inline">Lade Slides</span>
      </div>

      {/* Presentation Name */}
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

      {/* Actions */}
      <button onClick={undo} disabled={history.past.length === 0} className="p-2 rounded hover:bg-muted disabled:opacity-30 transition-colors" title="Undo (Ctrl+Z)">
        <Undo2 className="w-4 h-4 text-foreground" />
      </button>
      <button onClick={redo} disabled={history.future.length === 0} className="p-2 rounded hover:bg-muted disabled:opacity-30 transition-colors" title="Redo (Ctrl+Y)">
        <Redo2 className="w-4 h-4 text-foreground" />
      </button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* File menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="px-2 py-1.5 rounded hover:bg-muted text-sm text-foreground">File</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => newPresentation()}>
            <FilePlus className="w-4 h-4 mr-2" /> New Presentation
          </DropdownMenuItem>
          <DropdownMenuItem onClick={savePresentation}>
            <Save className="w-4 h-4 mr-2" /> Save
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleExportPNG}>
            <FileDown className="w-4 h-4 mr-2" /> Export as PNG
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {savedPresentations.length > 0 && (
            <>
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
        onClick={() => setPresentationMode(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <Play className="w-4 h-4" />
        Present
      </button>
    </header>
  );
};
