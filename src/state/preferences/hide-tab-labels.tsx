import {createContext, useContext, useEffect, useState} from 'react'

import * as persisted from '#/state/persisted'

const stateContext = createContext(Boolean(persisted.defaults.hideTabLabels))
stateContext.displayName = 'HideTabLabelsStateContext'
const setContext = createContext((_: boolean) => {})
setContext.displayName = 'HideTabLabelsSetContext'

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = useState(Boolean(persisted.get('hideTabLabels')))

  const setStateWrapped = (hideTabLabels: boolean) => {
    setState(hideTabLabels)
    void persisted.write('hideTabLabels', hideTabLabels)
  }

  useEffect(() => {
    return persisted.onUpdate('hideTabLabels', next => {
      setState(Boolean(next))
    })
  }, [])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export const useHideTabLabels = () => useContext(stateContext)
export const useSetHideTabLabels = () => useContext(setContext)
