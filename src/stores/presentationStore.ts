import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Presentation, Slide, SlideObject, SlideBackground, TextProperties, ShapeProperties, ShapeType, ImageProperties } from '@/types/presentation';

interface HistoryState {
  past: Presentation[];
  future: Presentation[];
}

interface SavedPresentationMeta {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  slideCount: number;
}

interface PresentationStore {
  presentation: Presentation;
  currentSlideIndex: number;
  selectedObjectIds: string[];
  clipboard: SlideObject[];
  history: HistoryState;
  zoom: number;
  showGrid: boolean;
  isPresentationMode: boolean;
  isPresenterView: boolean;
  tool: 'select' | 'text' | 'shape' | 'image' | 'line';
  activeShapeType: ShapeType;
  savedPresentations: SavedPresentationMeta[];
  autoSaveIndicator: boolean;
  slideClipboard: Slide | null;

  // Actions
  setPresentation: (p: Presentation) => void;
  setCurrentSlide: (index: number) => void;
  setSelectedObjects: (ids: string[]) => void;
  setZoom: (z: number) => void;
  setShowGrid: (v: boolean) => void;
  setTool: (t: PresentationStore['tool']) => void;
  setActiveShapeType: (s: ShapeType) => void;
  setPresentationMode: (v: boolean) => void;
  setPresenterView: (v: boolean) => void;

  // Slide actions
  addSlide: (afterIndex?: number) => void;
  deleteSlide: (index: number) => void;
  duplicateSlide: (index: number) => void;
  reorderSlides: (fromIndex: number, toIndex: number) => void;
  updateSlideBackground: (index: number, bg: SlideBackground) => void;
  updateSlideNotes: (index: number, notes: string) => void;
  copySlide: (index: number) => void;
  pasteSlide: (afterIndex: number) => void;

  // Object actions
  addObject: (obj: SlideObject) => void;
  updateObject: (slideIndex: number, objectId: string, updates: Partial<SlideObject>) => void;
  deleteObjects: (ids: string[]) => void;
  moveObject: (objectId: string, dx: number, dy: number) => void;
  resizeObject: (objectId: string, size: { width: number; height: number }, position?: { x: number; y: number }) => void;

  // Object helpers
  addTextBox: (x: number, y: number) => void;
  addShape: (shapeType: ShapeType, x: number, y: number) => void;
  addImage: (src: string, x: number, y: number, width: number, height: number) => void;

  // History
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  // Clipboard
  copyObjects: () => void;
  pasteObjects: () => void;
  cutObjects: () => void;

  // Persistence
  savePresentation: () => void;
  loadPresentation: (id: string) => void;
  loadSavedList: () => void;
  newPresentation: (name?: string) => void;
  renamePres: (name: string) => void;
  deletePresentation: (id: string) => void;
  saveAs: (newName: string) => void;
  listPresentations: () => SavedPresentationMeta[];

  // Current slide helper
  getCurrentSlide: () => Slide | undefined;
}

function createDefaultSlide(order: number): Slide {
  return {
    id: uuidv4(),
    order,
    background: { type: 'color', value: '#ffffff' },
    objects: [],
    transition: { type: 'none', duration: 0.5 },
    notes: '',
  };
}

function createDefaultPresentation(name = 'Untitled Presentation'): Presentation {
  const titleSlide = createDefaultSlide(0);
  titleSlide.objects = [
    {
      id: uuidv4(),
      type: 'text',
      position: { x: 130, y: 160 },
      size: { width: 700, height: 80 },
      rotation: 0,
      zIndex: 1,
      locked: false,
      animation: 'none',
      textProps: {
        content: 'Presentation Title',
        fontFamily: 'Inter',
        fontSize: 48,
        fontWeight: 700,
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#1f2937',
        textAlign: 'center',
        lineHeight: 1.2,
        backgroundColor: 'transparent',
      },
    },
    {
      id: uuidv4(),
      type: 'text',
      position: { x: 230, y: 270 },
      size: { width: 500, height: 40 },
      rotation: 0,
      zIndex: 2,
      locked: false,
      animation: 'none',
      textProps: {
        content: 'Click to add subtitle',
        fontFamily: 'Inter',
        fontSize: 20,
        fontWeight: 400,
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 1.4,
        backgroundColor: 'transparent',
      },
    },
  ];
  return {
    id: uuidv4(),
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    theme: 'light-pro',
    slideWidth: 960,
    slideHeight: 540,
    slides: [titleSlide],
  };
}

const STORAGE_KEY = 'lade-slides-presentations';
const CURRENT_KEY = 'lade-slides-current';

export const usePresentationStore = create<PresentationStore>((set, get) => ({
  presentation: createDefaultPresentation(),
  currentSlideIndex: 0,
  selectedObjectIds: [],
  clipboard: [],
  history: { past: [], future: [] },
  zoom: 100,
  showGrid: false,
  isPresentationMode: false,
  isPresenterView: false,
  tool: 'select',
  activeShapeType: 'rectangle',
  savedPresentations: [],
  autoSaveIndicator: false,
  slideClipboard: null,

  setPresentation: (p) => set({ presentation: p }),
  setCurrentSlide: (index) => set({ currentSlideIndex: index, selectedObjectIds: [] }),
  setSelectedObjects: (ids) => set({ selectedObjectIds: ids }),
  setZoom: (z) => set({ zoom: z }),
  setShowGrid: (v) => set({ showGrid: v }),
  setTool: (t) => set({ tool: t }),
  setActiveShapeType: (s) => set({ activeShapeType: s }),
  setPresentationMode: (v) => set({ isPresentationMode: v, selectedObjectIds: [] }),
  setPresenterView: (v) => set({ isPresenterView: v }),

  getCurrentSlide: () => {
    const { presentation, currentSlideIndex } = get();
    return presentation.slides[currentSlideIndex];
  },

  pushHistory: () => {
    const { presentation, history } = get();
    const past = [...history.past, JSON.parse(JSON.stringify(presentation))].slice(-20);
    set({ history: { past, future: [] } });
  },

  undo: () => {
    const { history, presentation } = get();
    if (history.past.length === 0) return;
    const prev = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);
    set({
      history: { past: newPast, future: [JSON.parse(JSON.stringify(presentation)), ...history.future].slice(0, 20) },
      presentation: prev,
    });
  },

  redo: () => {
    const { history, presentation } = get();
    if (history.future.length === 0) return;
    const next = history.future[0];
    const newFuture = history.future.slice(1);
    set({
      history: { past: [...history.past, JSON.parse(JSON.stringify(presentation))], future: newFuture },
      presentation: next,
    });
  },

  addSlide: (afterIndex) => {
    const { presentation, pushHistory } = get();
    pushHistory();
    const idx = afterIndex !== undefined ? afterIndex + 1 : presentation.slides.length;
    const newSlide = createDefaultSlide(idx);
    const slides = [...presentation.slides];
    slides.splice(idx, 0, newSlide);
    slides.forEach((s, i) => (s.order = i));
    set({
      presentation: { ...presentation, slides, updatedAt: Date.now() },
      currentSlideIndex: idx,
    });
  },

  deleteSlide: (index) => {
    const { presentation, currentSlideIndex, pushHistory } = get();
    if (presentation.slides.length <= 1) return;
    pushHistory();
    const slides = presentation.slides.filter((_, i) => i !== index);
    slides.forEach((s, i) => (s.order = i));
    const newIdx = Math.min(currentSlideIndex, slides.length - 1);
    set({
      presentation: { ...presentation, slides, updatedAt: Date.now() },
      currentSlideIndex: newIdx,
      selectedObjectIds: [],
    });
  },

  duplicateSlide: (index) => {
    const { presentation, pushHistory } = get();
    pushHistory();
    const original = presentation.slides[index];
    const dup: Slide = JSON.parse(JSON.stringify(original));
    dup.id = uuidv4();
    dup.objects.forEach((o) => (o.id = uuidv4()));
    const slides = [...presentation.slides];
    slides.splice(index + 1, 0, dup);
    slides.forEach((s, i) => (s.order = i));
    set({
      presentation: { ...presentation, slides, updatedAt: Date.now() },
      currentSlideIndex: index + 1,
    });
  },

  reorderSlides: (fromIndex, toIndex) => {
    const { presentation, pushHistory } = get();
    pushHistory();
    const slides = [...presentation.slides];
    const [moved] = slides.splice(fromIndex, 1);
    slides.splice(toIndex, 0, moved);
    slides.forEach((s, i) => (s.order = i));
    set({
      presentation: { ...presentation, slides, updatedAt: Date.now() },
      currentSlideIndex: toIndex,
    });
  },

  updateSlideBackground: (index, bg) => {
    const { presentation, pushHistory } = get();
    pushHistory();
    const slides = [...presentation.slides];
    slides[index] = { ...slides[index], background: bg };
    set({ presentation: { ...presentation, slides, updatedAt: Date.now() } });
  },

  updateSlideNotes: (index, notes) => {
    const { presentation } = get();
    const slides = [...presentation.slides];
    slides[index] = { ...slides[index], notes };
    set({ presentation: { ...presentation, slides, updatedAt: Date.now() } });
  },

  copySlide: (index) => {
    const { presentation } = get();
    const slide = presentation.slides[index];
    if (slide) set({ slideClipboard: JSON.parse(JSON.stringify(slide)) });
  },

  pasteSlide: (afterIndex) => {
    const { slideClipboard, presentation, pushHistory } = get();
    if (!slideClipboard) return;
    pushHistory();
    const dup: Slide = JSON.parse(JSON.stringify(slideClipboard));
    dup.id = uuidv4();
    dup.objects.forEach((o) => (o.id = uuidv4()));
    const slides = [...presentation.slides];
    slides.splice(afterIndex + 1, 0, dup);
    slides.forEach((s, i) => (s.order = i));
    set({
      presentation: { ...presentation, slides, updatedAt: Date.now() },
      currentSlideIndex: afterIndex + 1,
    });
  },

    const { presentation, currentSlideIndex, pushHistory } = get();
    pushHistory();
    const slides = [...presentation.slides];
    const slide = { ...slides[currentSlideIndex] };
    slide.objects = [...slide.objects, obj];
    slides[currentSlideIndex] = slide;
    set({
      presentation: { ...presentation, slides, updatedAt: Date.now() },
      selectedObjectIds: [obj.id],
      tool: 'select',
    });
  },

  updateObject: (slideIndex, objectId, updates) => {
    const { presentation } = get();
    const slides = [...presentation.slides];
    const slide = { ...slides[slideIndex] };
    slide.objects = slide.objects.map((o) => (o.id === objectId ? { ...o, ...updates } : o));
    slides[slideIndex] = slide;
    set({ presentation: { ...presentation, slides, updatedAt: Date.now() } });
  },

  deleteObjects: (ids) => {
    const { presentation, currentSlideIndex, pushHistory } = get();
    pushHistory();
    const slides = [...presentation.slides];
    const slide = { ...slides[currentSlideIndex] };
    slide.objects = slide.objects.filter((o) => !ids.includes(o.id));
    slides[currentSlideIndex] = slide;
    set({
      presentation: { ...presentation, slides, updatedAt: Date.now() },
      selectedObjectIds: [],
    });
  },

  moveObject: (objectId, dx, dy) => {
    const { presentation, currentSlideIndex } = get();
    const slides = [...presentation.slides];
    const slide = { ...slides[currentSlideIndex] };
    slide.objects = slide.objects.map((o) =>
      o.id === objectId ? { ...o, position: { x: o.position.x + dx, y: o.position.y + dy } } : o
    );
    slides[currentSlideIndex] = slide;
    set({ presentation: { ...presentation, slides, updatedAt: Date.now() } });
  },

  resizeObject: (objectId, size, position) => {
    const { presentation, currentSlideIndex } = get();
    const slides = [...presentation.slides];
    const slide = { ...slides[currentSlideIndex] };
    slide.objects = slide.objects.map((o) =>
      o.id === objectId ? { ...o, size, ...(position ? { position } : {}) } : o
    );
    slides[currentSlideIndex] = slide;
    set({ presentation: { ...presentation, slides, updatedAt: Date.now() } });
  },

  addTextBox: (x, y) => {
    const obj: SlideObject = {
      id: uuidv4(),
      type: 'text',
      position: { x, y },
      size: { width: 300, height: 60 },
      rotation: 0,
      zIndex: (get().getCurrentSlide()?.objects.length || 0) + 1,
      locked: false,
      animation: 'none',
      textProps: {
        content: 'Type here...',
        fontFamily: 'Inter',
        fontSize: 24,
        fontWeight: 400,
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#1f2937',
        textAlign: 'left',
        lineHeight: 1.4,
        backgroundColor: 'transparent',
      },
    };
    get().addObject(obj);
  },

  addShape: (shapeType, x, y) => {
    const size = shapeType === 'line' ? { width: 200, height: 4 } : { width: 150, height: 150 };
    const obj: SlideObject = {
      id: uuidv4(),
      type: 'shape',
      position: { x, y },
      size,
      rotation: 0,
      zIndex: (get().getCurrentSlide()?.objects.length || 0) + 1,
      locked: false,
      animation: 'none',
      shapeProps: {
        shapeType,
        fill: '#20B2AA',
        fillOpacity: 100,
        stroke: 'transparent',
        strokeWidth: 0,
        borderRadius: shapeType === 'rectangle' ? 8 : 0,
      },
    };
    get().addObject(obj);
  },

  addImage: (src, x, y, width, height) => {
    const obj: SlideObject = {
      id: uuidv4(),
      type: 'image',
      position: { x, y },
      size: { width, height },
      rotation: 0,
      zIndex: (get().getCurrentSlide()?.objects.length || 0) + 1,
      locked: false,
      animation: 'none',
      imageProps: {
        src,
        objectFit: 'cover',
        filter: 'none',
        opacity: 100,
      },
    };
    get().addObject(obj);
  },

  copyObjects: () => {
    const { selectedObjectIds, getCurrentSlide } = get();
    const slide = getCurrentSlide();
    if (!slide) return;
    const copied = slide.objects.filter((o) => selectedObjectIds.includes(o.id));
    set({ clipboard: JSON.parse(JSON.stringify(copied)) });
  },

  pasteObjects: () => {
    const { clipboard, presentation, currentSlideIndex, pushHistory } = get();
    if (clipboard.length === 0) return;
    pushHistory();
    const slides = [...presentation.slides];
    const slide = { ...slides[currentSlideIndex] };
    const pasted = clipboard.map((o) => ({
      ...JSON.parse(JSON.stringify(o)),
      id: uuidv4(),
      position: { x: o.position.x + 20, y: o.position.y + 20 },
    }));
    slide.objects = [...slide.objects, ...pasted];
    slides[currentSlideIndex] = slide;
    set({
      presentation: { ...presentation, slides, updatedAt: Date.now() },
      selectedObjectIds: pasted.map((o) => o.id),
    });
  },

  cutObjects: () => {
    get().copyObjects();
    get().deleteObjects(get().selectedObjectIds);
  },

  savePresentation: () => {
    const { presentation } = get();
    try {
      const allData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      allData[presentation.id] = presentation;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
      localStorage.setItem(CURRENT_KEY, presentation.id);
      set({ autoSaveIndicator: true });
      setTimeout(() => set({ autoSaveIndicator: false }), 2000);
      get().loadSavedList();
    } catch {
      console.warn('Failed to save to localStorage');
    }
  },

  loadPresentation: (id) => {
    try {
      const allData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (allData[id]) {
        set({
          presentation: allData[id],
          currentSlideIndex: 0,
          selectedObjectIds: [],
          history: { past: [], future: [] },
        });
        localStorage.setItem(CURRENT_KEY, id);
      }
    } catch {
      console.warn('Failed to load presentation');
    }
  },

  loadSavedList: () => {
    try {
      const allData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const list: SavedPresentationMeta[] = Object.values(allData).map((p: any) => ({
        id: p.id,
        name: p.name,
        createdAt: p.createdAt || Date.now(),
        updatedAt: p.updatedAt,
        slideCount: p.slides?.length || 0,
      })).sort((a: any, b: any) => b.updatedAt - a.updatedAt);
      set({ savedPresentations: list });
    } catch {
      set({ savedPresentations: [] });
    }
  },

  listPresentations: () => {
    try {
      const allData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return Object.values(allData).map((p: any) => ({
        id: p.id,
        name: p.name,
        createdAt: p.createdAt || Date.now(),
        updatedAt: p.updatedAt,
        slideCount: p.slides?.length || 0,
      })).sort((a, b) => b.updatedAt - a.updatedAt);
    } catch {
      return [];
    }
  },

  newPresentation: (name) => {
    const pres = createDefaultPresentation(name || 'Untitled Presentation');
    set({
      presentation: pres,
      currentSlideIndex: 0,
      selectedObjectIds: [],
      history: { past: [], future: [] },
    });
  },

  renamePres: (name) => {
    const { presentation } = get();
    set({ presentation: { ...presentation, name, updatedAt: Date.now() } });
  },

  deletePresentation: (id) => {
    try {
      const allData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      delete allData[id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
      get().loadSavedList();
    } catch {
      console.warn('Failed to delete presentation');
    }
  },

  saveAs: (newName) => {
    const { presentation, savePresentation } = get();
    const newPres: Presentation = {
      ...JSON.parse(JSON.stringify(presentation)),
      id: uuidv4(),
      name: newName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set({ presentation: newPres });
    savePresentation();
  },
}));
