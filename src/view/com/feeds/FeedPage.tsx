import {
  type JSX,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {type NavigationProp, useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {DISCOVER_FEED_URI, VIDEO_FEED_URIS} from '#/lib/constants'
import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {getRootNavigation, getTabState, TabState} from '#/lib/routes/helpers'
import {type CommonNavigatorParams} from '#/lib/routes/types'
import {listenSoftReset} from '#/state/events'
import {FeedFeedbackProvider, useFeedFeedback} from '#/state/feed-feedback'
import {useSetHomeBadge} from '#/state/home-badge'
import {type FeedSourceInfo} from '#/state/queries/feed'
import {
  type FeedDescriptor,
  type FeedParams,
  RQKEY as FEED_RQKEY,
} from '#/state/queries/post-feed'
import {truncateAndInvalidate} from '#/state/queries/util'
import {useSession} from '#/state/session'
import {PostFeed, type PostFeedRef} from '#/view/com/posts/PostFeed'
import {FAB} from '#/view/com/util/fab/FAB'
import {type ListMethods} from '#/view/com/util/List'
import {LoadLatestBtn} from '#/view/com/util/load-latest/LoadLatestBtn'
import {MainScrollProvider} from '#/view/com/util/MainScrollProvider'
import {useBreakpoints, useTheme} from '#/alf'
import {useHeaderOffset} from '#/components/hooks/useHeaderOffset'
import {EditBig_Stroke2_Corner2_Rounded as EditBigIcon} from '#/components/icons/EditBig'
import {type NewPostsPillAuthor} from '#/components/NewPostsPill'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE, IS_WEB} from '#/env'
import {PrependPill} from '#/features/followingV2/home/PrependPill'
import {app} from '#/lexicons'

const POLL_FREQ = 30e3 // 30sec

export function FeedPage({
  testID,
  isPageFocused,
  isPageAdjacent,
  feed,
  feedParams,
  renderEmptyState,
  renderEndOfFeed,
  savedFeedConfig,
  feedInfo,
}: {
  testID?: string
  feed: FeedDescriptor
  feedParams?: FeedParams
  isPageFocused: boolean
  isPageAdjacent: boolean
  renderEmptyState: () => JSX.Element
  renderEndOfFeed?: () => JSX.Element
  savedFeedConfig?: app.bsky.actor.defs.SavedFeed
  feedInfo: FeedSourceInfo
}) {
  const ax = useAnalytics()
  const {hasSession} = useSession()
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp<CommonNavigatorParams>>()
  const queryClient = useQueryClient()
  const {openComposer} = useOpenComposer()
  const [isScrolledDown, setIsScrolledDown] = useState(false)
  const headerOffset = useHeaderOffset()
  const feedFeedback = useFeedFeedback(feedInfo, hasSession)
  const scrollElRef = useRef<ListMethods>(null)
  const postFeedRef = useRef<PostFeedRef>(null)
  const [hasNew, setHasNew] = useState(false)
  const [newAuthors, setNewAuthors] = useState<NewPostsPillAuthor[]>([])
  const setHomeBadge = useSetHomeBadge()
  const isVideoFeed = useMemo(() => {
    const isBskyVideoFeed = VIDEO_FEED_URIS.includes(feedInfo.uri)
    const feedIsVideoMode =
      feedInfo.contentMode === app.bsky.feed.defs.contentModeVideo.value
    const _isVideoFeed = isBskyVideoFeed || feedIsVideoMode
    return IS_NATIVE && _isVideoFeed
  }, [feedInfo])
  const t = useTheme()
  const {gtMobile} = useBreakpoints()

  const handleHasNew = useCallback(
    (v: boolean, authors: NewPostsPillAuthor[] = []) => {
      setHasNew(v)
      setNewAuthors(v ? authors : [])
    },
    [],
  )

  useEffect(() => {
    if (isPageFocused) {
      setHomeBadge(hasNew)
    }
  }, [isPageFocused, hasNew, setHomeBadge])

  const scrollToTop = useCallback(() => {
    scrollElRef.current?.scrollToOffset({
      animated: IS_NATIVE,
      offset: -headerOffset,
    })
  }, [headerOffset])

  const onSoftReset = useCallback(() => {
    const isScreenFocused =
      getTabState(getRootNavigation(navigation).getState(), 'Home') ===
      TabState.InsideAtRoot
    if (isScreenFocused && isPageFocused) {
      scrollToTop()
      if (postFeedRef.current) {
        void postFeedRef.current.refreshFeed()
      } else {
        void truncateAndInvalidate(queryClient, FEED_RQKEY(feed, feedParams))
      }
      setHasNew(false)
      setNewAuthors([])
      ax.metric('feed:refresh', {
        feedType: feed.split('|')[0],
        feedUrl: feed,
        reason: 'soft-reset',
      })
    }
  }, [
    ax,
    navigation,
    isPageFocused,
    scrollToTop,
    queryClient,
    feed,
    feedParams,
  ])

  // fires when page within screen is activated/deactivated
  useEffect(() => {
    if (!isPageFocused) {
      return
    }
    return listenSoftReset(onSoftReset)
  }, [onSoftReset, isPageFocused])

  const onPressCompose = useCallback(() => {
    openComposer({logContext: 'Fab'})
  }, [openComposer])

  const onPressLoadLatest = useCallback(() => {
    scrollToTop()
    if (postFeedRef.current) {
      void postFeedRef.current.refreshFeed()
    } else {
      void truncateAndInvalidate(queryClient, FEED_RQKEY(feed, feedParams))
    }
    setHasNew(false)
    setNewAuthors([])
    ax.metric('feed:refresh', {
      feedType: feed.split('|')[0],
      feedUrl: feed,
      reason: 'load-latest',
    })
  }, [ax, scrollToTop, feed, feedParams, queryClient])

  const shouldPrefetch = IS_NATIVE && isPageAdjacent
  const isDiscoverFeed = feedInfo.uri === DISCOVER_FEED_URI
  return (
    <View
      testID={testID}
      // @ts-expect-error web only -sfn
      dataSet={{nosnippet: isDiscoverFeed ? '' : undefined}}>
      {IS_WEB && gtMobile && (
        <PrependPill
          visible={hasNew}
          count={newAuthors.length}
          authors={newAuthors}
          onPress={onPressLoadLatest}
        />
      )}
      <MainScrollProvider>
        <FeedFeedbackProvider value={feedFeedback}>
          <PostFeed
            ref={postFeedRef}
            testID={testID ? `${testID}-feed` : undefined}
            enabled={isPageFocused || shouldPrefetch}
            feed={feed}
            feedParams={feedParams}
            pollInterval={POLL_FREQ}
            disablePoll={!isPageFocused || (hasNew && isDiscoverFeed)}
            scrollElRef={scrollElRef}
            onScrolledDownChange={setIsScrolledDown}
            onHasNew={handleHasNew}
            renderEmptyState={renderEmptyState}
            renderEndOfFeed={renderEndOfFeed}
            headerOffset={headerOffset}
            savedFeedConfig={savedFeedConfig}
            isVideoFeed={isVideoFeed}
          />
        </FeedFeedbackProvider>
      </MainScrollProvider>
      {(!IS_WEB || !gtMobile) && (
        <PrependPill
          visible={hasNew}
          count={newAuthors.length}
          authors={newAuthors}
          onPress={onPressLoadLatest}
        />
      )}
      {isScrolledDown && (
        <LoadLatestBtn
          onPress={onPressLoadLatest}
          label={_(msg`Load new posts`)}
          showIndicator={false}
        />
      )}

      {hasSession && (
        <FAB
          testID="composeFAB"
          onPress={onPressCompose}
          icon={<EditBigIcon size="lg" fill={t.palette.white} />}
          accessibilityRole="button"
          accessibilityLabel={_(msg({message: `New post`, context: 'action'}))}
          accessibilityHint=""
        />
      )}
    </View>
  )
}
