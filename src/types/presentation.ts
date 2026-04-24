export type ObjectType = 'text' | 'shape' | 'image' | 'table' | 'chart';

export interface ConditionalFormatRule {
  range: string;
  condition: 'greater' | 'less' | 'equal' | 'between';
  value: string;
  secondaryValue?: string; // For 'between'
  style: {
    backgroundColor?: string;
    textColor?: string;
  };
}

export interface ChartProperties {
  type: 'bar' | 'pie' | 'line';
  sourceTableId: string;
  dataRange: string;
  title: string;
  showLegend: boolean;
  colors?: string[];
}

export type ShapeType =
  | 'rectangle' | 'rounded-rectangle' | 'circle' | 'triangle' | 'diamond'
  | 'pentagon' | 'hexagon' | 'octagon' | 'star' | 'heart' | 'cloud'
  | 'arrow' | 'arrow-left' | 'arrow-up' | 'arrow-down' | 'double-arrow' | 'curved-arrow'
  | 'line' | 'connector' | 'elbow-connector'
  | 'process' | 'decision' | 'start-end' | 'document' | 'database' | 'manual-input'
  | 'speech-bubble' | 'thought-bubble' | 'rect-callout' | 'banner' | 'ribbon';
export type TransitionType = 'none' | 'fade' | 'slide' | 'push' | 'wipe' | 'zoom' | 'rotate' | 'flip' | 'cube' | 'curtain';
export type TransitionDirection = 'left' | 'right' | 'up' | 'down' | 'in' | 'out' | 'horizontal' | 'vertical' | 'open' | 'close';
export type EasingType = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
export type AnimationType = 'none' | 'fade-in' | 'fly-in' | 'zoom-in' | 'fade-out' | 'fly-out' | 'pulse' | 'shake';

export type AnimationCategory = 'entrance' | 'emphasis' | 'exit';
export type AnimationEffect =
  | 'fadeIn' | 'flyIn' | 'zoomIn' | 'bounceIn' | 'rotateIn' | 'wipeIn' | 'slideIn' | 'growIn'
  | 'pulse' | 'shake' | 'spin' | 'bounce' | 'colorFlash' | 'growShrink' | 'teeter'
  | 'fadeOut' | 'flyOut' | 'zoomOut' | 'collapse' | 'rotateOut' | 'wipeOut' | 'slideOut';
export type AnimationTrigger = 'onClick' | 'withPrevious' | 'afterPrevious' | 'auto';

export interface ObjectAnimation {
  id: string;
  type: AnimationCategory;
  effect: AnimationEffect;
  direction?: TransitionDirection;
  startTrigger: AnimationTrigger;
  delay: number;
  duration: number;
  easing: EasingType;
  repeat: number; // 0 = infinite loop
  order: number;
}

export interface Position { x: number; y: number; }
export interface Size { width: number; height: number; }

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

export interface ShapeShadow {
  enabled: boolean;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

export interface ShapeProperties {
  shapeType: ShapeType;
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  borderRadius: number;
  shadow: ShapeShadow;
}

export interface ImageFilters {
  grayscale: number;
  sepia: number;
  blur: number;
  brightness: number;
  contrast: number;
  saturation: number;
}

export interface ImageBorder {
  enabled: boolean;
  color: string;
  width: number;
}

export interface ImageShadow {
  enabled: boolean;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

export interface ImageProperties {
  src: string;
  originalSrc: string;
  objectFit: 'cover' | 'contain' | 'fill';
  opacity: number;
  filters: ImageFilters;
  border: ImageBorder;
  shadow: ImageShadow;
  cornerRadius: number;
  flipH: boolean;
  flipV: boolean;
}

export interface CellBorder {
  color: string;
  width: number;
  style: 'solid' | 'dashed' | 'dotted' | 'none';
}

export interface TableCell {
  id: string;
  content: string;
  formula?: string;
  computedValue?: string;
  dataFormat?: 'general' | 'currency' | 'percentage' | 'date';
  validationType?: 'none' | 'dropdown' | 'checkbox';
  validationOptions?: string[];
  rowSpan: number;
  colSpan: number;
  merged?: boolean;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline' | 'line-through';
  textColor: string;
  backgroundColor: string;
  textAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
  borderTop: CellBorder;
  borderRight: CellBorder;
  borderBottom: CellBorder;
  borderLeft: CellBorder;
}

export interface TableProperties {
  rows: number;
  columns: number;
  cells: TableCell[][];
  columnWidths: number[];
  rowHeights: number[];
  headerRow: boolean;
  bandedRows: boolean;
  bandedRowColor: string;
  headerBackgroundColor: string;
  headerTextColor: string;
  defaultFontFamily: string;
  defaultFontSize: number;
  frozenRows?: number;
  frozenCols?: number;
  conditionalFormatting?: ConditionalFormatRule[];
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
  animations?: ObjectAnimation[];
  textProps?: TextProperties;
  shapeProps?: ShapeProperties;
  imageProps?: ImageProperties;
  tableProps?: TableProperties;
}

export interface GradientStop {
  color: string;
  position: number; // 0-100
}

export interface SlideBackground {
  type: 'color' | 'gradient' | 'image' | 'pattern' | 'texture';
  value: string;
  secondaryValue?: string;
  gradientDirection?: string;
  // Enhanced gradient
  gradient?: {
    type: 'linear' | 'radial' | 'diagonal-lr' | 'diagonal-rl';
    stops: GradientStop[];
    angle: number;
  };
  // Image background
  image?: {
    src: string;
    fit: 'fill' | 'fit' | 'stretch' | 'tile' | 'center';
    opacity: number;
    blur: number;
  };
  // Pattern background
  pattern?: {
    type: 'dots' | 'grid' | 'diagonal-stripes' | 'horizontal-stripes' | 'vertical-stripes' | 'checkerboard' | 'hexagons' | 'triangles';
    color: string;
    backgroundColor: string;
    scale: number;
  };
  // Texture background
  texture?: {
    type: 'paper' | 'canvas' | 'fabric' | 'wood' | 'marble' | 'concrete' | 'leather';
    opacity: number;
    tint: string;
  };
}

export interface SlideTransition {
  type: TransitionType;
  direction: TransitionDirection;
  duration: number;
  easing: EasingType;
  sound: boolean;
}

export interface Slide {
  id: string;
  order: number;
  background: SlideBackground;
  objects: SlideObject[];
  transition: SlideTransition;
  notes: string;
}

export interface ThemeColors { primary: string; secondary: string; background: string; text: string; accent: string; }
export interface Theme { id: string; name: string; colors: ThemeColors; fontFamily: string; }

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
  'Franklin Gothic Medium', 'Gill Sans', 'Segoe UI', 'Lucida Sans',
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

// Collaboration types
export interface CommentReply {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface SlideComment {
  id: string;
  slideId: string;
  objectId: string | null;
  author: string;
  authorColor: string;
  text: string;
  createdAt: string;
  resolved: boolean;
  replies: CommentReply[];
}

export type ActivityType =
  | 'slide_added' | 'slide_deleted' | 'slide_duplicated'
  | 'object_added' | 'object_modified' | 'object_deleted'
  | 'background_changed' | 'theme_applied'
  | 'comment_added' | 'comment_resolved'
  | 'export_performed' | 'presentation_saved' | 'version_restored';

export interface ActivityEntry {
  id: string;
  presentationId: string;
  type: ActivityType;
  description: string;
  author: string;
  timestamp: string;
  undoable: boolean;
}

export interface VersionSnapshot {
  id: string;
  presentationId: string;
  createdAt: string;
  type: 'auto' | 'manual';
  snapshot: Presentation;
  changesSummary: {
    slidesAdded: number;
    slidesDeleted: number;
    objectsModified: number;
  };
}

// Master Slide Types
export type PlaceholderType = 'title' | 'content' | 'subtitle' | 'footer' | 'number' | 'image' | 'caption';

export interface MasterPlaceholder {
  id: string;
  type: PlaceholderType;
  x: number;
  y: number;
  width: number;
  height: number;
  defaultText: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  align: 'left' | 'center' | 'right';
  fontWeight: number;
}

export type MasterLayoutName =
  | 'Title Slide'
  | 'Title and Content'
  | 'Section Header'
  | 'Two Content'
  | 'Comparison'
  | 'Blank'
  | 'Title Only'
  | 'Content with Caption'
  | 'Picture with Caption';

export interface MasterLayout {
  id: string;
  name: MasterLayoutName;
  placeholders: MasterPlaceholder[];
  background: SlideBackground;
}

export interface MasterSlide {
  id: string;
  name: string;
  layouts: MasterLayout[];
  theme: ThemeColors;
  fontFamily: string;
}

export const PRESET_COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#1e293b',
  '#fef2f2', '#fff7ed', '#fefce8', '#f0fdf4', '#ecfeff', '#eff6ff',
  '#f5f3ff', '#fdf2f8', '#f9fafb', '#f1f5f9',
];

/** All shape categories for the shape picker */
export const SHAPE_CATEGORIES = [
  {
    label: 'Basic Shapes',
    shapes: [
      { type: 'rectangle' as ShapeType, label: 'Rectangle' },
      { type: 'rounded-rectangle' as ShapeType, label: 'Rounded Rectangle' },
      { type: 'circle' as ShapeType, label: 'Ellipse' },
      { type: 'triangle' as ShapeType, label: 'Triangle' },
      { type: 'diamond' as ShapeType, label: 'Diamond' },
      { type: 'pentagon' as ShapeType, label: 'Pentagon' },
      { type: 'hexagon' as ShapeType, label: 'Hexagon' },
      { type: 'octagon' as ShapeType, label: 'Octagon' },
      { type: 'star' as ShapeType, label: 'Star' },
      { type: 'heart' as ShapeType, label: 'Heart' },
      { type: 'cloud' as ShapeType, label: 'Cloud' },
    ],
  },
  {
    label: 'Arrows & Lines',
    shapes: [
      { type: 'arrow' as ShapeType, label: 'Arrow Right' },
      { type: 'arrow-left' as ShapeType, label: 'Arrow Left' },
      { type: 'arrow-up' as ShapeType, label: 'Arrow Up' },
      { type: 'arrow-down' as ShapeType, label: 'Arrow Down' },
      { type: 'double-arrow' as ShapeType, label: 'Double Arrow' },
      { type: 'curved-arrow' as ShapeType, label: 'Curved Arrow' },
      { type: 'line' as ShapeType, label: 'Line' },
      { type: 'connector' as ShapeType, label: 'Connector' },
    ],
  },
  {
    label: 'Flowchart',
    shapes: [
      { type: 'process' as ShapeType, label: 'Process' },
      { type: 'decision' as ShapeType, label: 'Decision' },
      { type: 'start-end' as ShapeType, label: 'Start/End' },
      { type: 'document' as ShapeType, label: 'Document' },
      { type: 'database' as ShapeType, label: 'Database' },
      { type: 'manual-input' as ShapeType, label: 'Manual Input' },
    ],
  },
  {
    label: 'Callouts & Banners',
    shapes: [
      { type: 'speech-bubble' as ShapeType, label: 'Speech Bubble' },
      { type: 'thought-bubble' as ShapeType, label: 'Thought Bubble' },
      { type: 'rect-callout' as ShapeType, label: 'Callout' },
      { type: 'banner' as ShapeType, label: 'Banner' },
      { type: 'ribbon' as ShapeType, label: 'Ribbon' },
    ],
  },
];
