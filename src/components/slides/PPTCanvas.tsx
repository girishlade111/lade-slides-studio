import React, { useRef, useCallback } from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import { SlideObjectComponent } from './SlideObjectComponent';
import { SmartGuides } from './SmartGuides';
import { AlignmentToolbar } from './AlignmentToolbar';

export const PPTCanvas: React.FC = () => {
  const {
    presentation, currentSlideIndex, zoom, showGrid, tool, activeShapeType,
    setSelectedObjects, addTextBox, addShape, selectedObjectIds,
  } = usePresentationStore();

  const slide = presentation.slides[currentSlideIndex];
  const canvasRef = useRef<HTMLDivElement>(null);

  const getSlideCoords = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scale = zoom / 100;
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  }, [zoom]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target === canvasRef.current || target.classList.contains('slide-bg')) {
      if (tool === 'text') {
        const { x, y } = getSlideCoords(e);
        addTextBox(x, y);
      } else if (tool === 'shape') {
        const { x, y } = getSlideCoords(e);
        addShape(activeShapeType, x, y);
      } else {
        setSelectedObjects([]);
      }
    }
  }, [tool, activeShapeType, getSlideCoords, addTextBox, addShape, setSelectedObjects]);

  const handleImageUpload = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        const img = new Image();
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
    });
  }, []);

  if (!slide) return null;

  const bgStyle: React.CSSProperties = {};
  if (slide.background.type === 'color') {
    bgStyle.backgroundColor = slide.background.value;
  } else if (slide.background.type === 'gradient') {
    bgStyle.background = `linear-gradient(${slide.background.gradientDirection || '135deg'}, ${slide.background.value}, ${slide.background.secondaryValue || '#ffffff'})`;
  } else if (slide.background.type === 'image') {
    bgStyle.backgroundImage = `url(${slide.background.value})`;
    bgStyle.backgroundSize = 'cover';
    bgStyle.backgroundPosition = 'center';
  }

  const scale = zoom / 100;

  return (
    <div className="ppt-canvas-area">
      {/* Alignment toolbar when objects selected */}
      {selectedObjectIds.length > 0 && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50">
          <AlignmentToolbar />
        </div>
      )}
      <div
        style={{
          width: presentation.slideWidth * scale,
          height: presentation.slideHeight * scale,
          flexShrink: 0,
        }}
      >
        <div
          ref={canvasRef}
          data-slide-export
          className="relative"
          style={{
            width: presentation.slideWidth,
            height: presentation.slideHeight,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            boxShadow: '0 2px 12px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.08)',
            ...bgStyle,
          }}
          onClick={handleCanvasClick}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleImageUpload}
        >
          <div className="slide-bg absolute inset-0" />
          {showGrid && (
            <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%" style={{ opacity: 0.12 }}>
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#999" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          )}
          {/* Smart Guides */}
          <SmartGuides
            objects={slide.objects}
            selectedIds={selectedObjectIds}
            slideWidth={presentation.slideWidth}
            slideHeight={presentation.slideHeight}
          />
          {slide.objects.map((obj) => (
            <SlideObjectComponent
              key={obj.id}
              obj={obj}
              isSelected={selectedObjectIds.includes(obj.id)}
              scale={zoom}
              slideIndex={currentSlideIndex}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
