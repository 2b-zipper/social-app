import {useCallback, useContext, useMemo, useState} from 'react'
import {useLingui} from '@lingui/react/macro'

import {useGoogleTranslate} from '#/lib/hooks/useGoogleTranslate'
import {useAnalytics} from '#/analytics'
import {Context} from './context'
import {
  type ContextType,
  type TranslationFunctionParams,
  type TranslationOptions,
  type TranslationState,
} from './types'
import {guessLanguage} from './utils'

export * from './types'
export * from './utils'

const acquireTranslation = (_key: string) => {
  return () => {}
}

export function useTranslate({
  key,
  forceGoogleTranslate = false,
}: TranslationOptions) {
  const context = useContext(Context)
  if (!context) {
    throw new Error(
      'useTranslate must be used within a TranslateOnDeviceProvider',
    )
  }

  const translate = useCallback(
    async (params: TranslationFunctionParams) => {
      return context.translate(
        {
          ...params,
        },
        {
          key,
          forceGoogleTranslate,
        },
      )
    },
    [key, forceGoogleTranslate, context],
  )

  const clearTranslation = useCallback(() => {
    return context.clearTranslation(key)
  }, [key, context])

  return {
    translationState: context.translationState[key] ?? {
      status: 'idle' as const,
    },
    translate,
    clearTranslation,
  }
}

export function Provider({children}: React.PropsWithChildren<unknown>) {
  const [translationState, setTranslationState] = useState<
    Record<string, TranslationState>
  >({})
  const ax = useAnalytics()
  const {t: l} = useLingui()
  const googleTranslate = useGoogleTranslate()

  const clearTranslation = useCallback((key: string) => {
    setTranslationState(prev => {
      const next = {...prev}
      delete next[key]
      return next
    })
  }, [])

  const translate = useCallback<ContextType['translate']>(
    async (
      {
        text,
        expectedTargetLanguage,
        expectedSourceLanguage,
        possibleSourceLanguages,
        forceGoogleTranslate: forceGoogleTranslateOverride,
      },
      {key, forceGoogleTranslate},
    ) => {
      const shouldOpenExternal = Boolean(
        forceGoogleTranslateOverride ?? forceGoogleTranslate,
      )

      ax.metric('translate', {
        os: 'web',
        possibleSourceLanguages,
        expectedTargetLanguage,
        textLength: text.length,
        googleTranslate: shouldOpenExternal,
      })

      if (shouldOpenExternal) {
        await googleTranslate(
          text,
          expectedTargetLanguage,
          expectedSourceLanguage,
        )
        return
      }

      setTranslationState(prev => ({
        ...prev,
        [key]: {status: 'loading'},
      }))

      try {
        const sl = expectedSourceLanguage || 'auto'
        const tl = expectedTargetLanguage || 'ja'
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
          sl,
        )}&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(text)}`
        const res = await fetch(url)
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        const data = (await res.json()) as [
          Array<[string, string]> | null,
          unknown,
          string | undefined,
        ]
        const translatedText =
          data?.[0]
            ?.map(chunk => chunk?.[0] ?? '')
            .join('')
            .trim() ?? ''

        if (!translatedText) {
          throw new Error('Empty translation result')
        }

        const detectedSource =
          expectedSourceLanguage ??
          (typeof data?.[2] === 'string' ? data[2] : undefined) ??
          possibleSourceLanguages?.[0] ??
          guessLanguage(text) ??
          null

        setTranslationState(prev => ({
          ...prev,
          [key]: {
            status: 'success',
            translatedText,
            targetLanguage: expectedTargetLanguage,
            sourceLanguage: detectedSource,
          },
        }))
      } catch {
        setTranslationState(prev => ({
          ...prev,
          [key]: {
            status: 'error',
            message: l`Translation failed. Please try again.`,
          },
        }))
      }
    },
    [ax, googleTranslate, l],
  )

  const ctx = useMemo(
    () => ({acquireTranslation, clearTranslation, translate, translationState}),
    [clearTranslation, translate, translationState],
  )

  return <Context.Provider value={ctx}>{children}</Context.Provider>
}
