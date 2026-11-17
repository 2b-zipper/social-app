import {Trans, useLingui} from '@lingui/react/macro'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {useProfileBlockedByQuery} from '#/state/queries/profile-blocked-by'
import {
  ProfileAccountList,
  useProfileRouteDid,
} from '#/screens/Profile/components/ProfileAccountList'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileBlockedBy'>
export function ProfileBlockedByScreen({route}: Props) {
  const {t: l} = useLingui()
  const {did, isDidLoading, resolveError} = useProfileRouteDid(
    route.params.name,
  )
  const query = useProfileBlockedByQuery(did)

  return (
    <ProfileAccountList
      testID="profileBlockedByScreen"
      itemTestID="blockingAccount"
      titleText={<Trans>Blocking you</Trans>}
      did={did}
      isDidLoading={isDidLoading}
      resolveError={resolveError}
      query={query}
      emptyMessage={l`Nobody is blocking you.`}
    />
  )
}
