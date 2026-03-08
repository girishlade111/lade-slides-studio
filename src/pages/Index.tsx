import React, { useEffect, useState } from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { PPTTitleBar } from '@/components/slides/PPTTitleBar';
import { PPTRibbon } from '@/components/slides/PPTRibbon';
import { PPTSlidePanel } from '@/components/slides/PPTSlidePanel';
import { PPTCanvas } from '@/components/slides/PPTCanvas';
import { PPTStatusBar } from '@/components/slides/PPTStatusBar';
import { PropertiesPanel } from '@/components/slides/PropertiesPanel';
import { PresentationMode } from '@/components/slides/PresentationMode';
import { ChevronDown, ChevronUp } from 'lucide-react';

const Index: React.FC = () => {
  const { isPresentationMode, loadSavedList, presentation, currentSlideIndex, updateSlideNotes } = usePresentationStore();
  const [showNotes, setShowNotes] = useState(false);
  const [showProps, setShowProps] = useState(true);
  useKeyboardShortcuts();

  useEffect(() => {
    loadSavedList();
  }, [loadSavedList]);

  if (isPresentationMode) {
    return <PresentationMode />;
  }

  const slide = presentation.slides[currentSlideIndex];

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'hsl(var(--ppt-ribbon-bg))' }}>
      {/* PowerPoint Title Bar */}
      <PPTTitleBar />

      {/* PowerPoint Ribbon */}
      <PPTRibbon />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Slide Panel */}
        <PPTSlidePanel />

        {/* Center: Canvas + Notes */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <PPTCanvas />

          {/* Notes Pane - PowerPoint style */}
          <div
            className={`border-t border-[hsl(var(--border))] bg-white transition-all ${showNotes ? 'h-28' : 'h-6'}`}
          >
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="w-full h-6 flex items-center px-3 gap-1 text-[11px] text-[hsl(var(--muted-foreground))] hover:bg-black/5 transition-colors"
            >
              {showNotes ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              Notes
            </button>
            {showNotes && slide && (
              <textarea
                value={slide.notes}
                onChange={(e) => updateSlideNotes(currentSlideIndex, e.target.value)}
                placeholder="Click to add notes"
                className="w-full h-[calc(100%-1.5rem)] px-3 py-1 text-[12px] text-[hsl(var(--foreground))] bg-white outline-none resize-none scrollbar-thin"
                style={{ fontFamily: "'Segoe UI', 'Inter', sans-serif" }}
              />
            )}
          </div>
        </div>

        {/* Properties Panel */}
        {showProps && <PropertiesPanel />}
      </div>

      {/* PowerPoint Status Bar */}
      <PPTStatusBar />
    </div>
  );
};

export default Index;
