import React, { useRef } from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import type { ShapeType } from '@/types/presentation';
import {
  Type, Square, Circle, Triangle, Star, Hexagon, Pentagon, ArrowRight,
  Minus, Image, MousePointer, Grid3X3,
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
  const { tool, setTool, setActiveShapeType, zoom, setZoom, showGrid, setShowGrid } = usePresentationStore();
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

      <div className="flex-1" />

      <ToolbarBtn active={showGrid} onClick={() => setShowGrid(!showGrid)} title="Toggle Grid">
        <Grid3X3 className="w-4 h-4" />
      </ToolbarBtn>

      <div className="flex items-center gap-1 ml-2">
        {zoomLevels.map((z) => (
          <button
            key={z}
            onClick={() => setZoom(z)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              zoom === z
                ? 'bg-primary text-primary-foreground'
                : 'text-toolbar-foreground hover:bg-muted-foreground/20'
            }`}
          >
            {z}%
          </button>
        ))}
      </div>
    </div>
  );
};

const ToolbarBtn: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  title?: string;
}> = ({ children, onClick, active, title }) => (
  <button
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
);
