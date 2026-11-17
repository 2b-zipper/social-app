import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

export type TranslationEngine = NonNullable<
  persisted.Schema['translationEngine']
>

type StateContext = TranslationEngine
type SetContext = (v: TranslationEngine) => void

const DEFAULT: TranslationEngine =
  persisted.defaults.translationEngine ?? 'device'

const stateContext = createContext<StateContext>(DEFAULT)
stateContext.displayName = 'TranslationEngineStateContext'
const setContext = createContext<SetContext>((_: TranslationEngine) => {})
setContext.displayName = 'TranslationEngineSetContext'

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = useState(
    persisted.get('translationEngine') ?? DEFAULT,
  )

  const setStateWrapped = useCallback(
    (translationEngine: TranslationEngine) => {
      setState(translationEngine)
      void persisted.write('translationEngine', translationEngine)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('translationEngine', next => {
      setState(next ?? DEFAULT)
    })
  }, [setStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export const useTranslationEngine = () => useContext(stateContext)
export const useSetTranslationEngine = () => useContext(setContext)
