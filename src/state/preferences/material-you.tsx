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
  Boolean(persisted.defaults.materialYou),
)
stateContext.displayName = 'MaterialYouStateContext'
const setContext = createContext<SetContext>((_: boolean) => {})
setContext.displayName = 'MaterialYouSetContext'

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = useState(
    Boolean(persisted.get('materialYou') ?? true),
  )

  const setStateWrapped = useCallback(
    (materialYou: persisted.Schema['materialYou']) => {
      setState(Boolean(materialYou))
      void persisted.write('materialYou', materialYou)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('materialYou', next => {
      setState(Boolean(next ?? true))
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

export const useMaterialYou = () => useContext(stateContext)
export const useSetMaterialYou = () => useContext(setContext)
