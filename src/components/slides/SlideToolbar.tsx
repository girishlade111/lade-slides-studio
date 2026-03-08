import React, { useRef } from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import type { ShapeType } from '@/types/presentation';
import {
  Type, Square, Circle, Triangle, Star, Hexagon, Pentagon, ArrowRight,
  Minus, Image, MousePointer, Grid3X3, Trash2, Copy, ZoomIn, ZoomOut,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const shapeOptions: { type: ShapeType; icon: React.ReactNode; label: string }[] = [
  { type: 'rectangle', icon: <Square className="w-4 h-4" />, label: 'Rectangle' },
  { type: 'circle', icon: <Circle className="w-4 h-4" />, label: 'Circle' },
  { type: 'triangle', icon: <Triangle className="w-4 h-4" />, label: 'Triangle' },
  { type: 'star', icon: <Star className="w-4 h-4" />, label: 'Star' },
  { type: 'pentagon', icon: <Pentagon className="w-4 h-4" />, label: 'Pentagon' },
  { type: 'hexagon', icon: <Hexagon className="w-4 h-4" />, label: 'Hexagon' },
  { type: 'arrow', icon: <ArrowRight className="w-4 h-4" />, label: 'Arrow' },
  { type: 'line', icon: <Minus className="w-4 h-4" />, label: 'Line' },
];

const zoomLevels = [50, 75, 100, 150, 200];

export const SlideToolbar: React.FC = () => {
  const {
    tool, setTool, setActiveShapeType, zoom, setZoom, showGrid, setShowGrid,
    selectedObjectIds, deleteObjects, duplicateSlide, currentSlideIndex,
  } = usePresentationStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        const maxW = 400;
        const ratio = img.width / img.height;
        const w = Math.min(img.width, maxW);
        const h = w / ratio;
        usePresentationStore.getState().addImage(src, 100, 100, w, h);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const zoomIdx = zoomLevels.indexOf(zoom);

  return (
    <div className="h-12 bg-toolbar border-t border-border flex items-center px-4 gap-1">
      <ToolbarBtn active={tool === 'select'} onClick={() => setTool('select')} title="Select (V)">
        <MousePointer className="w-4 h-4" />
      </ToolbarBtn>

      <ToolbarBtn active={tool === 'text'} onClick={() => setTool('text')} title="Text (T)">
        <Type className="w-4 h-4" />
      </ToolbarBtn>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={`flex items-center gap-1 px-2 py-1.5 rounded text-sm transition-colors ${
              tool === 'shape'
                ? 'bg-primary text-primary-foreground'
                : 'text-toolbar-foreground hover:bg-muted-foreground/20'
            }`}
          >
            <Square className="w-4 h-4" />
            <span className="text-xs">Shapes</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[140px]">
          {shapeOptions.map((s) => (
            <DropdownMenuItem
              key={s.type}
              onClick={() => { setTool('shape'); setActiveShapeType(s.type); }}
              className="flex items-center gap-2"
            >
              {s.icon}
              <span>{s.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <ToolbarBtn onClick={() => fileInputRef.current?.click()} title="Upload Image">
        <Image className="w-4 h-4" />
      </ToolbarBtn>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

      <div className="w-px h-6 bg-muted-foreground/20 mx-2" />

      {selectedObjectIds.length > 0 && (
        <>
          <ToolbarBtn onClick={() => deleteObjects(selectedObjectIds)} title="Delete">
            <Trash2 className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => {
            usePresentationStore.getState().copyObjects();
            usePresentationStore.getState().pasteObjects();
          }} title="Duplicate">
            <Copy className="w-4 h-4" />
          </ToolbarBtn>
          <div className="w-px h-6 bg-muted-foreground/20 mx-2" />
        </>
      )}

      <div className="flex-1" />

      <ToolbarBtn active={showGrid} onClick={() => setShowGrid(!showGrid)} title="Toggle Grid">
        <Grid3X3 className="w-4 h-4" />
      </ToolbarBtn>

      <div className="flex items-center gap-1 ml-2">
        <ToolbarBtn onClick={() => { if (zoomIdx > 0) setZoom(zoomLevels[zoomIdx - 1]); }} title="Zoom Out">
          <ZoomOut className="w-4 h-4" />
        </ToolbarBtn>
        <span className="text-xs text-toolbar-foreground min-w-[3rem] text-center">{zoom}%</span>
        <ToolbarBtn onClick={() => { if (zoomIdx < zoomLevels.length - 1) setZoom(zoomLevels[zoomIdx + 1]); }} title="Zoom In">
          <ZoomIn className="w-4 h-4" />
        </ToolbarBtn>
      </div>
    </div>
  );
};

const ToolbarBtn = React.forwardRef<HTMLButtonElement, {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  title?: string;
}>(({ children, onClick, active, title }, ref) => (
  <button
    ref={ref}
    onClick={onClick}
    title={title}
    className={`p-2 rounded transition-colors ${
      active
        ? 'bg-primary text-primary-foreground'
        : 'text-toolbar-foreground hover:bg-muted-foreground/20'
    }`}
  >
    {children}
  </button>
));
ToolbarBtn.displayName = 'ToolbarBtn';
