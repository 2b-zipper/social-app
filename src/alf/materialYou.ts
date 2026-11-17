import {createThemes, type Palette} from '@bsky.app/alf'

import {PlatformInfo} from '../../modules/expo-bluesky-swiss-army'
import {
  M3_EXPRESSIVE_PALETTE,
  M3_EXPRESSIVE_SUBDUED_PALETTE,
  type themes,
} from './themes'
import {darken, lighten} from './util/colorGeneration'

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

  const built = createThemes({
    defaultPalette: applyAccent(M3_EXPRESSIVE_PALETTE, accent, false),
    subduedPalette: applyAccent(M3_EXPRESSIVE_SUBDUED_PALETTE, accent, true),
  })

  return {
    lightPalette: built.light.palette,
    darkPalette: built.dark.palette,
    dimPalette: built.dim.palette,
    light: built.light,
    dark: built.dark,
    dim: built.dim,
  }
}
