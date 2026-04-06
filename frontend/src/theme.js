/**
 * Habitopia Design System — Cyber System Dashboard
 * Terminal/RPG-inspired. Sharp edges. High contrast. Neon accents.
 */

export const colors = {
  background: '#0D0D0D',
  surface: '#111111',
  surfaceContainer: '#1A1A1A',
  surfaceContainerHigh: '#222222',
  surfaceContainerHighest: '#2A2A2A',
  surfaceContainerLow: '#141414',
  surfaceContainerLowest: '#0A0A0A',
  surfaceBright: '#333333',

  primary: '#dcb8ff',
  primaryContainer: '#8a2be2',
  primaryDim: '#b388ff',

  secondary: '#4ce346',
  secondaryContainer: '#04b71a',
  secondaryDim: '#32CD32',

  tertiary: '#e0c700',
  tertiaryContainer: '#c1ac00',

  onSurface: '#e5e2e1',
  onSurfaceVariant: '#706e6e',
  onPrimary: '#ffffff',
  onSecondary: '#000000',

  outline: '#3a3a3a',
  outlineVariant: '#2a2a2a',
  surfaceVariant: '#1e1e1e',

  error: '#ff4457',
  errorContainer: '#2d1114',
  warning: '#ff6b35',

  inverseSurface: '#e5e2e1',
};

export const fonts = {
  headline: 'SpaceGrotesk_700Bold',
  headlineMedium: 'SpaceGrotesk_500Medium',
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemiBold: 'PlusJakartaSans_600SemiBold',
  label: 'SpaceGrotesk_500Medium',
};

export const spacing = {
  xs: 3,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  xxxl: 36,
};

export const shape = {
  radius: 0,
  borderWidth: 1,
  borderWidthThick: 2,
};

export const glow = {
  green: {
    shadowColor: '#4ce346',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  purple: {
    shadowColor: '#8a2be2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
};

export default { colors, fonts, spacing, shape, glow };
