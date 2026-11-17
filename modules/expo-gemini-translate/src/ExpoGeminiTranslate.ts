import {requireOptionalNativeModule} from 'expo-modules-core'

export type GeminiTranslateStatus =
  'unavailable' | 'downloadable' | 'downloading' | 'available'

const NativeModule = requireOptionalNativeModule<{
  getStatus(): Promise<GeminiTranslateStatus>
  translate(text: string, targetLanguage: string): Promise<string>
}>('ExpoGeminiTranslate')

export async function getGeminiTranslateStatus(): Promise<GeminiTranslateStatus> {
  if (!NativeModule) return 'unavailable'
  try {
    return await NativeModule.getStatus()
  } catch {
    return 'unavailable'
  }
}

export async function geminiTranslate(
  text: string,
  targetLanguage: string,
): Promise<string> {
  if (!NativeModule) {
    throw new Error('Gemini Nano is not available on this device')
  }
  return await NativeModule.translate(text, targetLanguage)
}
