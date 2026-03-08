import React, { useEffect } from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { HeaderMenu } from '@/components/slides/HeaderMenu';
import { SlideSidebar } from '@/components/slides/SlideSidebar';
import { SlideCanvas } from '@/components/slides/SlideCanvas';
import { PropertiesPanel } from '@/components/slides/PropertiesPanel';
import { SlideToolbar } from '@/components/slides/SlideToolbar';
import { PresentationMode } from '@/components/slides/PresentationMode';

const Index: React.FC = () => {
  const { isPresentationMode, loadSavedList } = usePresentationStore();
  useKeyboardShortcuts();

  useEffect(() => {
    loadSavedList();
  }, [loadSavedList]);

  if (isPresentationMode) {
    return <PresentationMode />;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <HeaderMenu />
      <div className="flex-1 flex overflow-hidden">
        <SlideSidebar />
        <SlideCanvas />
        <PropertiesPanel />
      </div>
      <SlideToolbar />
      <footer className="h-6 bg-toolbar flex items-center justify-center">
        <span className="text-[10px] text-toolbar-foreground/50">Powered by Lade Stack</span>
      </footer>
    </div>
  );
};

export default Index;
