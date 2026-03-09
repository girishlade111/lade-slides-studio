import React, { useEffect, useState, useRef } from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import { useCollaborationStore } from '@/stores/collaborationStore';
import { useMasterSlideStore } from '@/stores/masterSlideStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { PPTTitleBar } from '@/components/slides/PPTTitleBar';
import { PPTRibbon } from '@/components/slides/PPTRibbon';
import { PPTSlidePanel } from '@/components/slides/PPTSlidePanel';
import { PPTCanvas } from '@/components/slides/PPTCanvas';
import { PPTStatusBar } from '@/components/slides/PPTStatusBar';
import { PropertiesPanel } from '@/components/slides/PropertiesPanel';
import { PresentationMode } from '@/components/slides/PresentationMode';
import { ThemesPanel } from '@/components/slides/ThemesPanel';
import { TransitionsPanel } from '@/components/slides/TransitionsPanel';
import { AnimationsPanel } from '@/components/slides/AnimationsPanel';
import { CommentsPanel } from '@/components/slides/CommentsPanel';
import { VersionHistoryPanel } from '@/components/slides/VersionHistoryPanel';
import { ActivityLogPanel } from '@/components/slides/ActivityLogPanel';
import { MasterSlideEditor } from '@/components/slides/MasterSlideEditor';
import { ChevronDown, ChevronUp } from 'lucide-react';

const Index: React.FC = () => {
  const { isPresentationMode, loadSavedList, presentation, currentSlideIndex, updateSlideNotes } = usePresentationStore();
  const { activePanel, setActivePanel, loadVersions, saveVersion } = useCollaborationStore();
  const { isMasterEditMode, setMasterEditMode, loadMasters } = useMasterSlideStore();
  const [showNotes, setShowNotes] = useState(false);
  const [showProps] = useState(true);
  const [showThemesPanel, setShowThemesPanel] = useState(false);
  const [showTransitionsPanel, setShowTransitionsPanel] = useState(false);
  const [showAnimationsPanel, setShowAnimationsPanel] = useState(false);
  const prevPresentationRef = useRef<typeof presentation | null>(null);
  useKeyboardShortcuts();

  useEffect(() => {
    loadSavedList();
    loadMasters();
  }, [loadSavedList, loadMasters]);

  useEffect(() => {
    loadVersions(presentation.id);
  }, [presentation.id, loadVersions]);

  useEffect(() => {
    const interval = setInterval(() => {
      saveVersion('auto', presentation, prevPresentationRef.current || undefined);
      prevPresentationRef.current = JSON.parse(JSON.stringify(presentation));
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [presentation, saveVersion]);

  if (isPresentationMode) {
    return <PresentationMode />;
  }

  if (isMasterEditMode) {
    return (
      <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'hsl(var(--ppt-ribbon-bg))' }}>
        <MasterSlideEditor onClose={() => setMasterEditMode(false)} />
      </div>
    );
  }

  const slide = presentation.slides[currentSlideIndex];

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'hsl(var(--ppt-ribbon-bg))' }}>
      <PPTTitleBar />
      <PPTRibbon
        onToggleThemes={() => { setShowThemesPanel(!showThemesPanel); setShowTransitionsPanel(false); setShowAnimationsPanel(false); }}
        onToggleTransitions={() => { setShowTransitionsPanel(!showTransitionsPanel); setShowThemesPanel(false); setShowAnimationsPanel(false); }}
        onToggleAnimations={() => { setShowAnimationsPanel(!showAnimationsPanel); setShowThemesPanel(false); setShowTransitionsPanel(false); }}
        onToggleMasterEditor={() => setMasterEditMode(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        <PPTSlidePanel />

        <div className="flex-1 flex flex-col overflow-hidden">
          <PPTCanvas />

          <div className={`border-t border-[hsl(var(--border))] bg-white transition-all ${showNotes ? 'h-28' : 'h-6'}`}>
            <button onClick={() => setShowNotes(!showNotes)}
              className="w-full h-6 flex items-center px-3 gap-1 text-[11px] text-[hsl(var(--muted-foreground))] hover:bg-black/5 transition-colors">
              {showNotes ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              Notes
            </button>
            {showNotes && slide && (
              <textarea value={slide.notes} onChange={(e) => updateSlideNotes(currentSlideIndex, e.target.value)}
                placeholder="Click to add notes"
                className="w-full h-[calc(100%-1.5rem)] px-3 py-1 text-[12px] text-[hsl(var(--foreground))] bg-white outline-none resize-none scrollbar-thin"
                style={{ fontFamily: "'Segoe UI', 'Inter', sans-serif" }} />
            )}
          </div>
        </div>

        {showProps && activePanel === 'none' && <PropertiesPanel />}

        {activePanel === 'comments' && <CommentsPanel onClose={() => setActivePanel('comments')} />}
        {activePanel === 'versions' && <VersionHistoryPanel onClose={() => setActivePanel('versions')} />}
        {activePanel === 'activity' && <ActivityLogPanel onClose={() => setActivePanel('activity')} />}

        {showThemesPanel && <ThemesPanel onClose={() => setShowThemesPanel(false)} />}
        {showTransitionsPanel && <TransitionsPanel onClose={() => setShowTransitionsPanel(false)} />}
        {showAnimationsPanel && <AnimationsPanel onClose={() => setShowAnimationsPanel(false)} />}
      </div>

      <PPTStatusBar />
    </div>
  );
};

export default Index;
