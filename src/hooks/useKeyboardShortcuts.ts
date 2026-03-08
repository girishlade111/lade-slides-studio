import { useEffect, useRef } from 'react';
import { usePresentationStore } from '@/stores/presentationStore';

export const useKeyboardShortcuts = () => {
  const store = usePresentationStore();
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save debounced
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      store.savePresentation();
    }, 3000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [store.presentation.updatedAt]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditing = target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // Text formatting shortcuts (work even in editing mode for selected text object)
      if (e.ctrlKey || e.metaKey) {
        const selectedObj = store.getCurrentSlide()?.objects.find(o => store.selectedObjectIds.includes(o.id));
        const tp = selectedObj?.textProps;

        if (tp && selectedObj) {
          const updateTp = (changes: Partial<typeof tp>) => {
            store.updateObject(store.currentSlideIndex, selectedObj.id, { textProps: { ...tp, ...changes } });
          };

          if (e.key === 'b' || e.key === 'B') {
            e.preventDefault();
            updateTp({ fontWeight: tp.fontWeight >= 600 ? 400 : 700 });
            return;
          }
          if (e.key === 'i' || e.key === 'I') {
            e.preventDefault();
            updateTp({ fontStyle: tp.fontStyle === 'italic' ? 'normal' : 'italic' });
            return;
          }
          if (e.key === 'u' || e.key === 'U') {
            e.preventDefault();
            updateTp({ textDecoration: tp.textDecoration === 'underline' ? 'none' : 'underline' });
            return;
          }
          if (e.key === 'e' || e.key === 'E') {
            e.preventDefault();
            updateTp({ textAlign: 'center' });
            return;
          }
          if (e.key === 'l' || e.key === 'L') {
            e.preventDefault();
            updateTp({ textAlign: 'left' });
            return;
          }
          if (e.key === 'r' || e.key === 'R') {
            e.preventDefault();
            updateTp({ textAlign: 'right' });
            return;
          }
        }

        if (e.key === 'z') { e.preventDefault(); store.undo(); }
        if (e.key === 'y') { e.preventDefault(); store.redo(); }
        if (e.key === 's') { e.preventDefault(); store.savePresentation(); }
        if (e.key === 'c' && !isEditing) { e.preventDefault(); store.copyObjects(); }
        if (e.key === 'v' && !isEditing) { e.preventDefault(); store.pasteObjects(); }
        if (e.key === 'x' && !isEditing) { e.preventDefault(); store.cutObjects(); }
        if (e.key === 'd' && !isEditing) {
          e.preventDefault();
          store.duplicateSlide(store.currentSlideIndex);
        }
        return;
      }

      if (isEditing) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (store.selectedObjectIds.length > 0) {
          store.deleteObjects(store.selectedObjectIds);
        }
      }
      if (e.key === 'F5') { e.preventDefault(); store.setPresentationMode(true); }
      if (e.key === 'v' || e.key === 'V') store.setTool('select');
      if (e.key === 't' || e.key === 'T') store.setTool('text');

      // Arrow keys for slide navigation
      if (e.key === 'ArrowLeft' && store.selectedObjectIds.length === 0) {
        if (store.currentSlideIndex > 0) store.setCurrentSlide(store.currentSlideIndex - 1);
      }
      if (e.key === 'ArrowRight' && store.selectedObjectIds.length === 0) {
        if (store.currentSlideIndex < store.presentation.slides.length - 1) {
          store.setCurrentSlide(store.currentSlideIndex + 1);
        }
      }

      // Arrow keys for moving objects
      if (store.selectedObjectIds.length > 0) {
        const step = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowLeft') { e.preventDefault(); store.selectedObjectIds.forEach(id => store.moveObject(id, -step, 0)); }
        if (e.key === 'ArrowRight') { e.preventDefault(); store.selectedObjectIds.forEach(id => store.moveObject(id, step, 0)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); store.selectedObjectIds.forEach(id => store.moveObject(id, 0, -step)); }
        if (e.key === 'ArrowDown') { e.preventDefault(); store.selectedObjectIds.forEach(id => store.moveObject(id, 0, step)); }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [store]);
};
