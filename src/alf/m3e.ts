import {type WithSpringConfig as SpringConfig} from 'react-native-reanimated'
import {type Theme} from '@bsky.app/alf'

function spring(dampingRatio: number, stiffness: number): SpringConfig {
  return {
    mass: 1,
    stiffness,
    damping: dampingRatio * 2 * Math.sqrt(stiffness),
  }
}

export const motion = {
  fastSpatial: spring(0.6, 800),
  defaultSpatial: spring(0.8, 380),
  slowSpatial: spring(0.8, 200),
  fastEffects: spring(1, 3800),
  defaultEffects: spring(1, 1600),
  slowEffects: spring(1, 800),
  standardFastSpatial: spring(0.9, 1400),
}

export const shape = {
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16,
  largeIncreased: 20,
  extraLarge: 28,
  extraLargeIncreased: 32,
  extraExtraLarge: 48,
  full: 999,
}

export const stateLayer = {
  hovered: 0.08,
  focused: 0.1,
  pressed: 0.1,
}

export function colors(t: Theme) {
  const p = t.palette
  const isDark = t.scheme === 'dark'
  return {
    primary: p.primary_500,
    onPrimary: p.white,
    primaryContainer: isDark ? p.primary_300 : p.primary_100,
    onPrimaryContainer: p.primary_900,
    secondaryContainer: isDark ? p.primary_200 : p.primary_100,
    onSecondaryContainer: p.primary_900,
    surface: p.contrast_0,
    surfaceContainerLow: p.contrast_25,
    surfaceContainer: p.contrast_50,
    surfaceContainerHigh: p.contrast_100,
    onSurface: p.contrast_1000,
    onSurfaceVariant: p.contrast_700,
    outlineVariant: p.contrast_100,
    error: p.negative_500,
    onError: p.white,
    inverseSurface: p.contrast_900,
    inverseOnSurface: p.contrast_50,
    inversePrimary: p.primary_200,
    inverseError: p.negative_300,
    scrim: 'rgba(0, 0, 0, 0.32)',
  }
}
