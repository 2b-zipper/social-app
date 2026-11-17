import {useWindowDimensions} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {useKawaiiMode} from '#/state/preferences/kawaii'
import {KAWAII_HEADER_EXTRA_HEIGHT} from '#/view/icons/Logo'
import {useBreakpoints} from '#/alf'
import {IS_NATIVE, IS_WEB} from '#/env'

export function useHeaderOffset() {
  const {gtMobile} = useBreakpoints()
  const {fontScale} = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const kawaii = useKawaiiMode()
  if (gtMobile && IS_WEB) {
    return 0
  }
  const navBarHeight =
    52 +
    (kawaii ? KAWAII_HEADER_EXTRA_HEIGHT : 0) +
    (IS_NATIVE ? insets.top : 0)
  const tabBarPad = 10 + 10 + 3 // padding + border
  const normalLineHeight = 20 // matches tab bar
  const tabBarText = normalLineHeight * fontScale
  return navBarHeight + tabBarPad + tabBarText - 4 // for some reason, this calculation is wrong by 4 pixels, which we adjust
}
