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
  Boolean(persisted.defaults.allowBlockedInteractions),
)
stateContext.displayName = 'AllowBlockedInteractionsStateContext'
const setContext = createContext<SetContext>((_: boolean) => {})
setContext.displayName = 'AllowBlockedInteractionsSetContext'

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = useState(
    Boolean(persisted.get('allowBlockedInteractions')),
  )

  const setStateWrapped = useCallback(
    (
      allowBlockedInteractions: persisted.Schema['allowBlockedInteractions'],
    ) => {
      setState(Boolean(allowBlockedInteractions))
      void persisted.write('allowBlockedInteractions', allowBlockedInteractions)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('allowBlockedInteractions', next => {
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

export const useAllowBlockedInteractions = () => useContext(stateContext)
export const useSetAllowBlockedInteractions = () => useContext(setContext)
