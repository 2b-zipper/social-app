import {useState} from 'react'
import {View} from 'react-native'
import {
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useProfileQuery} from '#/state/queries/profile'
import {useResolveDidQuery} from '#/state/queries/resolve-uri'
import {List} from '#/view/com/util/List'
import {atoms as a, useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {ListFooter, ListMaybePlaceholder} from '#/components/Lists'
import * as ProfileCard from '#/components/ProfileCard'
import {type app} from '#/lexicons'

type Profile =
  app.bsky.actor.defs.ProfileView | app.bsky.actor.defs.ProfileViewDetailed

export function useProfileRouteDid(name: string) {
  const {data, isLoading, error} = useResolveDidQuery(name)
  return {did: data, isDidLoading: isLoading, resolveError: error}
}

export function ProfileAccountList({
  testID,
  itemTestID,
  titleText,
  did,
  isDidLoading,
  resolveError,
  query,
  emptyMessage,
}: {
  testID: string
  itemTestID: string
  titleText: React.ReactNode
  did: string | undefined
  isDidLoading: boolean
  resolveError: Error | null
  query: UseInfiniteQueryResult<
    InfiniteData<{profiles: Profile[]; cursor: string | undefined}>,
    Error
  >
  emptyMessage: string
}) {
  const t = useTheme()
  const moderationOpts = useModerationOpts()
  const {data: profile} = useProfileQuery({did})
  const [isPTRing, setIsPTRing] = useState(false)
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = query

  const profiles = data?.pages.flatMap(page => page.profiles) ?? []

  const onRefresh = async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh account list', {message: err})
    }
    setIsPTRing(false)
  }

  const onEndReached = async () => {
    if (isFetching || !hasNextPage || isError) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more of an account list', {message: err})
    }
  }

  const renderItem = ({item, index}: {item: Profile; index: number}) => {
    if (!moderationOpts) return null
    return (
      <View
        style={[a.py_md, a.px_xl, a.border_t, t.atoms.border_contrast_low]}
        key={item.did}>
        <ProfileCard.Default
          testID={`${itemTestID}-${index}`}
          profile={item}
          moderationOpts={moderationOpts}
        />
      </View>
    )
  }

  return (
    <Layout.Screen testID={testID}>
      <Layout.Center>
        <Layout.Header.Outer>
          <Layout.Header.BackButton />
          <Layout.Header.Content>
            <Layout.Header.TitleText>{titleText}</Layout.Header.TitleText>
            {profile && (
              <Layout.Header.SubtitleText>
                {sanitizeDisplayName(profile.displayName || profile.handle)}
              </Layout.Header.SubtitleText>
            )}
          </Layout.Header.Content>
          <Layout.Header.Slot />
        </Layout.Header.Outer>
        {profiles.length < 1 ? (
          <ListMaybePlaceholder
            isLoading={isDidLoading || isLoading}
            isError={isError || !!resolveError}
            emptyType="results"
            emptyMessage={emptyMessage}
            errorMessage={cleanError(resolveError || error)}
            onRetry={isError ? refetch : undefined}
            sideBorders={false}
          />
        ) : (
          <List
            data={profiles}
            keyExtractor={(item: Profile) => item.did}
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
