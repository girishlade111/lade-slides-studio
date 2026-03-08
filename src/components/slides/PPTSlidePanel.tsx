import React, { useCallback } from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import { ShapeRenderer } from './ShapeRenderer';

export const PPTSlidePanel: React.FC = () => {
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

  const handleContextMenu = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault();
    // Simple context menu via prompt-style actions (could be enhanced with a real context menu)
  }, []);

  return (
    <div className="ppt-slide-panel">
      <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
        {presentation.slides.map((slide, index) => (
          <div
            key={slide.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, index)}
            onContextMenu={(e) => handleContextMenu(e, index)}
            className={`ppt-slide-thumb ${index === currentSlideIndex ? 'active' : ''}`}
            onClick={() => setCurrentSlide(index)}
          >
            <span className="text-[10px] text-[hsl(var(--muted-foreground))] w-5 text-right flex-shrink-0 pt-1 select-none">
              {index + 1}
            </span>
            <div
              className="ppt-slide-thumb-preview flex-1"
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

  // Thumbnail is about 160px wide
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
            {obj.type === 'shape' && obj.shapeProps && (
              <ShapeRenderer obj={obj} />
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
