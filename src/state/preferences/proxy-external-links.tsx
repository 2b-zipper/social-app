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
  Boolean(persisted.defaults.proxyExternalLinks),
)
stateContext.displayName = 'ProxyExternalLinksStateContext'
const setContext = createContext<SetContext>((_: boolean) => {})
setContext.displayName = 'ProxyExternalLinksSetContext'

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = useState(
    Boolean(persisted.get('proxyExternalLinks')),
  )

  const setStateWrapped = useCallback(
    (proxyExternalLinks: persisted.Schema['proxyExternalLinks']) => {
      setState(Boolean(proxyExternalLinks))
      void persisted.write('proxyExternalLinks', proxyExternalLinks)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('proxyExternalLinks', next => {
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

export const useProxyExternalLinks = () => useContext(stateContext)
export const useSetProxyExternalLinks = () => useContext(setContext)
