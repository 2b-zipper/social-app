import {
  createThemes,
  DEFAULT_PALETTE,
  DEFAULT_SUBDUED_PALETTE,
} from '@bsky.app/alf'

import {PlatformInfo} from '../../modules/expo-bluesky-swiss-army'
import {type themes} from './themes'

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
]

const OFFSET = 1

const LIGHTEST_TONE = TONES.indexOf('100')

function applyAccent<T extends typeof DEFAULT_PALETTE>(
  palette: T,
  accent: Record<string, string>,
): T {
  const next = {...palette}
  SHADES.forEach((shade, i) => {
    const tone =
      TONES[Math.min(TONES.length - 1, Math.max(LIGHTEST_TONE, i + OFFSET))]
    const color = accent[tone]
    if (color) {
      next[shade as keyof T] = color as T[keyof T]
    }
  })
  return next
}

export function getMaterialYouThemes(): typeof themes | undefined {
  const accent = PlatformInfo.getMaterialYouAccentColors()
  if (!accent || Object.keys(accent).length === 0) return undefined

  const built = createThemes({
    defaultPalette: applyAccent(DEFAULT_PALETTE, accent),
    subduedPalette: applyAccent(DEFAULT_SUBDUED_PALETTE, accent),
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
