import { AccentTheme } from '../types/playlist';

const THEME_STORAGE_KEY = 'm3u_file_accent_theme';

export function getSavedTheme(): AccentTheme {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 'cyan';
  }
  const saved = localStorage.getItem(THEME_STORAGE_KEY) as AccentTheme;
  if (saved === 'cyan' || saved === 'purple' || saved === 'emerald') {
    return saved;
  }
  return 'cyan';
}

export function saveTheme(theme: AccentTheme): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.setAttribute('data-accent-theme', theme);
  } catch (err) {
    console.error('Failed to save theme:', err);
  }
}

export interface ThemeColors {
  name: string;
  primary: string;
  textAccent: string;
  textMuted: string;
  borderAccent: string;
  borderGlow: string;
  bgSubtle: string;
  gradientButton: string;
  shadowGlow: string;
  badgeActive: string;
}

export const THEME_CONFIG: Record<AccentTheme, ThemeColors> = {
  cyan: {
    name: 'Cyber Cyan',
    primary: '#06b6d4',
    textAccent: 'text-cyan-400',
    textMuted: 'text-cyan-300',
    borderAccent: 'border-cyan-500/40',
    borderGlow: 'border-cyan-500/60',
    bgSubtle: 'bg-cyan-500/10',
    gradientButton: 'bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500',
    shadowGlow: 'shadow-cyan-500/25',
    badgeActive: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40',
  },
  purple: {
    name: 'Neon Violet',
    primary: '#a855f7',
    textAccent: 'text-purple-400',
    textMuted: 'text-purple-300',
    borderAccent: 'border-purple-500/40',
    borderGlow: 'border-purple-500/60',
    bgSubtle: 'bg-purple-500/10',
    gradientButton: 'bg-gradient-to-r from-purple-500 via-violet-400 to-indigo-600 hover:from-purple-400 hover:to-indigo-500',
    shadowGlow: 'shadow-purple-500/25',
    badgeActive: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
  },
  emerald: {
    name: 'Matrix Emerald',
    primary: '#10b981',
    textAccent: 'text-emerald-400',
    textMuted: 'text-emerald-300',
    borderAccent: 'border-emerald-500/40',
    borderGlow: 'border-emerald-500/60',
    bgSubtle: 'bg-emerald-500/10',
    gradientButton: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500',
    shadowGlow: 'shadow-emerald-500/25',
    badgeActive: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
  },
};
