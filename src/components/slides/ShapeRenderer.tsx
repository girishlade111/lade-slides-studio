import React from 'react';
import type { SlideObject } from '@/types/presentation';

interface ShapeRendererProps {
  obj: SlideObject;
}

export const ShapeRenderer: React.FC<ShapeRendererProps> = ({ obj }) => {
  const { shapeProps } = obj;
  if (!shapeProps) return null;

  const { shapeType, fill, fillOpacity, stroke, strokeWidth, borderRadius } = shapeProps;
  const w = obj.size.width;
  const h = obj.size.height;
  const opacity = fillOpacity / 100;

  switch (shapeType) {
    case 'rectangle':
      return (
        <div
          className="w-full h-full"
          style={{
            backgroundColor: fill,
            opacity,
            border: strokeWidth > 0 ? `${strokeWidth}px solid ${stroke}` : 'none',
            borderRadius: `${borderRadius}px`,
          }}
        />
      );
    case 'circle':
      return (
        <div
          className="w-full h-full rounded-full"
          style={{
            backgroundColor: fill,
            opacity,
            border: strokeWidth > 0 ? `${strokeWidth}px solid ${stroke}` : 'none',
          }}
        />
      );
    case 'triangle':
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <polygon
            points={`${w / 2},0 ${w},${h} 0,${h}`}
            fill={fill}
            fillOpacity={opacity}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </svg>
      );
    case 'star':
      return (
        <svg width={w} height={h} viewBox="0 0 100 100">
          <polygon
            points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35"
            fill={fill}
            fillOpacity={opacity}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </svg>
      );
    case 'pentagon':
      return (
        <svg width={w} height={h} viewBox="0 0 100 100">
          <polygon
            points="50,5 97,38 80,95 20,95 3,38"
            fill={fill}
            fillOpacity={opacity}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </svg>
      );
    case 'hexagon':
      return (
        <svg width={w} height={h} viewBox="0 0 100 100">
          <polygon
            points="50,3 93,25 93,75 50,97 7,75 7,25"
            fill={fill}
            fillOpacity={opacity}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </svg>
      );
    case 'arrow':
      return (
        <svg width={w} height={h} viewBox="0 0 100 60">
          <polygon
            points="0,20 65,20 65,0 100,30 65,60 65,40 0,40"
            fill={fill}
            fillOpacity={opacity}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </svg>
      );
    case 'line':
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke={fill} strokeWidth={Math.max(strokeWidth, 2)} />
        </svg>
      );
    default:
      return <div className="w-full h-full" style={{ backgroundColor: fill, opacity }} />;
  }
};
