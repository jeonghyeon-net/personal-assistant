export const theme = {
  colors: {
    bg: {
      primary: 'rgba(30, 30, 30, 0.95)',
      secondary: 'rgba(40, 40, 40, 0.9)',
      tertiary: 'rgba(50, 50, 50, 0.8)',
      active: 'rgba(60, 60, 60, 0.8)',
      hover: 'rgba(255, 255, 255, 0.05)',
      user: 'rgba(99, 102, 241, 0.15)',
      assistant: 'transparent',
    },
    text: {
      primary: 'rgba(255, 255, 255, 0.95)',
      secondary: 'rgba(255, 255, 255, 0.7)',
      muted: 'rgba(255, 255, 255, 0.4)',
    },
    accent: {
      primary: '#6366f1',
      secondary: '#818cf8',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    },
    border: 'rgba(255, 255, 255, 0.1)',
    semantic: {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  },
  fontSize: {
    xs: '11px',
    sm: '12px',
    base: '13px',
    lg: '15px',
    xl: '18px',
  },
  lineHeight: {
    tight: '1.3',
    normal: '1.5',
    relaxed: '1.7',
  },
  borderRadius: {
    sm: '6px',
    md: '10px',
    lg: '14px',
    full: '9999px',
  },
  fonts: {
    sans: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
    mono: '"SF Mono", "Monaco", "Menlo", monospace',
  },
}

export type Theme = typeof theme
