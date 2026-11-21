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

const presetStateContext = createContext<string>(
  persisted.defaults.themeColorPreset ?? 'default',
)
presetStateContext.displayName = 'ThemeColorPresetStateContext'
const presetSetContext = createContext<(v: string) => void>((_: string) => {})
presetSetContext.displayName = 'ThemeColorPresetSetContext'

const customHexStateContext = createContext<string>(
  persisted.defaults.customThemeHex ?? '#64748B',
)
customHexStateContext.displayName = 'CustomThemeHexStateContext'
const customHexSetContext = createContext<(v: string) => void>(
  (_: string) => {},
)
customHexSetContext.displayName = 'CustomThemeHexSetContext'

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = useState(
    Boolean(persisted.get('materialYou') ?? true),
  )
  const [preset, setPreset] = useState(
    persisted.get('themeColorPreset') ?? 'default',
  )
  const [customHex, setCustomHex] = useState(
    persisted.get('customThemeHex') ?? '#64748B',
  )

  const setStateWrapped = useCallback(
    (materialYou: persisted.Schema['materialYou']) => {
      setState(Boolean(materialYou))
      void persisted.write('materialYou', materialYou)
    },
    [setState],
  )

  const setPresetWrapped = useCallback(
    (nextPreset: string) => {
      setPreset(nextPreset)
      void persisted.write('themeColorPreset', nextPreset)
    },
    [setPreset],
  )

  const setCustomHexWrapped = useCallback(
    (nextHex: string) => {
      setCustomHex(nextHex)
      void persisted.write('customThemeHex', nextHex)
    },
    [setCustomHex],
  )

  useEffect(() => {
    const unsub1 = persisted.onUpdate('materialYou', next => {
      setState(Boolean(next ?? true))
    })
    const unsub2 = persisted.onUpdate('themeColorPreset', next => {
      setPreset(next ?? 'default')
    })
    const unsub3 = persisted.onUpdate('customThemeHex', next => {
      setCustomHex(next ?? '#64748B')
    })
    return () => {
      unsub1()
      unsub2()
      unsub3()
    }
  }, [])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        <presetStateContext.Provider value={preset}>
          <presetSetContext.Provider value={setPresetWrapped}>
            <customHexStateContext.Provider value={customHex}>
              <customHexSetContext.Provider value={setCustomHexWrapped}>
                {children}
              </customHexSetContext.Provider>
            </customHexStateContext.Provider>
          </presetSetContext.Provider>
        </presetStateContext.Provider>
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export const useMaterialYou = () => useContext(stateContext)
export const useSetMaterialYou = () => useContext(setContext)
export const useThemeColorPreset = () => useContext(presetStateContext)
export const useSetThemeColorPreset = () => useContext(presetSetContext)
export const useCustomThemeHex = () => useContext(customHexStateContext)
export const useSetCustomThemeHex = () => useContext(customHexSetContext)
