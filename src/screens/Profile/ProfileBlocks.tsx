import {Trans, useLingui} from '@lingui/react/macro'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {useProfileBlocksQuery} from '#/state/queries/profile-blocks'
import {
  ProfileAccountList,
  useProfileRouteDid,
} from '#/screens/Profile/components/ProfileAccountList'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileBlocks'>
export function ProfileBlocksScreen({route}: Props) {
  const {t: l} = useLingui()
  const {did, isDidLoading, resolveError} = useProfileRouteDid(
    route.params.name,
  )
  const query = useProfileBlocksQuery(did)

  return (
    <ProfileAccountList
      testID="profileBlocksScreen"
      itemTestID="blockedAccount"
      titleText={<Trans>Blocked accounts</Trans>}
      did={did}
      isDidLoading={isDidLoading}
      resolveError={resolveError}
      query={query}
      emptyMessage={l`This user hasn't blocked anyone.`}
    />
  )
}
