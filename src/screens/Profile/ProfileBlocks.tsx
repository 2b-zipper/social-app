import {useCallback, useMemo, useState} from 'react'
import {View} from 'react-native'
import {type AppBskyActorDefs} from '@atproto/api'
import {Trans} from '@lingui/react/macro'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useProfileQuery} from '#/state/queries/profile'
import {useProfileBlocksQuery} from '#/state/queries/profile-blocks'
import {useResolveDidQuery} from '#/state/queries/resolve-uri'
import {ErrorScreen} from '#/view/com/util/error/ErrorScreen'
import {List} from '#/view/com/util/List'
import {atoms as a, useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {ListFooter} from '#/components/Lists'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileBlocks'>
export function ProfileBlocksScreen({route}: Props) {
  const {name} = route.params
  const t = useTheme()
  const moderationOpts = useModerationOpts()

  const {data: resolvedDid} = useResolveDidQuery(name)
  const {data: profile} = useProfileQuery({did: resolvedDid})

  const [isPTRing, setIsPTRing] = useState(false)
  const {
    data,
    isFetching,
    isError,
    error,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useProfileBlocksQuery(resolvedDid)

  const profiles = useMemo(() => {
    return data?.pages.flatMap(page => page.profiles) ?? []
  }, [data])
  const isEmpty = !isFetching && !hasNextPage && profiles.length === 0

  const onRefresh = useCallback(async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh blocked accounts', {message: err})
    }
    setIsPTRing(false)
  }, [refetch])

  const onEndReached = useCallback(async () => {
    if (isFetching || !hasNextPage || isError) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more blocked accounts', {message: err})
    }
  }, [isFetching, hasNextPage, isError, fetchNextPage])

  const renderItem = ({
    item,
    index,
  }: {
    item: AppBskyActorDefs.ProfileViewDetailed
    index: number
  }) => {
    if (!moderationOpts) return null
    return (
      <View
        style={[a.py_md, a.px_xl, a.border_t, t.atoms.border_contrast_low]}
        key={item.did}>
        <ProfileCard.Default
          testID={`blockedAccount-${index}`}
          profile={item}
          moderationOpts={moderationOpts}
        />
      </View>
    )
  }

  return (
    <Layout.Screen testID="profileBlocksScreen">
      <Layout.Center>
        <Layout.Header.Outer>
          <Layout.Header.BackButton />
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>Blocked accounts</Trans>
            </Layout.Header.TitleText>
            {profile && (
              <Layout.Header.SubtitleText>
                {sanitizeDisplayName(profile.displayName || profile.handle)}
              </Layout.Header.SubtitleText>
            )}
          </Layout.Header.Content>
          <Layout.Header.Slot />
        </Layout.Header.Outer>
        {isEmpty ? (
          isError ? (
            <ErrorScreen
              title="Oops!"
              message={cleanError(error)}
              onPressTryAgain={() => void refetch()}
            />
          ) : (
            <Empty />
          )
        ) : (
          <List
            data={profiles}
            keyExtractor={(item: AppBskyActorDefs.ProfileViewDetailed) =>
              item.did
            }
            refreshing={isPTRing}
            onRefresh={() => void onRefresh()}
            onEndReached={() => void onEndReached()}
            renderItem={renderItem}
            initialNumToRender={15}
            ListFooterComponent={
              <ListFooter
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={hasNextPage}
                error={cleanError(error)}
                onRetry={fetchNextPage}
              />
            }
          />
        )}
      </Layout.Center>
    </Layout.Screen>
  )
}

function Empty() {
  const t = useTheme()
  return (
    <View style={[a.pt_2xl, a.px_xl, a.align_center]}>
      <View style={[a.py_md, a.px_lg, a.rounded_sm, t.atoms.bg_contrast_25]}>
        <Text style={[a.text_center, t.atoms.text_contrast_high]}>
          <Trans>This user hasn't blocked anyone.</Trans>
        </Text>
      </View>
    </View>
  )
}
