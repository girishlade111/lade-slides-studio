export type ObjectType = 'text' | 'shape' | 'image';
export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'arrow' | 'star' | 'pentagon' | 'hexagon' | 'line';
export type TransitionType = 'none' | 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down' | 'zoom' | 'flip';
export type AnimationType = 'none' | 'fade-in' | 'fly-in' | 'zoom-in' | 'fade-out' | 'fly-out' | 'pulse' | 'shake';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface TextProperties {
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline' | 'line-through';
  color: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number;
  backgroundColor: string;
}

export interface ShapeProperties {
  shapeType: ShapeType;
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
  borderRadius: number;
}

export interface ImageProperties {
  src: string;
  objectFit: 'cover' | 'contain' | 'fill';
  filter: string;
  opacity: number;
}

export interface SlideObject {
  id: string;
  type: ObjectType;
  position: Position;
  size: Size;
  rotation: number;
  zIndex: number;
  locked: boolean;
  animation: AnimationType;
  textProps?: TextProperties;
  shapeProps?: ShapeProperties;
  imageProps?: ImageProperties;
}

export interface SlideBackground {
  type: 'color' | 'gradient' | 'image';
  value: string;
  secondaryValue?: string;
  gradientDirection?: string;
}

export interface SlideTransition {
  type: TransitionType;
  duration: number;
}

export interface Slide {
  id: string;
  order: number;
  background: SlideBackground;
  objects: SlideObject[];
  transition: SlideTransition;
  notes: string;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
  fontFamily: string;
}

export interface Presentation {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  theme: string;
  slideWidth: number;
  slideHeight: number;
  slides: Slide[];
}

export const FONTS = [
  'Inter', 'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
  'Trebuchet MS', 'Palatino Linotype', 'Garamond', 'Comic Sans MS',
  'Impact', 'Lucida Console', 'Tahoma', 'Century Gothic',
  'Bookman Old Style', 'Calibri', 'Cambria', 'Candara',
  'Franklin Gothic Medium', 'Gill Sans',
];

export const THEMES: Theme[] = [
  { id: 'modern-dark', name: 'Modern Dark', colors: { primary: '#06b6d4', secondary: '#0f172a', background: '#1e293b', text: '#f1f5f9', accent: '#22d3ee' }, fontFamily: 'Inter' },
  { id: 'light-pro', name: 'Light Professional', colors: { primary: '#0d9488', secondary: '#f0fdfa', background: '#ffffff', text: '#1f2937', accent: '#14b8a6' }, fontFamily: 'Inter' },
  { id: 'vibrant-gradient', name: 'Vibrant Gradient', colors: { primary: '#a855f7', secondary: '#ec4899', background: '#faf5ff', text: '#1e1b4b', accent: '#d946ef' }, fontFamily: 'Inter' },
  { id: 'corporate-blue', name: 'Corporate Blue', colors: { primary: '#1e40af', secondary: '#dbeafe', background: '#ffffff', text: '#1e3a5f', accent: '#3b82f6' }, fontFamily: 'Inter' },
  { id: 'minimal-white', name: 'Minimal White', colors: { primary: '#18181b', secondary: '#f4f4f5', background: '#ffffff', text: '#09090b', accent: '#71717a' }, fontFamily: 'Inter' },
  { id: 'nature-green', name: 'Nature Green', colors: { primary: '#16a34a', secondary: '#dcfce7', background: '#f0fdf4', text: '#14532d', accent: '#22c55e' }, fontFamily: 'Georgia' },
  { id: 'sunset-orange', name: 'Sunset Orange', colors: { primary: '#ea580c', secondary: '#fff7ed', background: '#fffbeb', text: '#7c2d12', accent: '#f97316' }, fontFamily: 'Inter' },
  { id: 'ocean-blue', name: 'Ocean Blue', colors: { primary: '#0369a1', secondary: '#e0f2fe', background: '#f0f9ff', text: '#0c4a6e', accent: '#0ea5e9' }, fontFamily: 'Inter' },
  { id: 'royal-purple', name: 'Royal Purple', colors: { primary: '#7e22ce', secondary: '#faf5ff', background: '#faf5ff', text: '#3b0764', accent: '#c084fc' }, fontFamily: 'Georgia' },
  { id: 'tech-gray', name: 'Tech Gray', colors: { primary: '#374151', secondary: '#f3f4f6', background: '#f9fafb', text: '#111827', accent: '#6b7280' }, fontFamily: 'Inter' },
];

export const PRESET_COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#1e293b',
  '#fef2f2', '#fff7ed', '#fefce8', '#f0fdf4', '#ecfeff', '#eff6ff',
  '#f5f3ff', '#fdf2f8', '#f9fafb', '#f1f5f9',
];
