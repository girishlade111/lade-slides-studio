import React, { useEffect, useState } from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { HeaderMenu } from '@/components/slides/HeaderMenu';
import { SlideSidebar } from '@/components/slides/SlideSidebar';
import { SlideCanvas } from '@/components/slides/SlideCanvas';
import { PropertiesPanel } from '@/components/slides/PropertiesPanel';
import { SlideToolbar } from '@/components/slides/SlideToolbar';
import { PresentationMode } from '@/components/slides/PresentationMode';
import { StickyNote, ChevronDown, ChevronUp } from 'lucide-react';

const Index: React.FC = () => {
  const { isPresentationMode, loadSavedList, presentation, currentSlideIndex, updateSlideNotes } = usePresentationStore();
  const [showNotes, setShowNotes] = useState(false);
  useKeyboardShortcuts();

  useEffect(() => {
    loadSavedList();
  }, [loadSavedList]);

  if (isPresentationMode) {
    return <PresentationMode />;
  }

  const slide = presentation.slides[currentSlideIndex];

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <HeaderMenu />
      <div className="flex-1 flex overflow-hidden">
        <SlideSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <SlideCanvas />
          {/* Notes Panel */}
          <div className={`border-t border-border bg-card transition-all ${showNotes ? 'h-32' : 'h-8'}`}>
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="w-full h-8 flex items-center justify-center gap-2 text-xs text-muted-foreground hover:bg-muted transition-colors"
            >
              <StickyNote className="w-3 h-3" />
              Presenter Notes
              {showNotes ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>
            {showNotes && slide && (
              <textarea
                value={slide.notes}
                onChange={(e) => updateSlideNotes(currentSlideIndex, e.target.value)}
                placeholder="Add presenter notes here..."
                className="w-full h-[calc(100%-2rem)] px-4 py-2 text-sm text-foreground bg-card outline-none resize-none scrollbar-thin"
              />
            )}
          </div>
        </div>
        <PropertiesPanel />
      </div>
      <SlideToolbar />
      <footer className="h-6 bg-toolbar flex items-center justify-between px-4">
        <span className="text-[10px] text-toolbar-foreground/50">
          Slide {currentSlideIndex + 1} of {presentation.slides.length}
        </span>
        <span className="text-[10px] text-toolbar-foreground/50">Powered by Lade Stack</span>
      </footer>
    </div>
  );
};

export default Index;
