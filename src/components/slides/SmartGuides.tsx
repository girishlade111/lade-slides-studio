import React from 'react';
import type { SlideObject } from '@/types/presentation';

interface SmartGuidesProps {
  objects: SlideObject[];
  selectedIds: string[];
  slideWidth: number;
  slideHeight: number;
}

interface GuideLine {
  type: 'h' | 'v';
  pos: number;
}

const THRESHOLD = 5;

export const SmartGuides: React.FC<SmartGuidesProps> = ({ objects, selectedIds, slideWidth, slideHeight }) => {
  if (selectedIds.length === 0) return null;

  const selected = objects.filter(o => selectedIds.includes(o.id));
  const others = objects.filter(o => !selectedIds.includes(o.id));

  if (selected.length === 0) return null;

  const guides: GuideLine[] = [];

  // Bounding box of selected objects
  const selLeft = Math.min(...selected.map(o => o.position.x));
  const selRight = Math.max(...selected.map(o => o.position.x + o.size.width));
  const selTop = Math.min(...selected.map(o => o.position.y));
  const selBottom = Math.max(...selected.map(o => o.position.y + o.size.height));
  const selCenterX = (selLeft + selRight) / 2;
  const selCenterY = (selTop + selBottom) / 2;

  // Canvas center guides
  const canvasCX = slideWidth / 2;
  const canvasCY = slideHeight / 2;
  if (Math.abs(selCenterX - canvasCX) < THRESHOLD) guides.push({ type: 'v', pos: canvasCX });
  if (Math.abs(selCenterY - canvasCY) < THRESHOLD) guides.push({ type: 'h', pos: canvasCY });

  // Canvas edge guides
  if (Math.abs(selLeft) < THRESHOLD) guides.push({ type: 'v', pos: 0 });
  if (Math.abs(selRight - slideWidth) < THRESHOLD) guides.push({ type: 'v', pos: slideWidth });
  if (Math.abs(selTop) < THRESHOLD) guides.push({ type: 'h', pos: 0 });
  if (Math.abs(selBottom - slideHeight) < THRESHOLD) guides.push({ type: 'h', pos: slideHeight });

  // Object-to-object alignment guides
  others.forEach(other => {
    const oLeft = other.position.x;
    const oRight = oLeft + other.size.width;
    const oTop = other.position.y;
    const oBottom = oTop + other.size.height;
    const oCX = (oLeft + oRight) / 2;
    const oCY = (oTop + oBottom) / 2;

    // Vertical guides (x-axis alignment)
    if (Math.abs(selLeft - oLeft) < THRESHOLD) guides.push({ type: 'v', pos: oLeft });
    if (Math.abs(selLeft - oRight) < THRESHOLD) guides.push({ type: 'v', pos: oRight });
    if (Math.abs(selRight - oLeft) < THRESHOLD) guides.push({ type: 'v', pos: oLeft });
    if (Math.abs(selRight - oRight) < THRESHOLD) guides.push({ type: 'v', pos: oRight });
    if (Math.abs(selCenterX - oCX) < THRESHOLD) guides.push({ type: 'v', pos: oCX });

    // Horizontal guides (y-axis alignment)
    if (Math.abs(selTop - oTop) < THRESHOLD) guides.push({ type: 'h', pos: oTop });
    if (Math.abs(selTop - oBottom) < THRESHOLD) guides.push({ type: 'h', pos: oBottom });
    if (Math.abs(selBottom - oTop) < THRESHOLD) guides.push({ type: 'h', pos: oTop });
    if (Math.abs(selBottom - oBottom) < THRESHOLD) guides.push({ type: 'h', pos: oBottom });
    if (Math.abs(selCenterY - oCY) < THRESHOLD) guides.push({ type: 'h', pos: oCY });
  });

  // Deduplicate
  const unique = guides.filter((g, i, arr) =>
    arr.findIndex(x => x.type === g.type && Math.abs(x.pos - g.pos) < 1) === i
  );

  if (unique.length === 0) return null;

  return (
    <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%" style={{ zIndex: 9999 }}>
      {unique.map((g, i) =>
        g.type === 'v' ? (
          <line key={i} x1={g.pos} y1={0} x2={g.pos} y2={slideHeight} stroke="#e74694" strokeWidth="1" strokeDasharray="4 2" opacity={0.8} />
        ) : (
          <line key={i} x1={0} y1={g.pos} x2={slideWidth} y2={g.pos} stroke="#e74694" strokeWidth="1" strokeDasharray="4 2" opacity={0.8} />
        )
      )}
    </svg>
  );
};
