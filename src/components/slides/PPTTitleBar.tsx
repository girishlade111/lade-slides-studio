import React, { useState, useCallback } from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import { useCollaborationStore } from '@/stores/collaborationStore';
import { Save, Undo2, Redo2, Play, MessageSquare, History, Activity } from 'lucide-react';

export const PPTTitleBar: React.FC = () => {
  const { presentation, undo, redo, history, savePresentation, renamePres, autoSaveIndicator, setCurrentSlide, setPresentationMode } = usePresentationStore();
  const { activePanel, setActivePanel, getTotalUnresolved } = useCollaborationStore();
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameInput, setNameInput] = useState(presentation.name);

  const handleRename = useCallback(() => {
    renamePres(nameInput);
    setIsRenaming(false);
  }, [nameInput, renamePres]);

  const unresolvedCount = getTotalUnresolved();

  return (
    <div className="ppt-title-bar px-2 gap-1">
      {/* Quick Access Toolbar */}
      <button onClick={savePresentation} className="p-1 rounded hover:bg-white/20 transition-colors" title="Save (Ctrl+S)">
        <Save className="w-3.5 h-3.5 text-white" />
      </button>
      <button onClick={undo} disabled={history.past.length === 0} className="p-1 rounded hover:bg-white/20 disabled:opacity-30 transition-colors" title="Undo (Ctrl+Z)">
        <Undo2 className="w-3.5 h-3.5 text-white" />
      </button>
      <button onClick={redo} disabled={history.future.length === 0} className="p-1 rounded hover:bg-white/20 disabled:opacity-30 transition-colors" title="Redo (Ctrl+Y)">
        <Redo2 className="w-3.5 h-3.5 text-white" />
      </button>

      <div className="w-px h-4 bg-white/30 mx-1" />

      {/* App Title */}
      <div className="flex-1 flex items-center justify-center gap-2">
        {isRenaming ? (
          <div className="flex items-center gap-1">
            <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRename()} onBlur={handleRename}
              className="bg-white/20 rounded px-2 py-0.5 text-xs text-white outline-none border border-white/40 w-48" autoFocus />
          </div>
        ) : (
          <button onClick={() => { setNameInput(presentation.name); setIsRenaming(true); }}
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/15 text-xs text-white/90">
            {presentation.name} - Lade Slides
          </button>
        )}
        {autoSaveIndicator && (
          <span className="text-[9px] text-white/70 animate-pulse">Saved</span>
        )}
      </div>

      {/* Collaboration buttons */}
      <div className="flex items-center gap-0.5">
        <button onClick={() => setActivePanel('comments')}
          className={`relative p-1.5 rounded transition-colors ${activePanel === 'comments' ? 'bg-white/25' : 'hover:bg-white/15'}`} title="Comments">
          <MessageSquare className="w-3.5 h-3.5 text-white" />
          {unresolvedCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-bold">{unresolvedCount}</span>
          )}
        </button>
        <button onClick={() => setActivePanel('versions')}
          className={`p-1.5 rounded transition-colors ${activePanel === 'versions' ? 'bg-white/25' : 'hover:bg-white/15'}`} title="Version History">
          <History className="w-3.5 h-3.5 text-white" />
        </button>
        <button onClick={() => setActivePanel('activity')}
          className={`p-1.5 rounded transition-colors ${activePanel === 'activity' ? 'bg-white/25' : 'hover:bg-white/15'}`} title="Activity Log">
          <Activity className="w-3.5 h-3.5 text-white" />
        </button>
      </div>

      <div className="w-px h-4 bg-white/30 mx-1" />

      {/* Present button */}
      <button onClick={() => { setCurrentSlide(0); setPresentationMode(true); }}
        className="flex items-center gap-1.5 px-3 py-1 rounded bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-colors" title="Start Presentation (F5)">
        <Play className="w-3.5 h-3.5 fill-current" />
        Present
      </button>
    </div>
  );
};
