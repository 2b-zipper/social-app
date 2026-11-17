import {Pressable, View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {isJwtExpired} from '#/lib/jwt'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useProfileQuery, useProfilesQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import * as Menu from '#/components/Menu'

const AVATAR_SIZE = 42

export function PostAsAccountAvatar({
  postAsDid,
  onSelectAccount,
}: {
  postAsDid: string
  onSelectAccount: (did: string) => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {accounts, currentAccount} = useSession()
  const usableAccounts = accounts.filter(
    account =>
      account.did === currentAccount?.did ||
      (!!account.refreshJwt && !isJwtExpired(account.refreshJwt)),
  )
  const {data: profiles} = useProfilesQuery({
    handles: usableAccounts.length > 1 ? usableAccounts.map(a => a.did) : [],
  })
  const {data: postAsProfile} = useProfileQuery({did: postAsDid})
  const isOtherAccount = postAsDid !== currentAccount?.did

  const avatar = (
    <UserAvatar
      avatar={postAsProfile?.avatar}
      size={AVATAR_SIZE}
      type={postAsProfile?.associated?.labeler ? 'labeler' : 'user'}
    />
  )

  if (usableAccounts.length < 2) {
    return <View style={[a.mt_xs]}>{avatar}</View>
  }

  const postAsHandle = sanitizeHandle(
    postAsProfile?.handle ??
      accounts.find(account => account.did === postAsDid)?.handle ??
      '',
    '@',
  )

  return (
    <Menu.Root>
      <Menu.Trigger
        label={l`Posting as ${postAsHandle}`}
        hint={l`Opens a menu to choose which account to post from`}>
        {({props}) => (
          <Pressable
            {...props}
            testID="composerPostAsBtn"
            style={[
              a.mt_xs,
              a.rounded_full,
              a.self_start,
              isOtherAccount && {
                outlineWidth: 2,
                outlineStyle: 'solid',
                outlineOffset: 1,
                outlineColor: t.palette.primary_500,
              },
            ]}>
            {avatar}
          </Pressable>
        )}
      </Menu.Trigger>
      <Menu.Outer>
        <Menu.LabelText>
          <Trans>Post as</Trans>
        </Menu.LabelText>
        <Menu.Group>
          {usableAccounts.map(account => {
            const profile = profiles?.profiles.find(p => p.did === account.did)
            const handle = sanitizeHandle(
              profile?.handle ?? account.handle,
              '@',
            )
            return (
              <Menu.Item
                key={account.did}
                testID={`composerPostAs-${account.handle}`}
                label={l`Post as ${handle}`}
                style={[a.gap_sm]}
                onPress={() => onSelectAccount(account.did)}>
                <UserAvatar
                  avatar={profile?.avatar}
                  size={20}
                  type={profile?.associated?.labeler ? 'labeler' : 'user'}
                />
                <Menu.ItemText>{handle}</Menu.ItemText>
                <Menu.ItemRadio selected={account.did === postAsDid} />
              </Menu.Item>
            )
          })}
        </Menu.Group>
      </Menu.Outer>
    </Menu.Root>
  )
}
