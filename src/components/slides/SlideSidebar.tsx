import React, { useCallback } from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import { Plus, Trash2, Copy, GripVertical } from 'lucide-react';

export const SlideSidebar: React.FC = () => {
  const {
    presentation, currentSlideIndex, setCurrentSlide,
    addSlide, deleteSlide, duplicateSlide, reorderSlides,
  } = usePresentationStore();

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('slide-index', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('slide-index'));
    if (!isNaN(fromIndex) && fromIndex !== targetIndex) {
      reorderSlides(fromIndex, targetIndex);
    }
  }, [reorderSlides]);

  return (
    <div className="w-52 bg-card border-r border-border flex flex-col h-full">
      <div className="p-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Slides</span>
        <button
          onClick={() => addSlide(currentSlideIndex)}
          className="p-1 rounded hover:bg-muted transition-colors"
          title="Add Slide"
        >
          <Plus className="w-4 h-4 text-primary" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-2">
        {presentation.slides.map((slide, index) => (
          <div
            key={slide.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, index)}
            className={`group relative cursor-pointer rounded-lg border-2 transition-all ${
              index === currentSlideIndex
                ? 'border-primary shadow-md'
                : 'border-transparent hover:border-muted-foreground/20'
            }`}
            onClick={() => setCurrentSlide(index)}
          >
            <div className="flex items-center gap-1 px-1 pt-1">
              <GripVertical className="w-3 h-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100 cursor-grab" />
              <span className="text-[10px] font-medium text-muted-foreground">{index + 1}</span>
              <div className="flex-1" />
              <button
                onClick={(e) => { e.stopPropagation(); duplicateSlide(index); }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted transition-all"
                title="Duplicate"
              >
                <Copy className="w-3 h-3 text-muted-foreground" />
              </button>
              {presentation.slides.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSlide(index); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/10 transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </button>
              )}
            </div>
            <div
              className="mx-1 mb-1 rounded overflow-hidden"
              style={{ aspectRatio: '16/9' }}
            >
              <SlideThumb slide={slide} width={presentation.slideWidth} height={presentation.slideHeight} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SlideThumb: React.FC<{ slide: any; width: number; height: number }> = ({ slide, width, height }) => {
  const bgStyle: React.CSSProperties = {};
  if (slide.background.type === 'color') bgStyle.backgroundColor = slide.background.value;
  else if (slide.background.type === 'gradient') {
    bgStyle.background = `linear-gradient(${slide.background.gradientDirection || '135deg'}, ${slide.background.value}, ${slide.background.secondaryValue || '#fff'})`;
  } else if (slide.background.type === 'image') {
    bgStyle.backgroundImage = `url(${slide.background.value})`;
    bgStyle.backgroundSize = 'cover';
  }

  const scale = 180 / width;

  return (
    <div className="relative w-full h-full overflow-hidden bg-card" style={bgStyle}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width, height }}>
        {slide.objects.map((obj: any) => (
          <div
            key={obj.id}
            className="absolute overflow-hidden"
            style={{
              left: obj.position.x,
              top: obj.position.y,
              width: obj.size.width,
              height: obj.size.height,
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
            {obj.type === 'shape' && obj.shapeProps && (
              <div
                className="w-full h-full"
                style={{
                  backgroundColor: obj.shapeProps.fill,
                  borderRadius: obj.shapeProps.shapeType === 'circle' ? '50%' : `${obj.shapeProps.borderRadius}px`,
                  opacity: obj.shapeProps.fillOpacity / 100,
                }}
              />
            )}
            {obj.type === 'image' && obj.imageProps && (
              <img src={obj.imageProps.src} alt="" className="w-full h-full" style={{ objectFit: obj.imageProps.objectFit, opacity: obj.imageProps.opacity / 100 }} draggable={false} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
