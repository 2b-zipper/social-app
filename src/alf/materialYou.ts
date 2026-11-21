import {type Palette} from '@bsky.app/alf'

import {PlatformInfo} from '../../modules/expo-bluesky-swiss-army'
import {
  createAppThemes,
  M3_EXPRESSIVE_PALETTE,
  M3_EXPRESSIVE_SUBDUED_PALETTE,
  type themes,
} from './themes'
import {
  darken,
  hexToRgb,
  hslToRgb,
  lighten,
  rgbToHex,
  rgbToHsl,
} from './util/colorGeneration'

export type ThemeColorPresetId =
  | 'default'
  | 'gray'
  | 'charcoal'
  | 'slate'
  | 'blue'
  | 'violet'
  | 'rose'
  | 'orange'
  | 'amber'
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'custom'

export type ThemeColorPreset = {
  id: ThemeColorPresetId
  label: string
  hex: string
  monochrome?: boolean
}

export const THEME_COLOR_PRESETS: ThemeColorPreset[] = [
  {id: 'default', label: 'Indigo (M3)', hex: '#2E54FF'},
  {id: 'gray', label: 'Gray', hex: '#737373', monochrome: true},
  {id: 'charcoal', label: 'Warm Gray', hex: '#78716C'},
  {id: 'slate', label: 'Cool Slate', hex: '#64748B'},
  {id: 'blue', label: 'Bluesky Blue', hex: '#006AFF'},
  {id: 'violet', label: 'Violet', hex: '#7C3AED'},
  {id: 'rose', label: 'Rose', hex: '#E11D48'},
  {id: 'orange', label: 'Orange', hex: '#EA580C'},
  {id: 'amber', label: 'Amber', hex: '#D97706'},
  {id: 'emerald', label: 'Emerald', hex: '#059669'},
  {id: 'teal', label: 'Teal', hex: '#0D9488'},
  {id: 'cyan', label: 'Cyan', hex: '#0284C7'},
  {id: 'custom', label: 'Custom', hex: '#64748B'},
]

const TONES = [
  '0',
  '10',
  '50',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
  '1000',
]

const TONE_LIGHTNESS: Record<string, number> = {
  '0': 100,
  '10': 98,
  '50': 95,
  '100': 90,
  '200': 80,
  '300': 70,
  '400': 60,
  '500': 50,
  '600': 40,
  '700': 30,
  '800': 20,
  '900': 11,
  '1000': 0,
}

export function generateAccentFromSeed(
  seedHex: string,
  monochrome = false,
): Record<string, string> {
  const rgb = hexToRgb(seedHex) ?? {r: 115, g: 115, b: 115}
  const {h, s} = rgbToHsl(rgb.r, rgb.g, rgb.b)
  const isMono = monochrome || s < 4

  const accentSat = isMono ? 0 : Math.min(92, Math.max(s, 28))
  const n1Sat = isMono ? 0 : Math.min(s * 0.16, 12)
  const n2Sat = isMono ? 0 : Math.min(s * 0.28, 22)

  const out: Record<string, string> = {}
  for (const tone of TONES) {
    const l = TONE_LIGHTNESS[tone]
    const aRgb = hslToRgb(h, accentSat, l)
    const n1Rgb = hslToRgb(h, n1Sat, l)
    const n2Rgb = hslToRgb(h, n2Sat, l)
    out[tone] = rgbToHex(aRgb.r, aRgb.g, aRgb.b)
    out[`n1_${tone}`] = rgbToHex(n1Rgb.r, n1Rgb.g, n1Rgb.b)
    out[`n2_${tone}`] = rgbToHex(n2Rgb.r, n2Rgb.g, n2Rgb.b)
  }
  return out
}

const SHADES = [
  'primary_25',
  'primary_50',
  'primary_100',
  'primary_200',
  'primary_300',
  'primary_400',
  'primary_500',
  'primary_600',
  'primary_700',
  'primary_800',
  'primary_900',
  'primary_950',
  'primary_975',
] as const

const OFFSET = 1

const LIGHTEST_TONE = TONES.indexOf('100')

function applyAccent(
  palette: Palette,
  accent: Record<string, string>,
  subdued: boolean,
): Palette {
  const next: Palette = {...palette}
  SHADES.forEach((shade, i) => {
    const tone =
      TONES[Math.min(TONES.length - 1, Math.max(LIGHTEST_TONE, i + OFFSET))]
    const color = accent[tone]
    if (color) {
      next[shade] = color
    }
  })

  next.contrast_0 = accent.n1_10 ? lighten(accent.n1_10, 2) : next.contrast_0
  next.contrast_25 = accent.n1_50 ?? next.contrast_25
  next.contrast_50 = accent.n1_100 ?? next.contrast_50
  next.contrast_100 = accent.n2_100 ?? accent.n1_200 ?? next.contrast_100
  next.contrast_200 = accent.n2_200 ?? accent.n1_300 ?? next.contrast_200
  next.contrast_300 = accent.n2_300 ?? accent.n1_400 ?? next.contrast_300
  next.contrast_400 = accent.n2_400 ?? accent.n1_500 ?? next.contrast_400
  next.contrast_500 = accent.n2_500 ?? accent.n1_600 ?? next.contrast_500
  next.contrast_600 = accent.n2_600 ?? accent.n1_700 ?? next.contrast_600
  next.contrast_700 = accent.n2_700 ?? accent.n1_700 ?? next.contrast_700
  next.contrast_800 = accent.n1_800 ?? next.contrast_800
  next.contrast_900 = accent.n2_800 ?? accent.n1_800 ?? next.contrast_900
  next.contrast_950 = accent.n1_900
    ? lighten(accent.n1_900, subdued ? 4 : 2)
    : next.contrast_950
  next.contrast_975 = accent.n1_900
    ? subdued
      ? lighten(accent.n1_900, 1)
      : accent.n1_900
    : next.contrast_975
  next.contrast_1000 = accent.n1_900
    ? darken(accent.n1_900, subdued ? 2 : 5)
    : next.contrast_1000

  return next
}

export function getMaterialYouThemes(): typeof themes | undefined {
  const accent = PlatformInfo.getMaterialYouAccentColors()
  if (!accent || Object.keys(accent).length === 0) return undefined

  return createAppThemes({
    defaultPalette: applyAccent(M3_EXPRESSIVE_PALETTE, accent, false),
    subduedPalette: applyAccent(M3_EXPRESSIVE_SUBDUED_PALETTE, accent, true),
  })
}

export function getWebMaterialYouThemes(options?: {
  preset?: string
  customHex?: string
}): typeof themes | undefined {
  const presetId = options?.preset ?? 'default'
  if (!presetId || presetId === 'default') {
    return undefined
  }

  const found = THEME_COLOR_PRESETS.find(p => p.id === presetId)
  const hex =
    presetId === 'custom'
      ? options?.customHex || '#64748B'
      : found?.hex || '#737373'
  const accent = generateAccentFromSeed(hex, Boolean(found?.monochrome))
  return createAppThemes({
    defaultPalette: applyAccent(M3_EXPRESSIVE_PALETTE, accent, false),
    subduedPalette: applyAccent(M3_EXPRESSIVE_SUBDUED_PALETTE, accent, true),
  })
}
