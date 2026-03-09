import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { MasterSlide, MasterLayout, MasterPlaceholder, MasterLayoutName, SlideBackground, ThemeColors, SlideObject } from '@/types/presentation';

const MASTER_STORAGE_KEY = 'lade-slides-masters';

function createPlaceholder(
  type: MasterPlaceholder['type'],
  x: number, y: number, w: number, h: number,
  defaultText: string,
  opts: Partial<MasterPlaceholder> = {}
): MasterPlaceholder {
  return {
    id: uuidv4(),
    type,
    x, y, width: w, height: h,
    defaultText,
    fontSize: opts.fontSize ?? 24,
    fontFamily: opts.fontFamily ?? 'Inter',
    color: opts.color ?? '#1f2937',
    align: opts.align ?? 'left',
    fontWeight: opts.fontWeight ?? 400,
  };
}

const whiteBg: SlideBackground = { type: 'color', value: '#ffffff' };

function createBuiltInLayouts(): MasterLayout[] {
  return [
    {
      id: uuidv4(),
      name: 'Title Slide',
      background: whiteBg,
      placeholders: [
        createPlaceholder('title', 130, 160, 700, 80, 'Click to add title', { fontSize: 48, fontWeight: 700, align: 'center' }),
        createPlaceholder('subtitle', 180, 270, 600, 50, 'Click to add subtitle', { fontSize: 22, color: '#6b7280', align: 'center' }),
        createPlaceholder('footer', 30, 500, 400, 25, 'Author • Date', { fontSize: 12, color: '#9ca3af' }),
      ],
    },
    {
      id: uuidv4(),
      name: 'Title and Content',
      background: whiteBg,
      placeholders: [
        createPlaceholder('title', 40, 20, 880, 60, 'Click to add title', { fontSize: 36, fontWeight: 700 }),
        createPlaceholder('content', 40, 100, 880, 380, 'Click to add content', { fontSize: 20 }),
        createPlaceholder('number', 900, 510, 40, 20, '#', { fontSize: 11, color: '#9ca3af', align: 'right' }),
      ],
    },
    {
      id: uuidv4(),
      name: 'Section Header',
      background: whiteBg,
      placeholders: [
        createPlaceholder('title', 80, 180, 800, 80, 'Section Title', { fontSize: 44, fontWeight: 700, align: 'center' }),
        createPlaceholder('subtitle', 180, 280, 600, 40, 'Optional subtitle', { fontSize: 20, color: '#6b7280', align: 'center' }),
      ],
    },
    {
      id: uuidv4(),
      name: 'Two Content',
      background: whiteBg,
      placeholders: [
        createPlaceholder('title', 40, 20, 880, 60, 'Click to add title', { fontSize: 36, fontWeight: 700 }),
        createPlaceholder('content', 40, 100, 420, 380, 'Left content', { fontSize: 18 }),
        createPlaceholder('content', 500, 100, 420, 380, 'Right content', { fontSize: 18 }),
      ],
    },
    {
      id: uuidv4(),
      name: 'Comparison',
      background: whiteBg,
      placeholders: [
        createPlaceholder('title', 40, 20, 880, 50, 'Comparison Title', { fontSize: 32, fontWeight: 700 }),
        createPlaceholder('subtitle', 40, 80, 420, 30, 'Column A Header', { fontSize: 18, fontWeight: 600 }),
        createPlaceholder('content', 40, 120, 420, 360, 'Column A content', { fontSize: 16 }),
        createPlaceholder('subtitle', 500, 80, 420, 30, 'Column B Header', { fontSize: 18, fontWeight: 600 }),
        createPlaceholder('content', 500, 120, 420, 360, 'Column B content', { fontSize: 16 }),
      ],
    },
    {
      id: uuidv4(),
      name: 'Blank',
      background: whiteBg,
      placeholders: [],
    },
    {
      id: uuidv4(),
      name: 'Title Only',
      background: whiteBg,
      placeholders: [
        createPlaceholder('title', 40, 20, 880, 60, 'Click to add title', { fontSize: 36, fontWeight: 700 }),
      ],
    },
    {
      id: uuidv4(),
      name: 'Content with Caption',
      background: whiteBg,
      placeholders: [
        createPlaceholder('title', 40, 20, 880, 50, 'Title', { fontSize: 32, fontWeight: 700 }),
        createPlaceholder('content', 40, 90, 550, 400, 'Main content area', { fontSize: 20 }),
        createPlaceholder('caption', 620, 90, 300, 400, 'Caption text', { fontSize: 16, color: '#6b7280' }),
      ],
    },
    {
      id: uuidv4(),
      name: 'Picture with Caption',
      background: whiteBg,
      placeholders: [
        createPlaceholder('image', 40, 30, 880, 360, 'Click to add image', { fontSize: 16, color: '#9ca3af', align: 'center' }),
        createPlaceholder('caption', 40, 410, 880, 80, 'Add caption here', { fontSize: 16, color: '#6b7280', align: 'center' }),
      ],
    },
  ];
}

function createDefaultMaster(): MasterSlide {
  return {
    id: uuidv4(),
    name: 'Default Master',
    layouts: createBuiltInLayouts(),
    theme: { primary: '#0d9488', secondary: '#f0fdfa', background: '#ffffff', text: '#1f2937', accent: '#14b8a6' },
    fontFamily: 'Inter',
  };
}

interface MasterSlideStore {
  masters: MasterSlide[];
  activeMasterId: string;
  isMasterEditMode: boolean;
  editingLayoutIndex: number;

  // Actions
  setMasterEditMode: (v: boolean) => void;
  setEditingLayoutIndex: (i: number) => void;
  loadMasters: () => void;
  saveMasters: () => void;
  createMasterSlide: (name?: string) => void;
  deleteMaster: (id: string) => void;
  setActiveMaster: (id: string) => void;
  getActiveMaster: () => MasterSlide;
  updateMasterLayout: (masterId: string, layoutId: string, changes: Partial<MasterLayout>) => void;
  addPlaceholder: (masterId: string, layoutId: string, placeholder: MasterPlaceholder) => void;
  removePlaceholder: (masterId: string, layoutId: string, placeholderId: string) => void;
  updatePlaceholder: (masterId: string, layoutId: string, placeholderId: string, changes: Partial<MasterPlaceholder>) => void;
  applyLayoutToSlide: (layout: MasterLayout, fontFamily: string) => SlideObject[];
  exportMaster: (masterId: string) => string;
  importMaster: (json: string) => void;
  renameMaster: (masterId: string, name: string) => void;
}

export const useMasterSlideStore = create<MasterSlideStore>((set, get) => {
  const defaultMaster = createDefaultMaster();

  return {
    masters: [defaultMaster],
    activeMasterId: defaultMaster.id,
    isMasterEditMode: false,
    editingLayoutIndex: 0,

    setMasterEditMode: (v) => set({ isMasterEditMode: v }),
    setEditingLayoutIndex: (i) => set({ editingLayoutIndex: i }),

    loadMasters: () => {
      try {
        const data = localStorage.getItem(MASTER_STORAGE_KEY);
        if (data) {
          const parsed = JSON.parse(data) as MasterSlide[];
          if (parsed.length > 0) {
            set({ masters: parsed, activeMasterId: parsed[0].id });
            return;
          }
        }
      } catch {}
      const dm = createDefaultMaster();
      set({ masters: [dm], activeMasterId: dm.id });
    },

    saveMasters: () => {
      try {
        localStorage.setItem(MASTER_STORAGE_KEY, JSON.stringify(get().masters));
      } catch {}
    },

    createMasterSlide: (name) => {
      const master: MasterSlide = {
        id: uuidv4(),
        name: name || 'Custom Master',
        layouts: createBuiltInLayouts(),
        theme: { primary: '#3b82f6', secondary: '#eff6ff', background: '#ffffff', text: '#1f2937', accent: '#60a5fa' },
        fontFamily: 'Inter',
      };
      const masters = [...get().masters, master];
      set({ masters, activeMasterId: master.id });
      get().saveMasters();
    },

    deleteMaster: (id) => {
      const masters = get().masters.filter(m => m.id !== id);
      if (masters.length === 0) {
        const dm = createDefaultMaster();
        masters.push(dm);
      }
      set({ masters, activeMasterId: masters[0].id });
      get().saveMasters();
    },

    setActiveMaster: (id) => set({ activeMasterId: id }),

    getActiveMaster: () => {
      const { masters, activeMasterId } = get();
      return masters.find(m => m.id === activeMasterId) || masters[0];
    },

    updateMasterLayout: (masterId, layoutId, changes) => {
      const masters = get().masters.map(m => {
        if (m.id !== masterId) return m;
        return {
          ...m,
          layouts: m.layouts.map(l => l.id === layoutId ? { ...l, ...changes } : l),
        };
      });
      set({ masters });
      get().saveMasters();
    },

    addPlaceholder: (masterId, layoutId, placeholder) => {
      const masters = get().masters.map(m => {
        if (m.id !== masterId) return m;
        return {
          ...m,
          layouts: m.layouts.map(l => {
            if (l.id !== layoutId) return l;
            return { ...l, placeholders: [...l.placeholders, placeholder] };
          }),
        };
      });
      set({ masters });
      get().saveMasters();
    },

    removePlaceholder: (masterId, layoutId, placeholderId) => {
      const masters = get().masters.map(m => {
        if (m.id !== masterId) return m;
        return {
          ...m,
          layouts: m.layouts.map(l => {
            if (l.id !== layoutId) return l;
            return { ...l, placeholders: l.placeholders.filter(p => p.id !== placeholderId) };
          }),
        };
      });
      set({ masters });
      get().saveMasters();
    },

    updatePlaceholder: (masterId, layoutId, placeholderId, changes) => {
      const masters = get().masters.map(m => {
        if (m.id !== masterId) return m;
        return {
          ...m,
          layouts: m.layouts.map(l => {
            if (l.id !== layoutId) return l;
            return {
              ...l,
              placeholders: l.placeholders.map(p => p.id === placeholderId ? { ...p, ...changes } : p),
            };
          }),
        };
      });
      set({ masters });
      get().saveMasters();
    },

    applyLayoutToSlide: (layout, fontFamily) => {
      return layout.placeholders.map((p, i) => {
        const obj: SlideObject = {
          id: uuidv4(),
          type: p.type === 'image' ? 'image' : 'text',
          position: { x: p.x, y: p.y },
          size: { width: p.width, height: p.height },
          rotation: 0,
          zIndex: i + 1,
          locked: false,
          animation: 'none',
        };
        if (p.type === 'image') {
          obj.imageProps = {
            src: '',
            originalSrc: '',
            objectFit: 'cover',
            opacity: 100,
            filters: { grayscale: 0, sepia: 0, blur: 0, brightness: 100, contrast: 100, saturation: 100 },
            border: { enabled: false, color: '#000000', width: 2 },
            shadow: { enabled: false, color: 'rgba(0,0,0,0.3)', blur: 8, offsetX: 4, offsetY: 4 },
            cornerRadius: 0,
            flipH: false,
            flipV: false,
          };
          // Also add text overlay for placeholder text
          obj.type = 'text';
          obj.imageProps = undefined;
          obj.textProps = {
            content: p.defaultText,
            fontFamily: fontFamily || p.fontFamily,
            fontSize: p.fontSize,
            fontWeight: p.fontWeight,
            fontStyle: 'normal',
            textDecoration: 'none',
            color: p.color,
            textAlign: p.align,
            lineHeight: 1.4,
            backgroundColor: '#f3f4f6',
          };
        } else {
          obj.textProps = {
            content: p.defaultText,
            fontFamily: fontFamily || p.fontFamily,
            fontSize: p.fontSize,
            fontWeight: p.fontWeight,
            fontStyle: 'normal',
            textDecoration: 'none',
            color: p.color,
            textAlign: p.align,
            lineHeight: 1.4,
            backgroundColor: 'transparent',
          };
        }
        return obj;
      });
    },

    exportMaster: (masterId) => {
      const master = get().masters.find(m => m.id === masterId);
      return JSON.stringify(master, null, 2);
    },

    importMaster: (json) => {
      try {
        const master = JSON.parse(json) as MasterSlide;
        master.id = uuidv4();
        master.layouts.forEach(l => { l.id = uuidv4(); l.placeholders.forEach(p => { p.id = uuidv4(); }); });
        const masters = [...get().masters, master];
        set({ masters, activeMasterId: master.id });
        get().saveMasters();
      } catch (e) {
        console.error('Failed to import master:', e);
      }
    },

    renameMaster: (masterId, name) => {
      const masters = get().masters.map(m => m.id === masterId ? { ...m, name } : m);
      set({ masters });
      get().saveMasters();
    },
  };
});
