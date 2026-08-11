import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = boolean
type SetContext = (v: boolean) => void

const stateContext = createContext<StateContext>(
  Boolean(persisted.defaults.preferGoogleTranslate),
)
stateContext.displayName = 'PreferGoogleTranslateStateContext'
const setContext = createContext<SetContext>((_: boolean) => {})
setContext.displayName = 'PreferGoogleTranslateSetContext'

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = useState(
    Boolean(persisted.get('preferGoogleTranslate')),
  )

  const setStateWrapped = useCallback(
    (preferGoogleTranslate: persisted.Schema['preferGoogleTranslate']) => {
      setState(Boolean(preferGoogleTranslate))
      void persisted.write('preferGoogleTranslate', preferGoogleTranslate)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('preferGoogleTranslate', next => {
      setState(Boolean(next))
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

export const usePreferGoogleTranslate = () => useContext(stateContext)
export const useSetPreferGoogleTranslate = () => useContext(setContext)
