import React, { useState, useCallback } from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import { Save, Undo2, Redo2 } from 'lucide-react';

export const PPTTitleBar: React.FC = () => {
  const { presentation, undo, redo, history, savePresentation, renamePres, autoSaveIndicator } = usePresentationStore();
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameInput, setNameInput] = useState(presentation.name);

  const handleRename = useCallback(() => {
    renamePres(nameInput);
    setIsRenaming(false);
  }, [nameInput, renamePres]);

  return (
    <div className="ppt-title-bar px-2 gap-1">
      {/* Quick Access Toolbar */}
      <button
        onClick={savePresentation}
        className="p-1 rounded hover:bg-white/20 transition-colors"
        title="Save (Ctrl+S)"
      >
        <Save className="w-3.5 h-3.5 text-white" />
      </button>
      <button
        onClick={undo}
        disabled={history.past.length === 0}
        className="p-1 rounded hover:bg-white/20 disabled:opacity-30 transition-colors"
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="w-3.5 h-3.5 text-white" />
      </button>
      <button
        onClick={redo}
        disabled={history.future.length === 0}
        className="p-1 rounded hover:bg-white/20 disabled:opacity-30 transition-colors"
        title="Redo (Ctrl+Y)"
      >
        <Redo2 className="w-3.5 h-3.5 text-white" />
      </button>

      <div className="w-px h-4 bg-white/30 mx-1" />

      {/* App Title */}
      <div className="flex-1 flex items-center justify-center gap-2">
        {isRenaming ? (
          <div className="flex items-center gap-1">
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              onBlur={handleRename}
              className="bg-white/20 rounded px-2 py-0.5 text-xs text-white outline-none border border-white/40 w-48"
              autoFocus
            />
          </div>
        ) : (
          <button
            onClick={() => { setNameInput(presentation.name); setIsRenaming(true); }}
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/15 text-xs text-white/90"
          >
            {presentation.name} - Lade Slides
          </button>
        )}
        {autoSaveIndicator && (
          <span className="text-[9px] text-white/70 animate-pulse">Saved</span>
        )}
      </div>
    </div>
  );
};
