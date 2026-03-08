import React from 'react';
import type { SlideObject } from '@/types/presentation';

interface ShapeRendererProps {
  obj: SlideObject;
}

export const ShapeRenderer: React.FC<ShapeRendererProps> = ({ obj }) => {
  const { shapeProps } = obj;
  if (!shapeProps) return null;

  const { shapeType, fill, fillOpacity, stroke, strokeWidth, strokeStyle, shadow } = shapeProps;
  const w = obj.size.width;
  const h = obj.size.height;
  const opacity = fillOpacity / 100;

  const dashArray = strokeStyle === 'dashed' ? '8,4' : strokeStyle === 'dotted' ? '2,3' : undefined;

  const shadowFilter = shadow?.enabled
    ? `drop-shadow(${shadow.offsetX || 2}px ${shadow.offsetY || 2}px ${shadow.blur || 4}px ${shadow.color || 'rgba(0,0,0,0.3)'})`
    : undefined;

  const svgStyle: React.CSSProperties = { filter: shadowFilter };

  const commonStroke = { stroke: strokeWidth > 0 ? stroke : 'none', strokeWidth, strokeDasharray: dashArray };

  // Helper for SVG shapes
  const SvgWrap: React.FC<{ children: React.ReactNode; vb?: string }> = ({ children, vb }) => (
    <svg width={w} height={h} viewBox={vb || `0 0 ${w} ${h}`} style={svgStyle} className="w-full h-full">
      {children}
    </svg>
  );

  switch (shapeType) {
    case 'rectangle':
    case 'process':
      return (
        <div className="w-full h-full" style={{
          backgroundColor: fill, opacity,
          border: strokeWidth > 0 ? `${strokeWidth}px ${strokeStyle || 'solid'} ${stroke}` : 'none',
          borderRadius: `${shapeProps.borderRadius}px`,
          filter: shadowFilter,
        }} />
      );

    case 'rounded-rectangle':
    case 'start-end':
      return (
        <div className="w-full h-full" style={{
          backgroundColor: fill, opacity,
          border: strokeWidth > 0 ? `${strokeWidth}px ${strokeStyle || 'solid'} ${stroke}` : 'none',
          borderRadius: Math.min(w, h) / 4,
          filter: shadowFilter,
        }} />
      );

    case 'circle':
      return (
        <div className="w-full h-full rounded-full" style={{
          backgroundColor: fill, opacity,
          border: strokeWidth > 0 ? `${strokeWidth}px ${strokeStyle || 'solid'} ${stroke}` : 'none',
          filter: shadowFilter,
        }} />
      );

    case 'triangle':
      return (
        <SvgWrap>
          <polygon points={`${w / 2},${strokeWidth} ${w - strokeWidth},${h - strokeWidth} ${strokeWidth},${h - strokeWidth}`}
            fill={fill} fillOpacity={opacity} {...commonStroke} />
        </SvgWrap>
      );

    case 'diamond':
    case 'decision':
      return (
        <SvgWrap>
          <polygon points={`${w / 2},${strokeWidth} ${w - strokeWidth},${h / 2} ${w / 2},${h - strokeWidth} ${strokeWidth},${h / 2}`}
            fill={fill} fillOpacity={opacity} {...commonStroke} />
        </SvgWrap>
      );

    case 'pentagon':
      return (
        <SvgWrap vb="0 0 100 100">
          <polygon points="50,5 97,38 80,95 20,95 3,38" fill={fill} fillOpacity={opacity} {...commonStroke} />
        </SvgWrap>
      );

    case 'hexagon':
      return (
        <SvgWrap vb="0 0 100 100">
          <polygon points="50,3 93,25 93,75 50,97 7,75 7,25" fill={fill} fillOpacity={opacity} {...commonStroke} />
        </SvgWrap>
      );

    case 'octagon':
      return (
        <SvgWrap vb="0 0 100 100">
          <polygon points="30,3 70,3 97,30 97,70 70,97 30,97 3,70 3,30" fill={fill} fillOpacity={opacity} {...commonStroke} />
        </SvgWrap>
      );

    case 'star':
      return (
        <SvgWrap vb="0 0 100 100">
          <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill={fill} fillOpacity={opacity} {...commonStroke} />
        </SvgWrap>
      );

    case 'heart':
      return (
        <SvgWrap vb="0 0 100 100">
          <path d="M50,88 C25,65 2,45 2,28 A22,22,0,0,1,50,20 A22,22,0,0,1,98,28 C98,45 75,65 50,88Z"
            fill={fill} fillOpacity={opacity} {...commonStroke} />
        </SvgWrap>
      );

    case 'cloud':
      return (
        <SvgWrap vb="0 0 100 70">
          <path d="M25,60 A18,18,0,0,1,15,28 A20,20,0,0,1,35,10 A22,22,0,0,1,65,8 A20,20,0,0,1,88,28 A16,16,0,0,1,80,60Z"
            fill={fill} fillOpacity={opacity} {...commonStroke} />
        </SvgWrap>
      );

    case 'arrow':
      return (
        <SvgWrap vb="0 0 100 60">
          <polygon points="0,20 65,20 65,0 100,30 65,60 65,40 0,40" fill={fill} fillOpacity={opacity} {...commonStroke} />
        </SvgWrap>
      );

    case 'arrow-left':
      return (
        <SvgWrap vb="0 0 100 60">
          <polygon points="100,20 35,20 35,0 0,30 35,60 35,40 100,40" fill={fill} fillOpacity={opacity} {...commonStroke} />
        </SvgWrap>
      );

    case 'arrow-up':
      return (
        <SvgWrap vb="0 0 60 100">
          <polygon points="20,100 20,35 0,35 30,0 60,35 40,35 40,100" fill={fill} fillOpacity={opacity} {...commonStroke} />
        </SvgWrap>
      );

    case 'arrow-down':
      return (
        <SvgWrap vb="0 0 60 100">
          <polygon points="20,0 20,65 0,65 30,100 60,65 40,65 40,0" fill={fill} fillOpacity={opacity} {...commonStroke} />
        </SvgWrap>
      );

    case 'double-arrow':
      return (
        <SvgWrap vb="0 0 100 60">
          <polygon points="0,30 20,0 20,20 80,20 80,0 100,30 80,60 80,40 20,40 20,60" fill={fill} fillOpacity={opacity} {...commonStroke} />
        </SvgWrap>
      );

    case 'curved-arrow':
      return (
        <SvgWrap vb="0 0 100 80">
          <path d="M10,60 Q10,10 60,10 L60,0 L85,18 L60,36 L60,22 Q22,22 22,60Z"
            fill={fill} fillOpacity={opacity} {...commonStroke} />
        </SvgWrap>
      );

    case 'line':
    case 'connector':
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={svgStyle}>
          <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke={fill} strokeWidth={Math.max(strokeWidth, 2)} strokeDasharray={dashArray} />
        </svg>
      );

    case 'elbow-connector':
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={svgStyle}>
          <polyline points={`0,${h / 2} ${w / 2},${h / 2} ${w / 2},${h} ${w},${h}`}
            fill="none" stroke={fill} strokeWidth={Math.max(strokeWidth, 2)} strokeDasharray={dashArray} />
        </svg>
      );

    case 'document':
      return (
        <SvgWrap vb="0 0 100 100">
          <path d="M2,2 L98,2 L98,82 Q75,100 50,82 Q25,64 2,82Z"
            fill={fill} fillOpacity={opacity} {...commonStroke} />
        </SvgWrap>
      );

    case 'database':
      return (
        <SvgWrap vb="0 0 100 120">
          <ellipse cx="50" cy="18" rx="46" ry="16" fill={fill} fillOpacity={opacity} {...commonStroke} />
          <path d="M4,18 L4,100 Q4,118 50,118 Q96,118 96,100 L96,18"
            fill={fill} fillOpacity={opacity} {...commonStroke} />
          <ellipse cx="50" cy="18" rx="46" ry="16" fill={fill} fillOpacity={opacity * 0.3} {...commonStroke} />
        </SvgWrap>
      );

    case 'manual-input':
      return (
        <SvgWrap vb="0 0 100 100">
          <polygon points="2,20 98,2 98,98 2,98" fill={fill} fillOpacity={opacity} {...commonStroke} />
        </SvgWrap>
      );

    case 'speech-bubble':
      return (
        <SvgWrap vb="0 0 100 90">
          <path d="M10,5 L90,5 Q97,5 97,12 L97,58 Q97,65 90,65 L35,65 L20,85 L25,65 L10,65 Q3,65 3,58 L3,12 Q3,5 10,5Z"
            fill={fill} fillOpacity={opacity} {...commonStroke} />
        </SvgWrap>
      );

    case 'thought-bubble':
      return (
        <SvgWrap vb="0 0 100 90">
          <ellipse cx="50" cy="35" rx="44" ry="30" fill={fill} fillOpacity={opacity} {...commonStroke} />
          <ellipse cx="28" cy="72" rx="6" ry="5" fill={fill} fillOpacity={opacity} {...commonStroke} />
          <ellipse cx="20" cy="82" rx="4" ry="3" fill={fill} fillOpacity={opacity} {...commonStroke} />
        </SvgWrap>
      );

    case 'rect-callout':
      return (
        <SvgWrap vb="0 0 100 90">
          <path d="M2,2 L98,2 L98,62 L40,62 L25,85 L30,62 L2,62Z"
            fill={fill} fillOpacity={opacity} {...commonStroke} />
        </SvgWrap>
      );

    case 'banner':
      return (
        <SvgWrap vb="0 0 100 50">
          <path d="M5,0 L95,0 L100,25 L95,50 L5,50 L0,25Z"
            fill={fill} fillOpacity={opacity} {...commonStroke} />
        </SvgWrap>
      );

    case 'ribbon':
      return (
        <SvgWrap vb="0 0 120 50">
          <path d="M0,10 L15,0 L15,50 L0,40 M15,0 L105,0 L105,50 L15,50 M105,0 L120,10 L120,40 L105,50"
            fill={fill} fillOpacity={opacity} {...commonStroke} />
        </SvgWrap>
      );

    default:
      return <div className="w-full h-full" style={{ backgroundColor: fill, opacity, filter: shadowFilter }} />;
  }
};
