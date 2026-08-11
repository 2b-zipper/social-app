import {Platform} from 'react-native'
import {requireNativeModule} from 'expo-modules-core'

import {type AudioCategory} from './types'

const NativeModule = requireNativeModule('ExpoPlatformInfo') as {
  getIsReducedMotionEnabled(): boolean
  getMaterialYouAccentColors(): Record<string, string>
  setAudioActive(active: boolean): void
  setAudioCategory(audioCategory: AudioCategory): void
}

export function getIsReducedMotionEnabled(): boolean {
  return NativeModule.getIsReducedMotionEnabled()
}

export function getMaterialYouAccentColors(): Record<string, string> {
  if (Platform.OS !== 'android') return {}
  return NativeModule.getMaterialYouAccentColors()
}

export function setAudioActive(active: boolean): void {
  if (Platform.OS !== 'ios') return
  NativeModule.setAudioActive(active)
}

export function setAudioCategory(audioCategory: AudioCategory): void {
  if (Platform.OS !== 'ios') return
  NativeModule.setAudioCategory(audioCategory)
}
