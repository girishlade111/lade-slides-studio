export interface PresentationThemeColors {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
}

export interface GradientDef {
  stops: { color: string; position: number }[];
  angle: number;
}

export interface PresentationTheme {
  id: string;
  name: string;
  category: 'built-in' | 'custom';
  colors: PresentationThemeColors;
  fonts: {
    heading: string;
    body: string;
  };
  gradients: {
    primary: GradientDef;
    secondary: GradientDef;
  };
}

export const BUILT_IN_THEMES: PresentationTheme[] = [
  {
    id: 'modern-dark',
    name: 'Modern Dark',
    category: 'built-in',
    colors: { background: '#1e293b', surface: '#334155', primary: '#06b6d4', secondary: '#0f172a', accent: '#22d3ee', textPrimary: '#f1f5f9', textSecondary: '#94a3b8' },
    fonts: { heading: 'Inter', body: 'Inter' },
    gradients: {
      primary: { stops: [{ color: '#06b6d4', position: 0 }, { color: '#0891b2', position: 100 }], angle: 135 },
      secondary: { stops: [{ color: '#1e293b', position: 0 }, { color: '#0f172a', position: 100 }], angle: 180 },
    },
  },
  {
    id: 'professional-light',
    name: 'Professional Light',
    category: 'built-in',
    colors: { background: '#ffffff', surface: '#f0fdfa', primary: '#0d9488', secondary: '#ccfbf1', accent: '#14b8a6', textPrimary: '#1f2937', textSecondary: '#6b7280' },
    fonts: { heading: 'Inter', body: 'Inter' },
    gradients: {
      primary: { stops: [{ color: '#0d9488', position: 0 }, { color: '#14b8a6', position: 100 }], angle: 135 },
      secondary: { stops: [{ color: '#f0fdfa', position: 0 }, { color: '#ccfbf1', position: 100 }], angle: 180 },
    },
  },
  {
    id: 'vibrant-gradient',
    name: 'Vibrant Gradient',
    category: 'built-in',
    colors: { background: '#faf5ff', surface: '#f3e8ff', primary: '#a855f7', secondary: '#ec4899', accent: '#d946ef', textPrimary: '#1e1b4b', textSecondary: '#6b21a8' },
    fonts: { heading: 'Inter', body: 'Inter' },
    gradients: {
      primary: { stops: [{ color: '#a855f7', position: 0 }, { color: '#ec4899', position: 100 }], angle: 135 },
      secondary: { stops: [{ color: '#faf5ff', position: 0 }, { color: '#fdf2f8', position: 100 }], angle: 180 },
    },
  },
  {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    category: 'built-in',
    colors: { background: '#ffffff', surface: '#dbeafe', primary: '#1e40af', secondary: '#3b82f6', accent: '#60a5fa', textPrimary: '#1e3a5f', textSecondary: '#64748b' },
    fonts: { heading: 'Calibri', body: 'Calibri' },
    gradients: {
      primary: { stops: [{ color: '#1e40af', position: 0 }, { color: '#3b82f6', position: 100 }], angle: 135 },
      secondary: { stops: [{ color: '#dbeafe', position: 0 }, { color: '#eff6ff', position: 100 }], angle: 180 },
    },
  },
  {
    id: 'minimal-white',
    name: 'Minimal White',
    category: 'built-in',
    colors: { background: '#ffffff', surface: '#f4f4f5', primary: '#18181b', secondary: '#a1a1aa', accent: '#71717a', textPrimary: '#09090b', textSecondary: '#52525b' },
    fonts: { heading: 'Georgia', body: 'Inter' },
    gradients: {
      primary: { stops: [{ color: '#18181b', position: 0 }, { color: '#3f3f46', position: 100 }], angle: 135 },
      secondary: { stops: [{ color: '#f4f4f5', position: 0 }, { color: '#e4e4e7', position: 100 }], angle: 180 },
    },
  },
  {
    id: 'nature-green',
    name: 'Nature Green',
    category: 'built-in',
    colors: { background: '#f0fdf4', surface: '#dcfce7', primary: '#16a34a', secondary: '#22c55e', accent: '#4ade80', textPrimary: '#14532d', textSecondary: '#166534' },
    fonts: { heading: 'Georgia', body: 'Inter' },
    gradients: {
      primary: { stops: [{ color: '#16a34a', position: 0 }, { color: '#22c55e', position: 100 }], angle: 135 },
      secondary: { stops: [{ color: '#f0fdf4', position: 0 }, { color: '#dcfce7', position: 100 }], angle: 180 },
    },
  },
  {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    category: 'built-in',
    colors: { background: '#fffbeb', surface: '#fff7ed', primary: '#ea580c', secondary: '#f97316', accent: '#fb923c', textPrimary: '#7c2d12', textSecondary: '#9a3412' },
    fonts: { heading: 'Inter', body: 'Inter' },
    gradients: {
      primary: { stops: [{ color: '#ea580c', position: 0 }, { color: '#f97316', position: 100 }], angle: 135 },
      secondary: { stops: [{ color: '#fffbeb', position: 0 }, { color: '#fff7ed', position: 100 }], angle: 180 },
    },
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    category: 'built-in',
    colors: { background: '#f0f9ff', surface: '#e0f2fe', primary: '#0369a1', secondary: '#0ea5e9', accent: '#38bdf8', textPrimary: '#0c4a6e', textSecondary: '#075985' },
    fonts: { heading: 'Inter', body: 'Inter' },
    gradients: {
      primary: { stops: [{ color: '#0369a1', position: 0 }, { color: '#0ea5e9', position: 100 }], angle: 135 },
      secondary: { stops: [{ color: '#f0f9ff', position: 0 }, { color: '#e0f2fe', position: 100 }], angle: 180 },
    },
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    category: 'built-in',
    colors: { background: '#faf5ff', surface: '#f3e8ff', primary: '#7e22ce', secondary: '#a855f7', accent: '#c084fc', textPrimary: '#3b0764', textSecondary: '#581c87' },
    fonts: { heading: 'Georgia', body: 'Inter' },
    gradients: {
      primary: { stops: [{ color: '#7e22ce', position: 0 }, { color: '#a855f7', position: 100 }], angle: 135 },
      secondary: { stops: [{ color: '#faf5ff', position: 0 }, { color: '#f3e8ff', position: 100 }], angle: 180 },
    },
  },
  {
    id: 'tech-gray',
    name: 'Tech Gray',
    category: 'built-in',
    colors: { background: '#f9fafb', surface: '#f3f4f6', primary: '#374151', secondary: '#6b7280', accent: '#9ca3af', textPrimary: '#111827', textSecondary: '#374151' },
    fonts: { heading: 'Inter', body: 'Inter' },
    gradients: {
      primary: { stops: [{ color: '#374151', position: 0 }, { color: '#4b5563', position: 100 }], angle: 135 },
      secondary: { stops: [{ color: '#f9fafb', position: 0 }, { color: '#f3f4f6', position: 100 }], angle: 180 },
    },
  },
];

const CUSTOM_THEMES_KEY = 'lade-custom-themes';

export function loadCustomThemes(): PresentationTheme[] {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_THEMES_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveCustomThemes(themes: PresentationTheme[]) {
  localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(themes));
}

export function createDefaultCustomTheme(): PresentationTheme {
  return {
    id: crypto.randomUUID(),
    name: 'My Custom Theme',
    category: 'custom',
    colors: {
      background: '#ffffff',
      surface: '#f3f4f6',
      primary: '#3b82f6',
      secondary: '#6366f1',
      accent: '#8b5cf6',
      textPrimary: '#111827',
      textSecondary: '#6b7280',
    },
    fonts: { heading: 'Inter', body: 'Inter' },
    gradients: {
      primary: { stops: [{ color: '#3b82f6', position: 0 }, { color: '#6366f1', position: 100 }], angle: 135 },
      secondary: { stops: [{ color: '#ffffff', position: 0 }, { color: '#f3f4f6', position: 100 }], angle: 180 },
    },
  };
}
