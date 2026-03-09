import React, { useState, useRef } from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import { FONTS, THEMES, SHAPE_CATEGORIES } from '@/types/presentation';
import type { ShapeType } from '@/types/presentation';
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Type, Square, Circle, Triangle, Star,
  Image, Trash2, Copy, Clipboard, Scissors,
  ArrowUpToLine, ArrowDownToLine,
  Plus, Play, ChevronDown, MousePointer,
  Save, FileDown, FilePlus, FileText, FileType, Camera, Settings,
  Upload, Link, Clock, Palette,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OpenPresentationDialog } from './OpenPresentationDialog';
import { PresentationSettingsDialog } from './PresentationSettingsDialog';
import { SaveAsDialog } from './SaveAsDialog';

type RibbonTab = 'Home' | 'Insert' | 'Design' | 'Transitions' | 'Slide Show';

const QUICK_SHAPES: { type: ShapeType; icon: React.ReactNode; label: string }[] = [
  { type: 'rectangle', icon: <Square className="w-4 h-4" />, label: 'Rectangle' },
  { type: 'circle', icon: <Circle className="w-4 h-4" />, label: 'Ellipse' },
  { type: 'triangle', icon: <Triangle className="w-4 h-4" />, label: 'Triangle' },
  { type: 'star', icon: <Star className="w-4 h-4" />, label: 'Star' },
];

/** Tiny SVG icon for shape picker grid */
const ShapeMiniIcon: React.FC<{ type: string }> = ({ type }) => {
  const s = { width: 16, height: 16 };
  const f = '#555';
  switch (type) {
    case 'rectangle': case 'process': return <svg {...s}><rect x="1" y="3" width="14" height="10" fill={f} rx="1" /></svg>;
    case 'rounded-rectangle': case 'start-end': return <svg {...s}><rect x="1" y="3" width="14" height="10" fill={f} rx="4" /></svg>;
    case 'circle': return <svg {...s}><ellipse cx="8" cy="8" rx="7" ry="6" fill={f} /></svg>;
    case 'triangle': return <svg {...s}><polygon points="8,1 15,15 1,15" fill={f} /></svg>;
    case 'diamond': case 'decision': return <svg {...s}><polygon points="8,1 15,8 8,15 1,8" fill={f} /></svg>;
    case 'pentagon': return <svg {...s}><polygon points="8,1 15,6 13,15 3,15 1,6" fill={f} /></svg>;
    case 'hexagon': return <svg {...s}><polygon points="4,1 12,1 15,8 12,15 4,15 1,8" fill={f} /></svg>;
    case 'octagon': return <svg {...s}><polygon points="5,1 11,1 15,5 15,11 11,15 5,15 1,11 1,5" fill={f} /></svg>;
    case 'star': return <svg {...s}><polygon points="8,1 10,6 15,6 11,9 13,15 8,11 3,15 5,9 1,6 6,6" fill={f} /></svg>;
    case 'heart': return <svg {...s}><path d="M8,14 C4,10 1,7 1,4.5A3,3,0,0,1,8,3.5 A3,3,0,0,1,15,4.5C15,7 12,10 8,14Z" fill={f} /></svg>;
    case 'cloud': return <svg {...s}><path d="M4,12A3,3,0,0,1,3,6 A4,4,0,0,1,7,3 A5,5,0,0,1,13,6 A3,3,0,0,1,12,12Z" fill={f} /></svg>;
    case 'arrow': return <svg {...s}><polygon points="1,5 10,5 10,1 15,8 10,15 10,11 1,11" fill={f} /></svg>;
    case 'arrow-left': return <svg {...s}><polygon points="15,5 6,5 6,1 1,8 6,15 6,11 15,11" fill={f} /></svg>;
    case 'arrow-up': return <svg {...s}><polygon points="5,15 5,6 1,6 8,1 15,6 11,6 11,15" fill={f} /></svg>;
    case 'arrow-down': return <svg {...s}><polygon points="5,1 5,10 1,10 8,15 15,10 11,10 11,1" fill={f} /></svg>;
    case 'double-arrow': return <svg {...s}><polygon points="1,8 4,3 4,6 12,6 12,3 15,8 12,13 12,10 4,10 4,13" fill={f} /></svg>;
    case 'line': case 'connector': return <svg {...s}><line x1="1" y1="8" x2="15" y2="8" stroke={f} strokeWidth="2" /></svg>;
    default: return <svg {...s}><rect x="2" y="2" width="12" height="12" fill={f} rx="2" /></svg>;
  }
};

const TRANSITION_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'fade', label: 'Fade' },
  { value: 'slide-left', label: 'Push' },
  { value: 'slide-right', label: 'Wipe' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'flip', label: 'Flip' },
];

const RECENT_IMAGES_KEY = 'lade-recent-images';
const MAX_RECENT = 10;

function getRecentImages(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_IMAGES_KEY) || '[]'); } catch { return []; }
}
function addRecentImage(src: string) {
  const list = getRecentImages().filter(s => s !== src);
  list.unshift(src);
  try { localStorage.setItem(RECENT_IMAGES_KEY, JSON.stringify(list.slice(0, MAX_RECENT))); } catch {}
}

export const PPTRibbon: React.FC<{ onToggleThemes?: () => void }> = ({ onToggleThemes }) => {
  const [activeTab, setActiveTab] = useState<RibbonTab>('Home');
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState('');
  

  const store = usePresentationStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs: RibbonTab[] = ['Home', 'Insert', 'Design', 'Transitions', 'Slide Show'];

  const insertImageToCanvas = (src: string) => {
    const img = new window.Image();
    img.onload = () => {
      const maxW = 400, maxH = 400;
      let w = img.width, h = img.height;
      if (w > maxW) { h = h * (maxW / w); w = maxW; }
      if (h > maxH) { w = w * (maxH / h); h = maxH; }
      const cx = (960 - w) / 2;
      const cy = (540 - h) / 2;
      usePresentationStore.getState().addImage(src, cx, cy, w, h);
      addRecentImage(src);
    };
    img.src = src;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('Image must be under 10MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      insertImageToCanvas(src);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleInsertFromUrl = async () => {
    if (!imageUrl.trim()) return;
    setUrlLoading(true);
    setUrlError('');
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error('Failed to fetch');
      const blob = await res.blob();
      if (!blob.type.startsWith('image/')) throw new Error('Not an image');
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        insertImageToCanvas(src);
        setShowUrlDialog(false);
        setImageUrl('');
      };
      reader.readAsDataURL(blob);
    } catch {
      // Fallback: just use URL directly
      insertImageToCanvas(imageUrl.trim());
      setShowUrlDialog(false);
      setImageUrl('');
    } finally {
      setUrlLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const { toPng } = await import('html-to-image');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [960, 540] });
      const st = usePresentationStore.getState();
      const origIdx = st.currentSlideIndex;
      for (let i = 0; i < st.presentation.slides.length; i++) {
        st.setCurrentSlide(i);
        await new Promise(r => setTimeout(r, 200));
        const el = document.querySelector('[data-slide-export]') as HTMLElement;
        if (!el) continue;
        const dataUrl = await toPng(el, { width: 960, height: 540, pixelRatio: 2 });
        if (i > 0) pdf.addPage([960, 540], 'landscape');
        pdf.addImage(dataUrl, 'PNG', 0, 0, 960, 540);
      }
      st.setCurrentSlide(origIdx);
      pdf.save(`${st.presentation.name}.pdf`);
    } catch (err) {
      alert('PDF export failed.');
    }
  };

  const handleExportPPTX = async () => {
    try {
      const PptxGenJS = (await import('pptxgenjs')).default;
      const pptx = new PptxGenJS();
      const p = store.presentation;
      pptx.title = p.name;
      pptx.layout = 'LAYOUT_16x9';
      for (const slide of p.slides) {
        const pSlide = pptx.addSlide();
        if (slide.background.type === 'color') {
          pSlide.background = { color: slide.background.value.replace('#', '') };
        }
        for (const obj of slide.objects) {
          if (obj.type === 'text' && obj.textProps) {
            pSlide.addText(obj.textProps.content, {
              x: obj.position.x / 960 * 10, y: obj.position.y / 540 * 7.5,
              w: obj.size.width / 960 * 10, h: obj.size.height / 540 * 7.5,
              fontSize: Math.round(obj.textProps.fontSize * 0.75),
              fontFace: obj.textProps.fontFamily,
              color: obj.textProps.color.replace('#', ''),
              bold: obj.textProps.fontWeight >= 600,
              italic: obj.textProps.fontStyle === 'italic',
              align: obj.textProps.textAlign === 'justify' ? 'left' : obj.textProps.textAlign,
            });
          }
          if (obj.type === 'shape' && obj.shapeProps) {
            pSlide.addShape('rect' as any, {
              x: obj.position.x / 960 * 10, y: obj.position.y / 540 * 7.5,
              w: obj.size.width / 960 * 10, h: obj.size.height / 540 * 7.5,
              fill: { color: obj.shapeProps.fill.replace('#', '') },
            });
          }
          if (obj.type === 'image' && obj.imageProps) {
            pSlide.addImage({
              data: obj.imageProps.src,
              x: obj.position.x / 960 * 10, y: obj.position.y / 540 * 7.5,
              w: obj.size.width / 960 * 10, h: obj.size.height / 540 * 7.5,
            });
          }
        }
      }
      await pptx.writeFile({ fileName: `${p.name}.pptx` });
    } catch { alert('PPTX export failed.'); }
  };

  const handleExportAllPNG = async () => {
    try {
      const { toPng } = await import('html-to-image');
      const st = usePresentationStore.getState();
      const origIdx = st.currentSlideIndex;
      for (let i = 0; i < st.presentation.slides.length; i++) {
        st.setCurrentSlide(i);
        await new Promise(r => setTimeout(r, 200));
        const el = document.querySelector('[data-slide-export]') as HTMLElement;
        if (!el) continue;
        const dataUrl = await toPng(el, { width: 960, height: 540, pixelRatio: 2 });
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `slide-${i + 1}.png`;
        a.click();
      }
      st.setCurrentSlide(origIdx);
    } catch { alert('PNG export failed.'); }
  };

  const selectedObj = store.getCurrentSlide()?.objects.find(o => store.selectedObjectIds.includes(o.id));
  const tp = selectedObj?.textProps;
  const updateTp = (changes: any) => {
    if (!selectedObj || !tp) return;
    store.updateObject(store.currentSlideIndex, selectedObj.id, { textProps: { ...tp, ...changes } });
  };

  const applyTheme = (themeId: string) => {
    const theme = THEMES.find(t => t.id === themeId);
    if (!theme) return;
    const slides = store.presentation.slides.map(s => ({
      ...s,
      background: { type: 'color' as const, value: theme.colors.background },
      objects: s.objects.map(o => {
        if (o.type === 'text' && o.textProps) return { ...o, textProps: { ...o.textProps, color: theme.colors.text, fontFamily: theme.fontFamily } };
        if (o.type === 'shape' && o.shapeProps) return { ...o, shapeProps: { ...o.shapeProps, fill: theme.colors.primary } };
        return o;
      }),
    }));
    store.setPresentation({ ...store.presentation, theme: themeId, slides, updatedAt: Date.now() });
    setShowThemePicker(false);
  };

  return (
    <>
      <div className="ppt-ribbon">
        {/* Ribbon Tabs */}
        <div className="ppt-ribbon-tabs">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ppt-ribbon-tab ppt-file-tab">File</button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => store.newPresentation()}>
                <FilePlus className="w-4 h-4 mr-2" /> New Presentation
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { store.loadSavedList(); setShowOpenDialog(true); }}>
                <FileDown className="w-4 h-4 mr-2" /> Open...
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => store.savePresentation()}>
                <Save className="w-4 h-4 mr-2" /> Save
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowSaveAsDialog(true)}>
                <Save className="w-4 h-4 mr-2" /> Save As...
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="w-4 h-4 mr-2" /> Download as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPPTX}>
                <FileType className="w-4 h-4 mr-2" /> Download as PPTX
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportAllPNG}>
                <Camera className="w-4 h-4 mr-2" /> Download as PNG
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowSettingsDialog(true)}>
                <Settings className="w-4 h-4 mr-2" /> Presentation Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => store.newPresentation()}>
                <FileText className="w-4 h-4 mr-2" /> Close Presentation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {tabs.map(tab => (
            <button
              key={tab}
              className={`ppt-ribbon-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Ribbon Content */}
        <div className="ppt-ribbon-content">
          {activeTab === 'Home' && (
            <>
              {/* Clipboard Group */}
              <div className="ppt-ribbon-group" style={{ minWidth: 90 }}>
                <div className="ppt-ribbon-group-content">
                  <div className="flex flex-col gap-0.5">
                    <button className="ppt-ribbon-btn ppt-ribbon-btn-large" onClick={() => store.pasteObjects()} title="Paste">
                      <Clipboard className="w-6 h-6 text-[hsl(var(--accent))]" />
                      <span>Paste</span>
                    </button>
                  </div>
                  <div className="flex flex-col gap-0.5 pt-1">
                    <button className="ppt-ribbon-btn ppt-ribbon-btn-small" onClick={() => store.cutObjects()} title="Cut">
                      <Scissors className="w-3.5 h-3.5" /><span>Cut</span>
                    </button>
                    <button className="ppt-ribbon-btn ppt-ribbon-btn-small" onClick={() => store.copyObjects()} title="Copy">
                      <Copy className="w-3.5 h-3.5" /><span>Copy</span>
                    </button>
                  </div>
                </div>
                <span className="ppt-ribbon-group-label">Clipboard</span>
              </div>

              {/* Slides Group */}
              <div className="ppt-ribbon-group" style={{ minWidth: 80 }}>
                <div className="ppt-ribbon-group-content">
                  <button className="ppt-ribbon-btn ppt-ribbon-btn-large" onClick={() => store.addSlide(store.currentSlideIndex)} title="New Slide">
                    <Plus className="w-6 h-6 text-[hsl(var(--accent))]" />
                    <span>New Slide</span>
                  </button>
                </div>
                <span className="ppt-ribbon-group-label">Slides</span>
              </div>

              {/* Font Group */}
              <div className="ppt-ribbon-group" style={{ minWidth: 200 }}>
                <div className="ppt-ribbon-group-content flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <select
                      className="ppt-select"
                      style={{ width: 120 }}
                      value={tp?.fontFamily || 'Inter'}
                      onChange={(e) => updateTp({ fontFamily: e.target.value })}
                    >
                      {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                    </select>
                    <select
                      className="ppt-select"
                      style={{ width: 48 }}
                      value={tp?.fontSize || 24}
                      onChange={(e) => updateTp({ fontSize: Number(e.target.value) })}
                    >
                      {[8,10,12,14,16,18,20,24,28,32,36,44,48,56,64,72,96].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-0">
                    <button
                      className={`ppt-ribbon-btn ppt-ribbon-btn-icon ${tp?.fontWeight && tp.fontWeight >= 600 ? 'active' : ''}`}
                      onClick={() => updateTp({ fontWeight: (tp?.fontWeight || 400) >= 600 ? 400 : 700 })}
                      title="Bold (Ctrl+B)"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className={`ppt-ribbon-btn ppt-ribbon-btn-icon ${tp?.fontStyle === 'italic' ? 'active' : ''}`}
                      onClick={() => updateTp({ fontStyle: tp?.fontStyle === 'italic' ? 'normal' : 'italic' })}
                      title="Italic (Ctrl+I)"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className={`ppt-ribbon-btn ppt-ribbon-btn-icon ${tp?.textDecoration === 'underline' ? 'active' : ''}`}
                      onClick={() => updateTp({ textDecoration: tp?.textDecoration === 'underline' ? 'none' : 'underline' })}
                      title="Underline (Ctrl+U)"
                    >
                      <Underline className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className={`ppt-ribbon-btn ppt-ribbon-btn-icon ${tp?.textDecoration === 'line-through' ? 'active' : ''}`}
                      onClick={() => updateTp({ textDecoration: tp?.textDecoration === 'line-through' ? 'none' : 'line-through' })}
                      title="Strikethrough"
                    >
                      <Strikethrough className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-4 bg-[hsl(var(--border))] mx-1" />
                    <div className="relative" title="Font Color">
                      <input
                        type="color"
                        value={tp?.color || '#1f2937'}
                        onChange={(e) => updateTp({ color: e.target.value })}
                        className="w-5 h-5 border-0 p-0 cursor-pointer rounded-sm"
                      />
                      <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-sm" style={{ backgroundColor: tp?.color || '#1f2937' }} />
                    </div>
                    <div className="relative ml-1" title="Highlight Color">
                      <input
                        type="color"
                        value={tp?.backgroundColor === 'transparent' ? '#ffffff' : (tp?.backgroundColor || '#ffffff')}
                        onChange={(e) => updateTp({ backgroundColor: e.target.value })}
                        className="w-5 h-5 border-0 p-0 cursor-pointer rounded-sm"
                      />
                      <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-sm bg-yellow-300" />
                    </div>
                    <button
                      className="ppt-ribbon-btn ppt-ribbon-btn-icon ml-0.5"
                      onClick={() => updateTp({ backgroundColor: 'transparent' })}
                      title="Clear Highlight"
                      style={{ fontSize: 9, minWidth: 18, width: 18 }}
                    >
                      ∅
                    </button>
                  </div>
                </div>
                <span className="ppt-ribbon-group-label">Font</span>
              </div>

              {/* Paragraph Group */}
              <div className="ppt-ribbon-group" style={{ minWidth: 130 }}>
                <div className="ppt-ribbon-group-content flex-col gap-1">
                  <div className="flex items-center gap-0">
                    <button
                      className={`ppt-ribbon-btn ppt-ribbon-btn-icon ${tp?.textAlign === 'left' ? 'active' : ''}`}
                      onClick={() => updateTp({ textAlign: 'left' })}
                      title="Align Left (Ctrl+L)"
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className={`ppt-ribbon-btn ppt-ribbon-btn-icon ${tp?.textAlign === 'center' ? 'active' : ''}`}
                      onClick={() => updateTp({ textAlign: 'center' })}
                      title="Align Center (Ctrl+E)"
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className={`ppt-ribbon-btn ppt-ribbon-btn-icon ${tp?.textAlign === 'right' ? 'active' : ''}`}
                      onClick={() => updateTp({ textAlign: 'right' })}
                      title="Align Right (Ctrl+R)"
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className={`ppt-ribbon-btn ppt-ribbon-btn-icon ${tp?.textAlign === 'justify' ? 'active' : ''}`}
                      onClick={() => updateTp({ textAlign: 'justify' })}
                      title="Justify"
                    >
                      <AlignJustify className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-4 bg-[hsl(var(--border))] mx-1" />
                    <select
                      className="ppt-select"
                      style={{ width: 42 }}
                      value={tp?.lineHeight || 1.4}
                      onChange={(e) => updateTp({ lineHeight: parseFloat(e.target.value) })}
                      title="Line Spacing"
                    >
                      {[1.0, 1.15, 1.5, 2.0, 2.5, 3.0].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-0">
                    <button className="ppt-ribbon-btn ppt-ribbon-btn-icon" onClick={() => {
                      if (!selectedObj) return;
                      const slide = store.getCurrentSlide();
                      if (!slide) return;
                      const maxZ = Math.max(...slide.objects.map(o => o.zIndex));
                      store.updateObject(store.currentSlideIndex, selectedObj.id, { zIndex: maxZ + 1 });
                    }} title="Bring to Front">
                      <ArrowUpToLine className="w-3.5 h-3.5" />
                    </button>
                    <button className="ppt-ribbon-btn ppt-ribbon-btn-icon" onClick={() => {
                      if (!selectedObj) return;
                      store.updateObject(store.currentSlideIndex, selectedObj.id, { zIndex: 0 });
                    }} title="Send to Back">
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                    </button>
                    <button className="ppt-ribbon-btn ppt-ribbon-btn-icon" onClick={() => {
                      if (store.selectedObjectIds.length > 0) store.deleteObjects(store.selectedObjectIds);
                    }} title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <span className="ppt-ribbon-group-label">Paragraph</span>
              </div>

              {/* Drawing Group */}
              <div className="ppt-ribbon-group" style={{ minWidth: 140 }}>
                <div className="ppt-ribbon-group-content">
                  <button
                    className={`ppt-ribbon-btn ppt-ribbon-btn-icon ${store.tool === 'select' ? 'active' : ''}`}
                    onClick={() => store.setTool('select')}
                    title="Select"
                  >
                    <MousePointer className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className={`ppt-ribbon-btn ppt-ribbon-btn-icon ${store.tool === 'text' ? 'active' : ''}`}
                    onClick={() => store.setTool('text')}
                    title="Text Box"
                  >
                    <Type className="w-3.5 h-3.5" />
                  </button>
                  {QUICK_SHAPES.map(s => (
                    <button
                      key={s.type}
                      className={`ppt-ribbon-btn ppt-ribbon-btn-icon ${store.tool === 'shape' && store.activeShapeType === s.type ? 'active' : ''}`}
                      onClick={() => { store.setTool('shape'); store.setActiveShapeType(s.type); }}
                      title={s.label}
                    >
                      {React.cloneElement(s.icon as React.ReactElement, { className: 'w-3.5 h-3.5' })}
                    </button>
                  ))}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="ppt-ribbon-btn ppt-ribbon-btn-icon" title="More Shapes">
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 p-2">
                      {SHAPE_CATEGORIES.map(cat => (
                        <div key={cat.label} className="mb-2">
                          <p className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] mb-1 px-1">{cat.label}</p>
                          <div className="grid grid-cols-6 gap-0.5">
                            {cat.shapes.map(s => (
                              <button
                                key={s.type}
                                onClick={() => { store.setTool('shape'); store.setActiveShapeType(s.type); }}
                                className={`p-1.5 rounded hover:bg-[hsl(var(--ppt-hover))] transition-colors ${
                                  store.tool === 'shape' && store.activeShapeType === s.type ? 'bg-[hsl(var(--ppt-active))]' : ''
                                }`}
                                title={s.label}
                              >
                                <ShapeMiniIcon type={s.type} />
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <span className="ppt-ribbon-group-label">Drawing</span>
              </div>
            </>
          )}

          {activeTab === 'Insert' && (
            <>
              <div className="ppt-ribbon-group" style={{ minWidth: 80 }}>
                <div className="ppt-ribbon-group-content">
                  <button className="ppt-ribbon-btn ppt-ribbon-btn-large" onClick={() => store.addSlide(store.currentSlideIndex)}>
                    <Plus className="w-6 h-6 text-[hsl(var(--accent))]" />
                    <span>New Slide</span>
                  </button>
                </div>
                <span className="ppt-ribbon-group-label">Slides</span>
              </div>

              <div className="ppt-ribbon-group" style={{ minWidth: 80 }}>
                <div className="ppt-ribbon-group-content">
                  <button className="ppt-ribbon-btn ppt-ribbon-btn-large" onClick={() => store.setTool('text')}>
                    <Type className="w-6 h-6" />
                    <span>Text Box</span>
                  </button>
                </div>
                <span className="ppt-ribbon-group-label">Text</span>
              </div>

              <div className="ppt-ribbon-group" style={{ minWidth: 100 }}>
                <div className="ppt-ribbon-group-content">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="ppt-ribbon-btn ppt-ribbon-btn-large">
                        <Image className="w-6 h-6 text-green-600" />
                        <span>Pictures <ChevronDown className="w-3 h-3 inline" /></span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                        <Upload className="w-4 h-4 mr-2" /> Upload from Device
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowUrlDialog(true)}>
                        <Link className="w-4 h-4 mr-2" /> Insert from URL
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {getRecentImages().length > 0 ? (
                        <>
                          <div className="px-2 py-1 text-[10px] font-semibold text-[hsl(var(--muted-foreground))]">Recent Images</div>
                          <div className="grid grid-cols-4 gap-1 px-2 pb-2">
                            {getRecentImages().slice(0, 8).map((src, i) => (
                              <button key={i} onClick={() => insertImageToCanvas(src)} className="w-10 h-10 rounded border border-[hsl(var(--border))] overflow-hidden hover:border-[hsl(var(--ppt-selection))]">
                                <img src={src} alt="" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </>
                      ) : (
                        <DropdownMenuItem disabled>
                          <Clock className="w-4 h-4 mr-2" /> No recent images
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <span className="ppt-ribbon-group-label">Images</span>
                <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.gif,.svg,.webp" className="hidden" onChange={handleImageUpload} />
              </div>

              <div className="ppt-ribbon-group" style={{ minWidth: 240 }}>
                <div className="ppt-ribbon-group-content flex-wrap gap-0.5">
                  {SHAPE_CATEGORIES.flatMap(c => c.shapes).slice(0, 12).map(s => (
                    <button
                      key={s.type}
                      className={`ppt-ribbon-btn ppt-ribbon-btn-icon ${store.tool === 'shape' && store.activeShapeType === s.type ? 'active' : ''}`}
                      onClick={() => { store.setTool('shape'); store.setActiveShapeType(s.type); }}
                      title={s.label}
                    >
                      <ShapeMiniIcon type={s.type} />
                    </button>
                  ))}
                </div>
                <span className="ppt-ribbon-group-label">Shapes</span>
              </div>
            </>
          )}

          {activeTab === 'Design' && (
            <>
              <div className="ppt-ribbon-group" style={{ minWidth: 500 }}>
                <div className="ppt-ribbon-group-content overflow-x-auto gap-2 py-1">
                  {THEMES.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => applyTheme(theme.id)}
                      className={`flex-shrink-0 rounded border-2 transition-all hover:scale-105 ${
                        store.presentation.theme === theme.id ? 'border-[hsl(var(--ppt-selection))] shadow-md' : 'border-transparent hover:border-[hsl(var(--border))]'
                      }`}
                      title={theme.name}
                      style={{ width: 84, height: 56 }}
                    >
                      <div
                        className="w-full h-full rounded-sm flex items-end p-1"
                        style={{ backgroundColor: theme.colors.background }}
                      >
                        <div className="flex gap-0.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.colors.accent }} />
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.colors.text }} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <span className="ppt-ribbon-group-label">Themes</span>
              </div>

              {/* Themes Panel Button */}
              <div className="ppt-ribbon-group" style={{ minWidth: 80 }}>
                <div className="ppt-ribbon-group-content">
                  <button
                    className="ppt-ribbon-btn ppt-ribbon-btn-large"
                    onClick={onToggleThemes}
                    title="Open Themes Panel"
                  >
                    <Palette className="w-6 h-6 text-[hsl(var(--ppt-brand))]" />
                    <span>Themes</span>
                  </button>
                </div>
                <span className="ppt-ribbon-group-label">Advanced</span>
              </div>
            </>
          )}

          {activeTab === 'Transitions' && (
            <>
              <div className="ppt-ribbon-group" style={{ minWidth: 300 }}>
                <div className="ppt-ribbon-group-content gap-2 py-1">
                  {TRANSITION_OPTIONS.map(t => {
                    const slide = store.getCurrentSlide();
                    const isActive = slide?.transition.type === t.value;
                    return (
                      <button
                        key={t.value}
                        onClick={() => {
                          store.pushHistory();
                          const slides = [...store.presentation.slides];
                          slides[store.currentSlideIndex] = {
                            ...slides[store.currentSlideIndex],
                            transition: { ...slides[store.currentSlideIndex].transition, type: t.value as any },
                          };
                          store.setPresentation({ ...store.presentation, slides, updatedAt: Date.now() });
                        }}
                        className={`flex-shrink-0 rounded border-2 flex items-center justify-center text-xs transition-all ${
                          isActive ? 'border-[hsl(var(--ppt-selection))] bg-[hsl(var(--ppt-active))]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--ppt-selection))]'
                        }`}
                        style={{ width: 72, height: 52 }}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
                <span className="ppt-ribbon-group-label">Transition to This Slide</span>
              </div>

              <div className="ppt-ribbon-group" style={{ minWidth: 120 }}>
                <div className="ppt-ribbon-group-content flex-col gap-1 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px]">Duration:</span>
                    <input
                      className="ppt-input"
                      type="number"
                      step="0.1"
                      min="0.3"
                      max="3"
                      value={store.getCurrentSlide()?.transition.duration || 0.5}
                      onChange={(e) => {
                        const slides = [...store.presentation.slides];
                        slides[store.currentSlideIndex] = {
                          ...slides[store.currentSlideIndex],
                          transition: { ...slides[store.currentSlideIndex].transition, duration: parseFloat(e.target.value) },
                        };
                        store.setPresentation({ ...store.presentation, slides, updatedAt: Date.now() });
                      }}
                      style={{ width: 50 }}
                    />
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))]">sec</span>
                  </div>
                </div>
                <span className="ppt-ribbon-group-label">Timing</span>
              </div>
            </>
          )}

          {activeTab === 'Slide Show' && (
            <>
              <div className="ppt-ribbon-group" style={{ minWidth: 120 }}>
                <div className="ppt-ribbon-group-content">
                  <button
                    className="ppt-ribbon-btn ppt-ribbon-btn-large"
                    onClick={() => { store.setCurrentSlide(0); store.setPresentationMode(true); }}
                  >
                    <Play className="w-6 h-6 text-[hsl(var(--ppt-brand))]" />
                    <span>From Beginning</span>
                  </button>
                  <button
                    className="ppt-ribbon-btn ppt-ribbon-btn-large"
                    onClick={() => store.setPresentationMode(true)}
                  >
                    <Play className="w-6 h-6" />
                    <span>From Current</span>
                  </button>
                </div>
                <span className="ppt-ribbon-group-label">Start Slide Show</span>
              </div>

              <div className="ppt-ribbon-group" style={{ minWidth: 120 }}>
                <div className="ppt-ribbon-group-content">
                  <button
                    className="ppt-ribbon-btn ppt-ribbon-btn-large"
                    onClick={async () => {
                      try {
                        const { toPng } = await import('html-to-image');
                        const el = document.querySelector('[data-slide-export]') as HTMLElement;
                        if (!el) return;
                        const dataUrl = await toPng(el, { width: 960, height: 540, pixelRatio: 2 });
                        const a = document.createElement('a');
                        a.href = dataUrl;
                        a.download = `slide-${store.currentSlideIndex + 1}.png`;
                        a.click();
                      } catch { alert('PNG export failed.'); }
                    }}
                  >
                    <Camera className="w-6 h-6 text-green-600" />
                    <span>Export PNG</span>
                  </button>
                </div>
                <span className="ppt-ribbon-group-label">Export Slide</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Theme Picker Dialog */}
      <Dialog open={showThemePicker} onOpenChange={setShowThemePicker}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose a Theme</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto p-1">
            {THEMES.map(theme => (
              <button
                key={theme.id}
                onClick={() => applyTheme(theme.id)}
                className={`rounded-lg border-2 p-3 text-left transition-all hover:shadow-md ${
                  store.presentation.theme === theme.id ? 'border-[hsl(var(--ppt-selection))] shadow-md' : 'border-[hsl(var(--border))]'
                }`}
              >
                <div className="w-full h-16 rounded-md mb-2 flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
                  <div className="flex gap-1">
                    {Object.values(theme.colors).slice(0, 4).map((c, i) => (
                      <div key={i} className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <span className="text-xs font-medium">{theme.name}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <OpenPresentationDialog
        open={showOpenDialog}
        onOpenChange={setShowOpenDialog}
        presentations={store.savedPresentations}
        onOpen={(id) => store.loadPresentation(id)}
        onDelete={(id) => { store.deletePresentation(id); store.loadSavedList(); }}
      />

      <PresentationSettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
      />

      <SaveAsDialog
        open={showSaveAsDialog}
        onOpenChange={setShowSaveAsDialog}
        currentName={store.presentation.name}
        onSaveAs={(name) => store.saveAs(name)}
      />

      {/* Insert Image from URL Dialog */}
      <Dialog open={showUrlDialog} onOpenChange={setShowUrlDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Image from URL</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <input
              type="url"
              placeholder="https://example.com/image.png"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInsertFromUrl()}
              className="ppt-input w-full text-left px-3 py-2"
            />
            {urlError && <p className="text-xs text-red-500">{urlError}</p>}
            {imageUrl && (
              <div className="border border-[hsl(var(--border))] rounded p-2 flex items-center justify-center h-32 bg-[hsl(var(--muted))]">
                <img src={imageUrl} alt="Preview" className="max-w-full max-h-full object-contain" onError={() => setUrlError('Could not load image preview')} />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button className="ppt-ribbon-btn px-3 py-1.5 text-xs" onClick={() => { setShowUrlDialog(false); setImageUrl(''); setUrlError(''); }}>Cancel</button>
              <button
                className="px-3 py-1.5 text-xs rounded bg-[hsl(var(--ppt-brand))] text-white hover:opacity-90 disabled:opacity-50"
                onClick={handleInsertFromUrl}
                disabled={urlLoading || !imageUrl.trim()}
              >
                {urlLoading ? 'Loading...' : 'Insert'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
