import React, { useRef, useCallback } from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import { SlideObjectComponent } from './SlideObjectComponent';

export const SlideCanvas: React.FC = () => {
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
      if (file.size > 10 * 1024 * 1024) { alert('Image must be under 10MB'); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const maxW = 400, maxH = 400;
          let w = img.width, h = img.height;
          if (w > maxW) { h = h * (maxW / w); w = maxW; }
          if (h > maxH) { w = w * (maxH / h); h = maxH; }
          const cx = (960 - w) / 2;
          const cy = (540 - h) / 2;
          usePresentationStore.getState().addImage(src, cx, cy, w, h);
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
    <div className="flex-1 flex items-center justify-center bg-canvas overflow-auto p-8">
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
          className="relative shadow-2xl"
          style={{
            width: presentation.slideWidth,
            height: presentation.slideHeight,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            ...bgStyle,
          }}
          onClick={handleCanvasClick}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleImageUpload}
        >
          <div className="slide-bg absolute inset-0" />
          {showGrid && (
            <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%" style={{ opacity: 0.15 }}>
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          )}
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
