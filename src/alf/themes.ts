import {
  createThemes,
  DEFAULT_PALETTE,
  DEFAULT_SUBDUED_PALETTE,
} from '@bsky.app/alf'

export const M3_EXPRESSIVE_PALETTE = {
  ...DEFAULT_PALETTE,
  contrast_0: '#FAF8FF',
  contrast_25: '#F3F1FA',
  contrast_50: '#ECEAF4',
  contrast_100: '#E1DFEC',
  contrast_200: '#C5C4D4',
  contrast_300: '#A9A8B8',
  contrast_400: '#8E8E9E',
  contrast_500: '#747484',
  contrast_600: '#5B5B6B',
  contrast_700: '#444554',
  contrast_800: '#2E2F3D',
  contrast_900: '#232531',
  contrast_950: '#1B1D27',
  contrast_975: '#14161F',
  contrast_1000: '#0E1017',
  primary_25: '#F6F5FF',
  primary_50: '#E8E9FF',
  primary_100: '#D0D4FF',
  primary_200: '#ACB6FF',
  primary_300: '#8294FF',
  primary_400: '#5873FF',
  primary_500: '#2E54FF',
  primary_600: '#1D41E0',
  primary_700: '#1131B8',
  primary_800: '#09238F',
  primary_900: '#051766',
  primary_950: '#031047',
  primary_975: '#020A30',
}

export const M3_EXPRESSIVE_SUBDUED_PALETTE = {
  ...DEFAULT_SUBDUED_PALETTE,
  contrast_0: '#FAF8FF',
  contrast_25: '#F3F1FA',
  contrast_50: '#ECEAF4',
  contrast_100: '#E1DFEC',
  contrast_200: '#C6C5D6',
  contrast_300: '#ABAAC0',
  contrast_400: '#9090A6',
  contrast_500: '#76768C',
  contrast_600: '#5D5E73',
  contrast_700: '#47485B',
  contrast_800: '#353647',
  contrast_900: '#282938',
  contrast_950: '#20212E',
  contrast_975: '#191A25',
  contrast_1000: '#13141D',
  primary_25: '#F6F5FF',
  primary_50: '#ECECFF',
  primary_100: '#D6D9FF',
  primary_200: '#B2BAFF',
  primary_300: '#8999FF',
  primary_400: '#5F79FF',
  primary_500: '#375BFF',
  primary_600: '#2447E5',
  primary_700: '#1636BD',
  primary_800: '#0D2894',
  primary_900: '#081B6B',
  primary_950: '#05134D',
  primary_975: '#030C36',
}

const DEFAULT_THEMES = createThemes({
  defaultPalette: M3_EXPRESSIVE_PALETTE,
  subduedPalette: M3_EXPRESSIVE_SUBDUED_PALETTE,
})

export const themes = {
  lightPalette: DEFAULT_THEMES.light.palette,
  darkPalette: DEFAULT_THEMES.dark.palette,
  dimPalette: DEFAULT_THEMES.dim.palette,
  light: DEFAULT_THEMES.light,
  dark: DEFAULT_THEMES.dark,
  dim: DEFAULT_THEMES.dim,
}

/**
 * @deprecated use ALF and access palette from `useTheme()`
 */
export const lightPalette = DEFAULT_THEMES.light.palette
/**
 * @deprecated use ALF and access palette from `useTheme()`
 */
export const darkPalette = DEFAULT_THEMES.dark.palette
/**
 * @deprecated use ALF and access palette from `useTheme()`
 */
export const dimPalette = DEFAULT_THEMES.dim.palette
/**
 * @deprecated use ALF and access theme from `useTheme()`
 */
export const light = DEFAULT_THEMES.light
/**
 * @deprecated use ALF and access theme from `useTheme()`
 */
export const dark = DEFAULT_THEMES.dark
/**
 * @deprecated use ALF and access theme from `useTheme()`
 */
export const dim = DEFAULT_THEMES.dim
