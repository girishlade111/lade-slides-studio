import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { SlideObject } from '@/types/presentation';
import { usePresentationStore } from '@/stores/presentationStore';
import { ShapeRenderer } from './ShapeRenderer';

interface SlideObjectComponentProps {
  obj: SlideObject;
  isSelected: boolean;
  scale: number;
  slideIndex: number;
}

export const SlideObjectComponent: React.FC<SlideObjectComponentProps> = ({
  obj, isSelected, scale, slideIndex
}) => {
  const { setSelectedObjects, updateObject, moveObject, resizeObject, pushHistory } = usePresentationStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, objX: 0, objY: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0, objX: 0, objY: 0, handle: '' });
  const textRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!isDragging && !isResizing) return;

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
    };

    const handleUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, isResizing, obj.id, scale, slideIndex, updateObject, resizeObject]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (obj.type === 'text') {
      setIsEditing(true);
      setTimeout(() => textRef.current?.focus(), 0);
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
            backgroundColor: tp.backgroundColor,
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
    if (obj.type === 'image' && obj.imageProps) {
      return (
        <img
          src={obj.imageProps.src}
          alt=""
          className="w-full h-full pointer-events-none"
          style={{
            objectFit: obj.imageProps.objectFit,
            filter: obj.imageProps.filter !== 'none' ? obj.imageProps.filter : undefined,
            opacity: obj.imageProps.opacity / 100,
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
      className={`slide-object absolute ${isSelected ? 'slide-object-selected' : ''}`}
      style={{
        left: obj.position.x,
        top: obj.position.y,
        width: obj.size.width,
        height: obj.size.height,
        transform: obj.rotation ? `rotate(${obj.rotation}deg)` : undefined,
        zIndex: obj.zIndex,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {renderContent()}
      {isSelected && !obj.locked && (
        <>
          {handles.map((h) => (
            <div
              key={h}
              className="resize-handle"
              style={handlePositions[h]}
              onMouseDown={(e) => handleResizeStart(e, h)}
            />
          ))}
        </>
      )}
    </div>
  );
};
