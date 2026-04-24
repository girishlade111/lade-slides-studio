import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { SlideObject } from '@/types/presentation';
import { usePresentationStore } from '@/stores/presentationStore';
import { ShapeRenderer } from './ShapeRenderer';
import { TableRenderer } from './TableRenderer';
import { RotateCw } from 'lucide-react';

interface SlideObjectComponentProps {
  obj: SlideObject;
  isSelected: boolean;
  scale: number;
  slideIndex: number;
}

export const SlideObjectComponent: React.FC<SlideObjectComponentProps> = ({
  obj, isSelected, scale, slideIndex
}) => {
  const { setSelectedObjects, updateObject, resizeObject, pushHistory } = usePresentationStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, objX: 0, objY: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0, objX: 0, objY: 0, handle: '' });
  const rotateStart = useRef({ startAngle: 0, objRotation: 0 });
  const textRef = useRef<HTMLDivElement>(null);
  const objRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSelected) setIsEditing(false);
  }, [isSelected]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    setSelectedObjects([obj.id]);
    if (obj.locked) return;
    setIsDragging(true);
    pushHistory();
    dragStart.current = { x: e.clientX, y: e.clientY, objX: obj.position.x, objY: obj.position.y };
  }, [obj, isEditing, setSelectedObjects, pushHistory]);

  const handleResizeStart = useCallback((e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (obj.locked) return;
    setIsResizing(true);
    pushHistory();
    resizeStart.current = {
      x: e.clientX, y: e.clientY,
      w: obj.size.width, h: obj.size.height,
      objX: obj.position.x, objY: obj.position.y,
      handle,
    };
  }, [obj, pushHistory]);

  const handleRotateStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (obj.locked) return;
    setIsRotating(true);
    pushHistory();
    // Calculate center of object in screen coordinates
    const rect = objRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
    rotateStart.current = { startAngle, objRotation: obj.rotation || 0 };
  }, [obj, pushHistory]);

  useEffect(() => {
    if (!isDragging && !isResizing && !isRotating) return;

    const handleMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = (e.clientX - dragStart.current.x) / (scale / 100);
        const dy = (e.clientY - dragStart.current.y) / (scale / 100);
        updateObject(slideIndex, obj.id, {
          position: { x: dragStart.current.objX + dx, y: dragStart.current.objY + dy },
        });
      }
      if (isResizing) {
        const rs = resizeStart.current;
        const dx = (e.clientX - rs.x) / (scale / 100);
        const dy = (e.clientY - rs.y) / (scale / 100);
        let newW = rs.w, newH = rs.h, newX = rs.objX, newY = rs.objY;

        if (rs.handle.includes('e')) newW = Math.max(20, rs.w + dx);
        if (rs.handle.includes('w')) { newW = Math.max(20, rs.w - dx); newX = rs.objX + dx; }
        if (rs.handle.includes('s')) newH = Math.max(20, rs.h + dy);
        if (rs.handle.includes('n')) { newH = Math.max(20, rs.h - dy); newY = rs.objY + dy; }

        resizeObject(obj.id, { width: newW, height: newH }, { x: newX, y: newY });
      }
      if (isRotating) {
        const rect = objRef.current?.getBoundingClientRect();
        if (!rect) return;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
        let rotation = rotateStart.current.objRotation + (angle - rotateStart.current.startAngle);
        // Snap to 15° increments when holding shift
        if (e.shiftKey) rotation = Math.round(rotation / 15) * 15;
        updateObject(slideIndex, obj.id, { rotation });
      }
    };

    const handleUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setIsRotating(false);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, isResizing, isRotating, obj.id, scale, slideIndex, updateObject, resizeObject]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (obj.type === 'text') {
      setIsEditing(true);
      setTimeout(() => textRef.current?.focus(), 0);
    }
    if (obj.type === 'table') {
      setIsEditing(true);
    }
  }, [obj.type]);

  const handleTextBlur = useCallback(() => {
    setIsEditing(false);
    if (textRef.current && obj.textProps) {
      updateObject(slideIndex, obj.id, {
        textProps: { ...obj.textProps, content: textRef.current.innerText },
      });
    }
  }, [obj, slideIndex, updateObject]);

  const renderContent = () => {
    if (obj.type === 'text' && obj.textProps) {
      const tp = obj.textProps;
      return (
        <div
          ref={textRef}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onBlur={handleTextBlur}
          className="w-full h-full outline-none overflow-hidden"
          style={{
            fontFamily: tp.fontFamily,
            fontSize: `${tp.fontSize}px`,
            fontWeight: tp.fontWeight,
            fontStyle: tp.fontStyle,
            textDecoration: tp.textDecoration !== 'none' ? tp.textDecoration : undefined,
            color: tp.color,
            textAlign: tp.textAlign,
            lineHeight: tp.lineHeight,
            backgroundColor: tp.backgroundColor !== 'transparent' ? tp.backgroundColor : undefined,
            cursor: isEditing ? 'text' : 'default',
            wordBreak: 'break-word',
          }}
        >
          {tp.content}
        </div>
      );
    }
    if (obj.type === 'shape') {
      return <ShapeRenderer obj={obj} />;
    }
    if (obj.type === 'chart') {
      return <ChartRenderer object={obj} />;
    }
    if (obj.type === 'table' && obj.tableProps) {
      return <TableRenderer obj={obj} isEditing={isEditing} slideIndex={slideIndex} />;
    }
    if (obj.type === 'image' && obj.imageProps) {
      const ip = obj.imageProps;
      const f = ip.filters || { grayscale: 0, sepia: 0, blur: 0, brightness: 100, contrast: 100, saturation: 100 };
      const filterStr = [
        f.grayscale ? `grayscale(${f.grayscale}%)` : '',
        f.sepia ? `sepia(${f.sepia}%)` : '',
        f.blur ? `blur(${f.blur}px)` : '',
        f.brightness !== 100 ? `brightness(${f.brightness}%)` : '',
        f.contrast !== 100 ? `contrast(${f.contrast}%)` : '',
        f.saturation !== 100 ? `saturate(${f.saturation}%)` : '',
      ].filter(Boolean).join(' ') || undefined;

      const border = ip.border?.enabled ? `${ip.border.width}px solid ${ip.border.color}` : undefined;
      const shadow = ip.shadow?.enabled ? `${ip.shadow.offsetX}px ${ip.shadow.offsetY}px ${ip.shadow.blur}px ${ip.shadow.color}` : undefined;
      const scaleX = ip.flipH ? -1 : 1;
      const scaleY = ip.flipV ? -1 : 1;
      const needsFlip = ip.flipH || ip.flipV;

      return (
        <img
          src={ip.src}
          alt=""
          className="w-full h-full pointer-events-none"
          style={{
            objectFit: ip.objectFit,
            filter: filterStr,
            opacity: ip.opacity / 100,
            borderRadius: ip.cornerRadius ? `${ip.cornerRadius}px` : undefined,
            border,
            boxShadow: shadow,
            transform: needsFlip ? `scale(${scaleX}, ${scaleY})` : undefined,
          }}
          draggable={false}
        />
      );
    }
    return null;
  };

  const handles = ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'];
  const handlePositions: Record<string, React.CSSProperties> = {
    nw: { top: -4, left: -4, cursor: 'nw-resize' },
    ne: { top: -4, right: -4, cursor: 'ne-resize' },
    sw: { bottom: -4, left: -4, cursor: 'sw-resize' },
    se: { bottom: -4, right: -4, cursor: 'se-resize' },
    n: { top: -4, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' },
    s: { bottom: -4, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' },
    e: { top: '50%', right: -4, transform: 'translateY(-50%)', cursor: 'e-resize' },
    w: { top: '50%', left: -4, transform: 'translateY(-50%)', cursor: 'w-resize' },
  };

  return (
    <div
      ref={objRef}
      className={`slide-object absolute ${isSelected ? 'slide-object-selected' : ''}`}
      style={{
        left: obj.position.x,
        top: obj.position.y,
        width: obj.size.width,
        height: obj.size.height,
        transform: obj.rotation ? `rotate(${obj.rotation}deg)` : undefined,
        zIndex: obj.zIndex,
        cursor: isDragging ? 'grabbing' : isEditing ? 'text' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {renderContent()}
      {isSelected && !obj.locked && (
        <>
          {/* Resize handles */}
          {handles.map((h) => (
            <div
              key={h}
              className="resize-handle"
              style={handlePositions[h]}
              onMouseDown={(e) => handleResizeStart(e, h)}
            />
          ))}
          {/* Rotation handle */}
          <div
            className="absolute flex flex-col items-center"
            style={{ top: -32, left: '50%', transform: 'translateX(-50%)' }}
          >
            <div
              className="w-5 h-5 rounded-full bg-white border-[1.5px] border-[hsl(var(--ppt-selection))] flex items-center justify-center cursor-grab hover:bg-[hsl(var(--accent))] hover:text-white transition-colors"
              onMouseDown={handleRotateStart}
              title="Rotate"
            >
              <RotateCw className="w-3 h-3" />
            </div>
            <div className="w-px h-2 bg-[hsl(var(--ppt-selection))]" />
          </div>
        </>
      )}
    </div>
  );
};
