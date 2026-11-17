import {requireNativeModule} from 'expo-modules-core'

const NativeModule = requireNativeModule('ExpoM3E') as {
  attachRefreshIndicator(viewTag: number): Promise<void>
}

export function attachRefreshIndicator(viewTag: number): void {
  NativeModule.attachRefreshIndicator(viewTag).catch(() => {})
}
