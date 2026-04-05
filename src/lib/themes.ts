// Terminal Theme System

export interface TerminalTheme {
  id: string;
  name: string;
  description: string;
  colors: {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    accent: string;
    muted: string;
    mutedForeground: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    glow: string;
  };
}

export const themes: Record<string, TerminalTheme> = {
  matrix: {
    id: 'matrix',
    name: 'Matrix Green',
    description: 'Classic green phosphor terminal',
    colors: {
      background: '220 20% 4%',
      foreground: '142 70% 65%',
      primary: '142 70% 55%',
      secondary: '180 60% 50%',
      accent: '180 70% 55%',
      muted: '220 15% 12%',
      mutedForeground: '142 40% 45%',
      error: '0 70% 55%',
      success: '142 70% 55%',
      warning: '45 90% 55%',
      info: '200 80% 60%',
      glow: '142 70% 55%',
    },
  },
  
  dracula: {
    id: 'dracula',
    name: 'Dracula',
    description: 'Dark theme with purple accents',
    colors: {
      background: '231 15% 13%',
      foreground: '60 30% 96%',
      primary: '265 89% 78%',
      secondary: '135 94% 65%',
      accent: '191 97% 77%',
      muted: '231 15% 18%',
      mutedForeground: '225 14% 65%',
      error: '0 100% 67%',
      success: '135 94% 65%',
      warning: '65 92% 76%',
      info: '191 97% 77%',
      glow: '265 89% 78%',
    },
  },
  
  solarized: {
    id: 'solarized',
    name: 'Solarized Dark',
    description: 'Precision colors for machines and people',
    colors: {
      background: '192 100% 5%',
      foreground: '186 8% 55%',
      primary: '175 59% 40%',
      secondary: '68 100% 30%',
      accent: '205 82% 43%',
      muted: '192 100% 8%',
      mutedForeground: '194 14% 40%',
      error: '1 71% 52%',
      success: '68 100% 30%',
      warning: '45 100% 35%',
      info: '205 82% 43%',
      glow: '175 59% 40%',
    },
  },
  
  monokai: {
    id: 'monokai',
    name: 'Monokai',
    description: 'Sublime Text inspired colors',
    colors: {
      background: '70 8% 15%',
      foreground: '60 30% 96%',
      primary: '80 76% 53%',
      secondary: '338 95% 56%',
      accent: '190 81% 67%',
      muted: '70 8% 20%',
      mutedForeground: '60 10% 60%',
      error: '338 95% 56%',
      success: '80 76% 53%',
      warning: '54 70% 68%',
      info: '190 81% 67%',
      glow: '80 76% 53%',
    },
  },
  
  nord: {
    id: 'nord',
    name: 'Nord',
    description: 'Arctic, north-bluish color palette',
    colors: {
      background: '220 16% 16%',
      foreground: '218 27% 88%',
      primary: '193 43% 67%',
      secondary: '179 25% 65%',
      accent: '210 34% 63%',
      muted: '220 16% 22%',
      mutedForeground: '219 28% 60%',
      error: '354 42% 56%',
      success: '92 28% 65%',
      warning: '40 71% 73%',
      info: '210 34% 63%',
      glow: '193 43% 67%',
    },
  },
  
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Neon lights in the night city',
    colors: {
      background: '270 50% 5%',
      foreground: '300 100% 80%',
      primary: '300 100% 60%',
      secondary: '180 100% 50%',
      accent: '60 100% 50%',
      muted: '270 30% 12%',
      mutedForeground: '280 50% 50%',
      error: '350 100% 60%',
      success: '180 100% 50%',
      warning: '60 100% 50%',
      info: '200 100% 60%',
      glow: '300 100% 60%',
    },
  },
  
  retro: {
    id: 'retro',
    name: 'Retro Amber',
    description: 'Classic amber phosphor monitor',
    colors: {
      background: '30 20% 5%',
      foreground: '35 100% 60%',
      primary: '35 100% 50%',
      secondary: '25 100% 55%',
      accent: '45 100% 55%',
      muted: '30 15% 12%',
      mutedForeground: '35 60% 40%',
      error: '0 80% 50%',
      success: '35 100% 50%',
      warning: '50 100% 50%',
      info: '45 90% 55%',
      glow: '35 100% 50%',
    },
  },
  
  ocean: {
    id: 'ocean',
    name: 'Ocean Blue',
    description: 'Deep sea tranquility',
    colors: {
      background: '210 50% 6%',
      foreground: '200 60% 70%',
      primary: '200 80% 55%',
      secondary: '170 60% 50%',
      accent: '190 100% 60%',
      muted: '210 40% 12%',
      mutedForeground: '200 40% 45%',
      error: '350 80% 55%',
      success: '150 70% 50%',
      warning: '40 90% 55%',
      info: '190 80% 60%',
      glow: '200 80% 55%',
    },
  },
  
  hackerman: {
    id: 'hackerman',
    name: 'Hackerman',
    description: 'l33t h4ck3r vibes',
    colors: {
      background: '0 0% 2%',
      foreground: '120 100% 50%',
      primary: '120 100% 40%',
      secondary: '120 80% 35%',
      accent: '120 100% 50%',
      muted: '0 0% 8%',
      mutedForeground: '120 50% 30%',
      error: '0 100% 50%',
      success: '120 100% 40%',
      warning: '60 100% 50%',
      info: '180 100% 40%',
      glow: '120 100% 50%',
    },
  },
  
  gruvbox: {
    id: 'gruvbox',
    name: 'Gruvbox Dark',
    description: 'Retro groove color scheme',
    colors: {
      background: '0 0% 16%',
      foreground: '49 85% 82%',
      primary: '27 99% 55%',
      secondary: '104 35% 62%',
      accent: '61 66% 44%',
      muted: '0 0% 22%',
      mutedForeground: '40 16% 55%',
      error: '6 96% 59%',
      success: '104 35% 62%',
      warning: '40 73% 49%',
      info: '217 32% 60%',
      glow: '27 99% 55%',
    },
  },
  
  strangerthings: {
    id: 'strangerthings',
    name: 'Stranger Things',
    description: 'The Upside Down awaits...',
    colors: {
      background: '0 0% 3%',           // Near black like the Upside Down
      foreground: '0 85% 55%',         // Neon red text
      primary: '0 100% 45%',           // Deep blood red
      secondary: '350 90% 40%',        // Dark crimson
      accent: '0 100% 60%',            // Bright neon red
      muted: '0 30% 8%',               // Dark maroon
      mutedForeground: '0 50% 35%',    // Muted red
      error: '0 100% 50%',             // Bright red
      success: '60 80% 50%',           // Christmas light yellow
      warning: '30 100% 50%',          // Orange (like Christmas lights)
      info: '200 80% 55%',             // Blue Christmas light
      glow: '0 100% 50%',              // Red glow
    },
  },
};

const THEME_STORAGE_KEY = 'cos-alpha-theme';

export const getStoredTheme = (): string => {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || 'matrix';
  } catch {
    return 'matrix';
  }
};

export const setStoredTheme = (themeId: string): void => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  } catch (e) {
    console.error('Failed to save theme:', e);
  }
};

export const applyTheme = (themeId: string): boolean => {
  const theme = themes[themeId];
  if (!theme) return false;
  
  const root = document.documentElement;
  const body = document.body;
  const { colors } = theme;
  
  // Remove all theme classes
  Object.keys(themes).forEach(id => {
    body.classList.remove(`theme-${id}`);
  });
  
  // Add current theme class
  body.classList.add(`theme-${themeId}`);
  
  // Apply CSS custom properties
  root.style.setProperty('--background', colors.background);
  root.style.setProperty('--foreground', colors.foreground);
  root.style.setProperty('--primary', colors.primary);
  root.style.setProperty('--primary-foreground', colors.background);
  root.style.setProperty('--secondary', colors.secondary);
  root.style.setProperty('--secondary-foreground', colors.background);
  root.style.setProperty('--accent', colors.accent);
  root.style.setProperty('--accent-foreground', colors.background);
  root.style.setProperty('--muted', colors.muted);
  root.style.setProperty('--muted-foreground', colors.mutedForeground);
  root.style.setProperty('--card', colors.background);
  root.style.setProperty('--card-foreground', colors.foreground);
  root.style.setProperty('--popover', colors.background);
  root.style.setProperty('--popover-foreground', colors.foreground);
  root.style.setProperty('--border', colors.primary.replace(/\d+%$/, '20%'));
  root.style.setProperty('--ring', colors.primary);
  
  // Terminal-specific colors
  root.style.setProperty('--terminal-bg', colors.background);
  root.style.setProperty('--terminal-text', colors.foreground);
  root.style.setProperty('--terminal-prompt', colors.accent);
  root.style.setProperty('--terminal-error', colors.error);
  root.style.setProperty('--terminal-success', colors.success);
  root.style.setProperty('--terminal-warning', colors.warning);
  root.style.setProperty('--terminal-info', colors.info);
  root.style.setProperty('--terminal-glow', colors.glow);
  
  setStoredTheme(themeId);
  return true;
};

export const getThemeList = (): string => {
  const currentTheme = getStoredTheme();
  
  let output = `
╔══════════════════════════════════════════════════════════════╗
║                    AVAILABLE THEMES                           ║
╠══════════════════════════════════════════════════════════════╣\n`;
  
  Object.values(themes).forEach(theme => {
    const marker = theme.id === currentTheme ? '→' : ' ';
    const status = theme.id === currentTheme ? '(active)' : '';
    output += `║  ${marker} ${theme.name.padEnd(18)} ${theme.description.padEnd(30)} ${status.padEnd(8)}║\n`;
  });
  
  output += `╠══════════════════════════════════════════════════════════════╣
║  Usage: theme <name>   Example: theme dracula                 ║
╚══════════════════════════════════════════════════════════════╝`;
  
  return output;
};
