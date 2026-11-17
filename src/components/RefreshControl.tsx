import {
  findNodeHandle,
  RefreshControl as RNRefreshControl,
  type RefreshControlProps,
} from 'react-native'
import {M3E} from '@bsky.app/expo-bluesky-swiss-army'

import {useTheme} from '#/alf'
import * as m3e from '#/alf/m3e'
import {IS_ANDROID, IS_IOS} from '#/env'

export function RefreshControl(props: RefreshControlProps) {
  const t = useTheme()
  const c = m3e.colors(t)

  function attach(instance: RNRefreshControl | null) {
    if (!IS_ANDROID || !instance) return
    const tag = findNodeHandle(instance)
    if (tag != null) M3E.attachRefreshIndicator(tag)
  }

  return (
    <RNRefreshControl
      // Re-keying remounts the whole wrapped list on Android, and only iOS needs it
      key={IS_IOS ? c.primary : undefined}
      ref={attach}
      tintColor={c.primary}
      titleColor={c.onSurface}
      colors={[c.onPrimaryContainer]}
      progressBackgroundColor={c.primaryContainer}
      {...props}
    />
  )
}
