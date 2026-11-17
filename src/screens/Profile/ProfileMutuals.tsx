import {Trans, useLingui} from '@lingui/react/macro'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {useProfileMutualsQuery} from '#/state/queries/profile-mutuals'
import {
  ProfileAccountList,
  useProfileRouteDid,
} from '#/screens/Profile/components/ProfileAccountList'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileMutuals'>
export function ProfileMutualsScreen({route}: Props) {
  const {t: l} = useLingui()
  const {did, isDidLoading, resolveError} = useProfileRouteDid(
    route.params.name,
  )
  const query = useProfileMutualsQuery(did)

  return (
    <ProfileAccountList
      testID="profileMutualsScreen"
      itemTestID="mutualAccount"
      titleText={<Trans>Mutuals</Trans>}
      did={did}
      isDidLoading={isDidLoading}
      resolveError={resolveError}
      query={query}
      emptyMessage={l`No mutual follows yet.`}
    />
  )
}
