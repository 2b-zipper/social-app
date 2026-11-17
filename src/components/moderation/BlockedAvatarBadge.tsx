import {View} from 'react-native'
import {type ModerationUI} from '@bsky/sdk/moderation'
import {useLingui} from '@lingui/react/macro'

import {getBypassedBlock} from '#/lib/moderation/bypassBlocks'
import {atoms as a, useTheme} from '#/alf'
import {CircleBanSign_Stroke2_Corner0_Rounded as CircleBanSignIcon} from '#/components/icons/CircleBanSign'

const MIN_AVATAR_SIZE = 24

export function BlockedAvatarBadge({
  moderation,
  size,
  hasAlert = false,
}: {
  moderation: ModerationUI | undefined
  size: number
  hasAlert?: boolean
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const block = getBypassedBlock(moderation)
  if (!block || size < MIN_AVATAR_SIZE) return null

  const isBlockedBy = block === 'blocked-by'
  const badgeSize = Math.round(Math.min(26, Math.max(14, size * 0.36)))

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={
        isBlockedBy ? l`This account blocks you` : l`You block this account`
      }
      accessibilityHint={l`Visible because “Show blocked content” is on`}
      style={[
        a.absolute,
        a.bottom_0,
        hasAlert ? a.left_0 : a.right_0,
        a.align_center,
        a.justify_center,
        a.rounded_full,
        {
          width: badgeSize,
          height: badgeSize,
          borderWidth: 1.5,
          borderColor: t.atoms.bg.backgroundColor,
          backgroundColor: isBlockedBy
            ? t.palette.negative_500
            : t.palette.contrast_700,
        },
      ]}>
      <CircleBanSignIcon
        width={badgeSize - 5}
        fill={isBlockedBy ? t.palette.white : t.palette.contrast_0}
      />
    </View>
  )
}
