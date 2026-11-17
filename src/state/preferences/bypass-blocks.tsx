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
  Boolean(persisted.defaults.bypassBlocks),
)
stateContext.displayName = 'BypassBlocksStateContext'
const setContext = createContext<SetContext>((_: boolean) => {})
setContext.displayName = 'BypassBlocksSetContext'

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = useState(Boolean(persisted.get('bypassBlocks')))

  const setStateWrapped = useCallback(
    (bypassBlocks: persisted.Schema['bypassBlocks']) => {
      setState(Boolean(bypassBlocks))
      void persisted.write('bypassBlocks', bypassBlocks)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('bypassBlocks', next => {
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

export const useBypassBlocks = () => useContext(stateContext)
export const useSetBypassBlocks = () => useContext(setContext)
