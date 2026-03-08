import React, { useCallback, useState, useRef } from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import { ShapeRenderer } from './ShapeRenderer';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Plus, Copy, Trash2, ArrowUp, ArrowDown, Clipboard } from 'lucide-react';

/* ── Sortable Thumbnail ── */
const SortableSlideThumb: React.FC<{
  slide: any;
  index: number;
  isActive: boolean;
  slideWidth: number;
  slideHeight: number;
  onSelect: () => void;
  onAdd: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onCopy: () => void;
  onPaste: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  hasPaste: boolean;
}> = ({
  slide, index, isActive, slideWidth, slideHeight,
  onSelect, onAdd, onDuplicate, onDelete, onMoveUp, onMoveDown, onCopy, onPaste,
  canMoveUp, canMoveDown, hasPaste,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slide.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          className={`ppt-slide-thumb ${isActive ? 'active' : ''}`}
          onClick={onSelect}
        >
          <span className="text-[10px] text-[hsl(var(--muted-foreground))] w-5 text-right flex-shrink-0 pt-1 select-none">
            {index + 1}
          </span>
          <div className="ppt-slide-thumb-preview flex-1" style={{ aspectRatio: '16/9' }}>
            <SlideThumb slide={slide} width={slideWidth} height={slideHeight} />
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onAdd}>
          <Plus className="w-4 h-4 mr-2" /> New Slide
        </ContextMenuItem>
        <ContextMenuItem onClick={onDuplicate}>
          <Copy className="w-4 h-4 mr-2" /> Duplicate Slide
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onMoveUp} disabled={!canMoveUp}>
          <ArrowUp className="w-4 h-4 mr-2" /> Move Up
        </ContextMenuItem>
        <ContextMenuItem onClick={onMoveDown} disabled={!canMoveDown}>
          <ArrowDown className="w-4 h-4 mr-2" /> Move Down
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onCopy}>
          <Copy className="w-4 h-4 mr-2" /> Copy Slide
        </ContextMenuItem>
        <ContextMenuItem onClick={onPaste} disabled={!hasPaste}>
          <Clipboard className="w-4 h-4 mr-2" /> Paste Slide
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDelete} className="text-[hsl(var(--destructive))]">
          <Trash2 className="w-4 h-4 mr-2" /> Delete Slide
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

/* ── Main Panel ── */
export const PPTSlidePanel: React.FC = () => {
  const {
    presentation, currentSlideIndex, setCurrentSlide,
    addSlide, deleteSlide, duplicateSlide, reorderSlides,
    copySlide, pasteSlide, slideClipboard,
  } = usePresentationStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = presentation.slides.findIndex(s => s.id === active.id);
    const newIndex = presentation.slides.findIndex(s => s.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) reorderSlides(oldIndex, newIndex);
  }, [presentation.slides, reorderSlides]);

  return (
    <div className="ppt-slide-panel">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={presentation.slides.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
            {presentation.slides.map((slide, index) => (
              <SortableSlideThumb
                key={slide.id}
                slide={slide}
                index={index}
                isActive={index === currentSlideIndex}
                slideWidth={presentation.slideWidth}
                slideHeight={presentation.slideHeight}
                onSelect={() => setCurrentSlide(index)}
                onAdd={() => addSlide(index)}
                onDuplicate={() => duplicateSlide(index)}
                onDelete={() => deleteSlide(index)}
                onMoveUp={() => index > 0 && reorderSlides(index, index - 1)}
                onMoveDown={() => index < presentation.slides.length - 1 && reorderSlides(index, index + 1)}
                onCopy={() => copySlide(index)}
                onPaste={() => pasteSlide(index)}
                canMoveUp={index > 0}
                canMoveDown={index < presentation.slides.length - 1}
                hasPaste={!!slideClipboard}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

/* ── Thumbnail Renderer ── */
const SlideThumb: React.FC<{ slide: any; width: number; height: number }> = ({ slide, width, height }) => {
  const bgStyle: React.CSSProperties = {};
  if (slide.background.type === 'color') bgStyle.backgroundColor = slide.background.value;
  else if (slide.background.type === 'gradient') {
    bgStyle.background = `linear-gradient(${slide.background.gradientDirection || '135deg'}, ${slide.background.value}, ${slide.background.secondaryValue || '#fff'})`;
  } else if (slide.background.type === 'image') {
    bgStyle.backgroundImage = `url(${slide.background.value})`;
    bgStyle.backgroundSize = 'cover';
  }

  const scale = 160 / width;

  return (
    <div className="relative w-full h-full overflow-hidden" style={bgStyle}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width, height, position: 'absolute', top: 0, left: 0 }}>
        {slide.objects.map((obj: any) => (
          <div
            key={obj.id}
            className="absolute overflow-hidden"
            style={{
              left: obj.position.x,
              top: obj.position.y,
              width: obj.size.width,
              height: obj.size.height,
              transform: obj.rotation ? `rotate(${obj.rotation}deg)` : undefined,
            }}
          >
            {obj.type === 'text' && obj.textProps && (
              <div
                style={{
                  fontFamily: obj.textProps.fontFamily,
                  fontSize: `${obj.textProps.fontSize}px`,
                  fontWeight: obj.textProps.fontWeight,
                  color: obj.textProps.color,
                  textAlign: obj.textProps.textAlign,
                  lineHeight: obj.textProps.lineHeight,
                }}
              >
                {obj.textProps.content}
              </div>
            )}
            {obj.type === 'shape' && obj.shapeProps && <ShapeRenderer obj={obj} />}
            {obj.type === 'image' && obj.imageProps && (
              <img src={obj.imageProps.src} alt="" className="w-full h-full" style={{ objectFit: obj.imageProps.objectFit, opacity: obj.imageProps.opacity / 100 }} draggable={false} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
