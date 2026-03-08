import React, { useRef, useCallback } from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import { buildBgStyle } from '@/lib/backgroundUtils';
import { SlideObjectComponent } from './SlideObjectComponent';

const PATTERN_SVG: Record<string, (color: string, scale: number) => string> = {
  dots: (c, s) => {
    const sz = 20 * s;
    return `url("data:image/svg+xml,%3Csvg width='${sz}' height='${sz}' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='${sz/2}' cy='${sz/2}' r='${sz*0.1}' fill='${encodeURIComponent(c)}'/%3E%3C/svg%3E")`;
  },
  grid: (c, s) => {
    const sz = 30 * s;
    return `url("data:image/svg+xml,%3Csvg width='${sz}' height='${sz}' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M ${sz} 0 L 0 0 0 ${sz}' fill='none' stroke='${encodeURIComponent(c)}' stroke-width='1'/%3E%3C/svg%3E")`;
  },
  'diagonal-stripes': (c, s) => {
    const sz = 20 * s;
    return `url("data:image/svg+xml,%3Csvg width='${sz}' height='${sz}' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M -${sz*0.25},${sz*0.25} l ${sz*0.5},-${sz*0.5} M 0,${sz} l ${sz},-${sz} M ${sz*0.75},${sz*1.25} l ${sz*0.5},-${sz*0.5}' stroke='${encodeURIComponent(c)}' stroke-width='2'/%3E%3C/svg%3E")`;
  },
  'horizontal-stripes': (c, s) => {
    const sz = 16 * s;
    return `url("data:image/svg+xml,%3Csvg width='${sz}' height='${sz}' xmlns='http://www.w3.org/2000/svg'%3E%3Cline x1='0' y1='${sz/2}' x2='${sz}' y2='${sz/2}' stroke='${encodeURIComponent(c)}' stroke-width='2'/%3E%3C/svg%3E")`;
  },
  'vertical-stripes': (c, s) => {
    const sz = 16 * s;
    return `url("data:image/svg+xml,%3Csvg width='${sz}' height='${sz}' xmlns='http://www.w3.org/2000/svg'%3E%3Cline x1='${sz/2}' y1='0' x2='${sz/2}' y2='${sz}' stroke='${encodeURIComponent(c)}' stroke-width='2'/%3E%3C/svg%3E")`;
  },
  checkerboard: (c, s) => {
    const sz = 20 * s;
    const h = sz / 2;
    return `url("data:image/svg+xml,%3Csvg width='${sz}' height='${sz}' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='${h}' height='${h}' fill='${encodeURIComponent(c)}'/%3E%3Crect x='${h}' y='${h}' width='${h}' height='${h}' fill='${encodeURIComponent(c)}'/%3E%3C/svg%3E")`;
  },
  hexagons: (c, s) => {
    const sz = 30 * s;
    return `url("data:image/svg+xml,%3Csvg width='${sz}' height='${sz*0.87}' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='${sz*0.5},0 ${sz},${sz*0.22} ${sz},${sz*0.65} ${sz*0.5},${sz*0.87} 0,${sz*0.65} 0,${sz*0.22}' fill='none' stroke='${encodeURIComponent(c)}' stroke-width='1'/%3E%3C/svg%3E")`;
  },
  triangles: (c, s) => {
    const sz = 24 * s;
    return `url("data:image/svg+xml,%3Csvg width='${sz}' height='${sz}' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='${sz/2},2 ${sz-2},${sz-2} 2,${sz-2}' fill='none' stroke='${encodeURIComponent(c)}' stroke-width='1'/%3E%3C/svg%3E")`;
  },
};

const PatternBackground: React.FC<{ pattern: { type: string; color: string; backgroundColor: string; scale: number } }> = ({ pattern }) => {
  const gen = PATTERN_SVG[pattern.type];
  if (!gen) return null;
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ backgroundColor: pattern.backgroundColor, backgroundImage: gen(pattern.color, pattern.scale) }}
    />
  );
};

const TEXTURE_CSS: Record<string, (tint: string, opacity: number) => React.CSSProperties> = {
  paper: (tint, op) => ({ backgroundColor: tint || '#faf8f5', backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`, opacity: op / 100 }),
  canvas: (tint, op) => ({ backgroundColor: tint || '#f5f0e8', backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='20' height='20' fill='none'/%3E%3Cpath d='M0 10h20M10 0v20' stroke='rgba(0,0,0,0.05)' stroke-width='0.5'/%3E%3C/svg%3E")`, opacity: op / 100 }),
  fabric: (tint, op) => ({ backgroundColor: tint || '#e8e0d4', backgroundImage: `url("data:image/svg+xml,%3Csvg width='8' height='8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h4v4H0zM4 4h4v4H4z' fill='rgba(0,0,0,0.04)'/%3E%3C/svg%3E")`, opacity: op / 100 }),
  wood: (tint, op) => ({ backgroundColor: tint || '#8B6914', backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)`, opacity: op / 100 }),
  marble: (tint, op) => ({ backgroundColor: tint || '#f0ece4', backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.02' numOctaves='5'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23m)' opacity='0.15'/%3E%3C/svg%3E")`, opacity: op / 100 }),
  concrete: (tint, op) => ({ backgroundColor: tint || '#c4c0b8', backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='c'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23c)' opacity='0.12'/%3E%3C/svg%3E")`, opacity: op / 100 }),
  leather: (tint, op) => ({ backgroundColor: tint || '#5C3317', backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='3' cy='3' r='1' fill='rgba(0,0,0,0.06)'/%3E%3Ccircle cx='9' cy='9' r='1' fill='rgba(0,0,0,0.06)'/%3E%3C/svg%3E")`, opacity: op / 100 }),
};

const TextureBackground: React.FC<{ texture: { type: string; opacity: number; tint: string } }> = ({ texture }) => {
  const gen = TEXTURE_CSS[texture.type];
  if (!gen) return null;
  return <div className="absolute inset-0 pointer-events-none" style={gen(texture.tint, texture.opacity)} />;
};

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

  const bgStyle: React.CSSProperties = buildBgStyle(slide.background);
  // Image-specific overrides for blur/opacity
  if (slide.background.type === 'image' && slide.background.image) {
    if (slide.background.image.blur) bgStyle.filter = `blur(${slide.background.image.blur}px)`;
    if (slide.background.image.opacity < 100) bgStyle.opacity = slide.background.image.opacity / 100;
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
          {/* Pattern/Texture background overlay */}
          {slide.background.type === 'pattern' && slide.background.pattern && (
            <PatternBackground pattern={slide.background.pattern} />
          )}
          {slide.background.type === 'texture' && slide.background.texture && (
            <TextureBackground texture={slide.background.texture} />
          )}
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
