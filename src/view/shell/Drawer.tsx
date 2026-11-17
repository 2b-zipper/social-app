import {memo, useCallback, useEffect, useState} from 'react'
import {
  Linking,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {plural} from '@lingui/core/macro'
import {Plural, Trans, useLingui} from '@lingui/react/macro'
import {
  type NavigationState,
  StackActions,
  useNavigation,
} from '@react-navigation/native'

import {
  FEEDBACK_FORM_URL,
  HELP_DESK_URL,
  UNREAD_NOTIFICATION_CAP,
} from '#/lib/constants'
import {useNavigationTabState} from '#/lib/hooks/useNavigationTabState'
import {getTabState, TabState} from '#/lib/routes/helpers'
import {
  getTabNavigationAction,
  getTabResetAction,
} from '#/lib/routes/navigation'
import {
  type SharedNavTab,
  type SidebarTab,
  TAB_TO_NAV_ITEM,
} from '#/lib/routes/tab-to-nav-item'
import {type RootNavigationProp} from '#/lib/routes/types'
import {sanitizeHandle} from '#/lib/strings/handles'
import {emitSoftReset} from '#/state/events'
import {useModerationInboxUnreadCountQuery} from '#/state/queries/moderation-inbox'
import {useUnreadNotifications} from '#/state/queries/notifications/unread'
import {useProfileQuery} from '#/state/queries/profile'
import {type SessionAccount, useSession} from '#/state/session'
import {useSetDrawerOpen} from '#/state/shell'
import {formatCount} from '#/view/com/util/numeric/format'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {useLogoVariant} from '#/view/icons/useLogoVariant'
import {NavSignupCard} from '#/view/shell/NavSignupCard'
import {atoms as a, tokens, useTheme, web} from '#/alf'
import * as m3e from '#/alf/m3e'
import {BetaTag} from '#/components/BetaTag'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import {ArrowShareRight_Stroke2_Corner2_Rounded as ArrowShareRightIcon} from '#/components/icons/Arrow'
import {
  Bell_Filled_Corner0_Rounded as BellFilledIcon,
  Bell_Stroke2_Corner0_Rounded as BellIcon,
} from '#/components/icons/Bell'
import {
  Bookmark_Filled_Corner0_Rounded as BookmarkFilledIcon,
  Bookmark_Stroke2_Corner0_Rounded as BookmarkIcon,
} from '#/components/icons/Bookmark'
import {BulletList_Stroke2_Corner0_Rounded as ListIcon} from '#/components/icons/BulletList'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {Earth_Stroke2_Corner0_Rounded as EarthIcon} from '#/components/icons/Earth'
import {
  Hashtag_Filled_Corner0_Rounded as HashtagFilledIcon,
  Hashtag_Stroke2_Corner0_Rounded as HashtagIcon,
} from '#/components/icons/Hashtag'
import {
  HomeOpen_Filled_Corner0_Rounded as HomeFilledIcon,
  HomeOpen_Stroke2_Corner0_Rounded as HomeIcon,
} from '#/components/icons/Home'
import {
  MagnifyingGlass_Filled_Stroke2_Corner0_Rounded as MagnifyingGlassFilledIcon,
  MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlassIcon,
} from '#/components/icons/MagnifyingGlass'
import {
  Message_Stroke2_Corner0_Rounded as MessageIcon,
  Message_Stroke2_Corner0_Rounded_Filled as MessageFilledIcon,
} from '#/components/icons/Message'
import {SettingsGear2_Stroke2_Corner0_Rounded as SettingsIcon} from '#/components/icons/Settings'
import {
  UserCircle_Filled_Corner0_Rounded as UserCircleFilledIcon,
  UserCircle_Stroke2_Corner0_Rounded as UserCircleIcon,
} from '#/components/icons/UserCircle'
import {InlineLinkText} from '#/components/Link'
import {OTAChannelNotice} from '#/components/OTAChannelNotice'
import {ProfileBadges} from '#/components/ProfileBadges'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE, IS_WEB} from '#/env'
import {InviteFriendsDialog} from '#/features/inviteFriends'
import {useActorStatus} from '#/features/liveNow'

type SecondarySidebarTab =
  'Atmosphere' | 'Feeds' | 'Lists' | 'Bookmarks' | 'Settings'
const SECONDARY_TAB_ROUTES: Record<
  SecondarySidebarTab,
  'AtmosphereTab' | 'FeedsTab' | 'ListsTab' | 'BookmarksTab' | 'SettingsTab'
> = {
  Atmosphere: 'AtmosphereTab',
  Feeds: 'FeedsTab',
  Lists: 'ListsTab',
  Bookmarks: 'BookmarksTab',
  Settings: 'SettingsTab',
}

let DrawerProfileCard = ({
  account,
  onPressProfile,
  onPressShare,
}: {
  account: SessionAccount
  onPressProfile: () => void
  onPressShare?: () => void
}): React.ReactNode => {
  const {t: l, i18n} = useLingui()
  const t = useTheme()
  const {data: profile} = useProfileQuery({did: account.did})
  const {isActive: live} = useActorStatus(profile)

  return (
    <TouchableOpacity
      testID="profileCardButton"
      accessibilityLabel={l`Profile`}
      accessibilityHint={l`Navigates to your profile`}
      onPress={onPressProfile}
      style={[a.gap_sm, a.pr_lg]}>
      <UserAvatar
        size={52}
        avatar={profile?.avatar}
        // See https://github.com/bluesky-social/social-app/pull/1801:
        usePlainRNImage={true}
        type={profile?.associated?.labeler ? 'labeler' : 'user'}
        live={live}
      />
      <View style={[a.gap_2xs]}>
        <View style={[a.flex_row, a.align_center, a.gap_xs, a.flex_1]}>
          <Text
            emoji
            style={[
              a.font_bold,
              a.text_xl,
              a.mt_2xs,
              a.leading_tight,
              a.flex_shrink,
            ]}
            numberOfLines={1}>
            {profile?.displayName || account.handle}
          </Text>
          {profile && <ProfileBadges profile={profile} size="lg" />}
          {onPressShare && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={l`Invite friends`}
              accessibilityHint={l`Opens the invite friends sheet to share your profile`}
              onPress={onPressShare}
              hitSlop={8}
              style={({pressed}) => [
                a.ml_auto,
                {
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: t.palette.contrast_50,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <ArrowShareRightIcon
                width={16}
                height={16}
                fill={t.palette.primary_500}
              />
            </Pressable>
          )}
        </View>
        <Text
          emoji
          style={[t.atoms.text_contrast_medium, a.text_md, a.leading_tight]}
          numberOfLines={1}>
          {sanitizeHandle(account.handle, '@')}
        </Text>
      </View>
      <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
        <Trans>
          <Text style={[a.text_md, a.font_semi_bold]}>
            {formatCount(i18n, profile?.followersCount ?? 0)}
          </Text>{' '}
          <Plural
            value={profile?.followersCount || 0}
            one="follower"
            other="followers"
          />
        </Trans>{' '}
        &middot;{' '}
        <Trans>
          <Text style={[a.text_md, a.font_semi_bold]}>
            {formatCount(i18n, profile?.followsCount ?? 0)}
          </Text>{' '}
          <Plural
            value={profile?.followsCount || 0}
            one="following"
            other="following"
          />
        </Trans>
      </Text>
    </TouchableOpacity>
  )
}
DrawerProfileCard = memo(DrawerProfileCard)
export {DrawerProfileCard}

let DrawerContent = ({}: React.PropsWithoutRef<{}>): React.ReactNode => {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const setDrawerOpen = useSetDrawerOpen()
  const navigation = useNavigation<RootNavigationProp>()
  const ax = useAnalytics()
  const {
    isAtSearch,
    isAtAtmosphere,
    isAtFeeds,
    isAtLists,
    isAtBookmarks,
    isAtSettings,
    isAtNotifications,
    isAtMyProfile,
    isAtMessages,
  } = useNavigationTabState()
  const {hasSession, currentAccount} = useSession()
  const inviteFriendsControl = useDialogControl()
  const isAtmosphereEnabled = ax.features.enabled(
    ax.features.AtmosphereScreenEnable,
  )

  const currentItem: SidebarTab = isAtSearch
    ? 'Search'
    : isAtMessages
      ? 'Messages'
      : isAtNotifications
        ? 'Notifications'
        : isAtAtmosphere
          ? 'Atmosphere'
          : isAtFeeds
            ? 'Feeds'
            : isAtLists
              ? 'Lists'
              : isAtBookmarks
                ? 'Bookmarks'
                : isAtSettings
                  ? 'Settings'
                  : isAtMyProfile
                    ? 'MyProfile'
                    : 'Home'

  const [pendingItem, setPendingItem] = useState<SidebarTab | null>(null)
  const [prevItem, setPrevItem] = useState(currentItem)
  if (prevItem !== currentItem) {
    setPrevItem(currentItem)
    setPendingItem(null)
  }
  const activeItem = pendingItem ?? currentItem

  const select = (item: SidebarTab, navigate: () => void) => () => {
    setPendingItem(item)
    if (IS_WEB) {
      navigate()
    } else {
      // Let the indicator start animating before the next screen blocks the JS thread
      requestAnimationFrame(navigate)
    }
  }

  // events
  // =

  const onPressTab = useCallback(
    (tab: SharedNavTab, surface: 'drawer' | 'drawerHeader' = 'drawer') => {
      ax.metric('nav:click', {
        item: TAB_TO_NAV_ITEM[tab],
        surface,
      })
      const state: NavigationState = navigation.getState()
      setDrawerOpen(false)
      if (IS_WEB) {
        navigation.dispatch(getTabNavigationAction(tab, currentAccount?.handle))
      } else {
        const tabState = getTabState(state, tab)
        if (tabState === TabState.InsideAtRoot) {
          emitSoftReset()
        } else if (tabState === TabState.Inside) {
          // find the correct navigator in which to pop-to-top
          const target = state.routes.find(route => route.name === `${tab}Tab`)
            ?.state?.key
          if (target) {
            // if we found it, trigger pop-to-top
            navigation.dispatch({
              ...StackActions.popToTop(),
              target,
            })
          } else {
            // fallback: reset navigation
            navigation.dispatch(getTabResetAction(tab))
          }
        } else {
          navigation.dispatch(getTabNavigationAction(tab))
        }
      }
    },
    [navigation, setDrawerOpen, currentAccount, ax],
  )

  const onPressHome = useCallback(() => onPressTab('Home'), [onPressTab])

  const onPressSearch = useCallback(() => onPressTab('Search'), [onPressTab])

  const onPressMessages = useCallback(
    () => onPressTab('Messages'),
    [onPressTab],
  )

  const onPressNotifications = useCallback(
    () => onPressTab('Notifications'),
    [onPressTab],
  )

  const onPressProfile = useCallback(() => {
    onPressTab('MyProfile')
  }, [onPressTab])

  const onPressDrawerHeaderProfile = useCallback(() => {
    onPressTab('MyProfile', 'drawerHeader')
  }, [onPressTab])

  const navigateToSecondaryTab = useCallback(
    (tab: SecondarySidebarTab) => {
      const state: NavigationState = navigation.getState()
      const tabState = getTabState(state, tab)
      const routeName = SECONDARY_TAB_ROUTES[tab]
      if (tabState === TabState.InsideAtRoot) {
        emitSoftReset()
      } else if (tabState === TabState.Inside) {
        const target = state.routes.find(route => route.name === routeName)
          ?.state?.key
        if (target) {
          navigation.dispatch({
            ...StackActions.popToTop(),
            target,
          })
        } else {
          navigation.dispatch(getTabResetAction(tab))
        }
      } else {
        navigation.dispatch(getTabNavigationAction(tab))
      }
      setDrawerOpen(false)
    },
    [navigation, setDrawerOpen],
  )

  const onPressMyFeeds = useCallback(() => {
    ax.metric('nav:click', {item: 'feeds', surface: 'drawer'})
    if (IS_WEB) navigation.dispatch(getTabNavigationAction('Feeds'))
    else navigateToSecondaryTab('Feeds')
    if (IS_WEB) setDrawerOpen(false)
  }, [navigation, navigateToSecondaryTab, setDrawerOpen, ax])

  const onPressAtmosphere = useCallback(() => {
    ax.metric('nav:click', {item: 'atmosphere', surface: 'drawer'})
    if (IS_WEB) navigation.dispatch(getTabNavigationAction('Atmosphere'))
    else navigateToSecondaryTab('Atmosphere')
    if (IS_WEB) setDrawerOpen(false)
  }, [navigation, navigateToSecondaryTab, setDrawerOpen, ax])

  const onPressLists = useCallback(() => {
    ax.metric('nav:click', {item: 'lists', surface: 'drawer'})
    if (IS_WEB) navigation.dispatch(getTabNavigationAction('Lists'))
    else navigateToSecondaryTab('Lists')
    if (IS_WEB) setDrawerOpen(false)
  }, [navigation, navigateToSecondaryTab, setDrawerOpen, ax])

  const onPressBookmarks = useCallback(() => {
    ax.metric('nav:click', {item: 'saved', surface: 'drawer'})
    if (IS_WEB) navigation.dispatch(getTabNavigationAction('Bookmarks'))
    else navigateToSecondaryTab('Bookmarks')
    if (IS_WEB) setDrawerOpen(false)
  }, [navigation, navigateToSecondaryTab, setDrawerOpen, ax])

  const onPressSettings = useCallback(() => {
    ax.metric('nav:click', {item: 'settings', surface: 'drawer'})
    if (IS_WEB) navigation.dispatch(getTabNavigationAction('Settings'))
    else navigateToSecondaryTab('Settings')
    if (IS_WEB) setDrawerOpen(false)
  }, [navigation, navigateToSecondaryTab, setDrawerOpen, ax])

  const onPressFeedback = useCallback(() => {
    void Linking.openURL(
      FEEDBACK_FORM_URL({
        email: currentAccount?.email,
        handle: currentAccount?.handle,
      }),
    )
  }, [currentAccount])

  const onPressHelp = useCallback(() => {
    void Linking.openURL(HELP_DESK_URL)
  }, [])

  // rendering
  // =

  return (
    <View
      testID="drawer"
      style={[
        a.flex_1,
        a.overflow_hidden,
        {
          backgroundColor: m3e.colors(t).surfaceContainerLow,
          borderTopRightRadius: m3e.shape.large,
          borderBottomRightRadius: m3e.shape.large,
        },
      ]}>
      <ScrollView
        style={[a.flex_1]}
        contentContainerStyle={[
          {
            paddingTop: Math.max(
              insets.top + a.pt_xl.paddingTop,
              a.pt_xl.paddingTop,
            ),
          },
        ]}>
        <View style={[a.px_xl]}>
          {hasSession && currentAccount ? (
            <DrawerProfileCard
              account={currentAccount}
              onPressProfile={select('MyProfile', onPressDrawerHeaderProfile)}
              onPressShare={
                IS_NATIVE
                  ? () => {
                      ax.metric('invite:dialog:open', {logContext: 'Drawer'})
                      setDrawerOpen(false)
                      inviteFriendsControl.open()
                    }
                  : undefined
              }
            />
          ) : (
            <View style={[a.pr_xl]}>
              <NavSignupCard />
            </View>
          )}

          <OTAChannelNotice style={[a.mt_lg]} />

          <Divider style={[a.mt_xl, a.mb_sm]} />
        </View>

        {hasSession ? (
          <>
            <SearchMenuItem
              isActive={activeItem === 'Search'}
              onPress={select('Search', onPressSearch)}
            />
            <HomeMenuItem
              isActive={activeItem === 'Home'}
              onPress={select('Home', onPressHome)}
            />
            <ChatMenuItem
              isActive={activeItem === 'Messages'}
              onPress={select('Messages', onPressMessages)}
            />
            <NotificationsMenuItem
              isActive={activeItem === 'Notifications'}
              onPress={select('Notifications', onPressNotifications)}
            />
            {isAtmosphereEnabled && (
              <AtmosphereMenuItem
                isActive={activeItem === 'Atmosphere'}
                onPress={select('Atmosphere', onPressAtmosphere)}
              />
            )}
            <FeedsMenuItem
              isActive={activeItem === 'Feeds'}
              onPress={select('Feeds', onPressMyFeeds)}
            />
            <ListsMenuItem
              isActive={activeItem === 'Lists'}
              onPress={select('Lists', onPressLists)}
            />
            <BookmarksMenuItem
              isActive={activeItem === 'Bookmarks'}
              onPress={select('Bookmarks', onPressBookmarks)}
            />
            <ProfileMenuItem
              isActive={activeItem === 'MyProfile'}
              onPress={select('MyProfile', onPressProfile)}
            />
            <SettingsMenuItem
              isActive={activeItem === 'Settings'}
              onPress={select('Settings', onPressSettings)}
            />
          </>
        ) : (
          <>
            <HomeMenuItem
              isActive={activeItem === 'Home'}
              onPress={select('Home', onPressHome)}
            />
            <FeedsMenuItem
              isActive={activeItem === 'Feeds'}
              onPress={select('Feeds', onPressMyFeeds)}
            />
            <SearchMenuItem
              isActive={activeItem === 'Search'}
              onPress={select('Search', onPressSearch)}
            />
          </>
        )}

        <View style={[a.px_xl]}>
          <Divider style={[a.mb_xl, a.mt_sm]} />
          <ExtraLinks />
        </View>
      </ScrollView>

      <DrawerFooter
        onPressFeedback={onPressFeedback}
        onPressHelp={onPressHelp}
      />
      <InviteFriendsDialog control={inviteFriendsControl} />
    </View>
  )
}
DrawerContent = memo(DrawerContent)
export {DrawerContent}

let DrawerFooter = ({
  onPressFeedback,
  onPressHelp,
}: {
  onPressFeedback: () => void
  onPressHelp: () => void
}): React.ReactNode => {
  const {t: l} = useLingui()
  const insets = useSafeAreaInsets()
  return (
    <View
      style={[
        a.flex_row,
        a.gap_sm,
        a.flex_wrap,
        a.pl_xl,
        a.pt_md,
        {
          paddingBottom: Math.max(
            insets.bottom + tokens.space.xs,
            tokens.space.xl,
          ),
        },
      ]}>
      <Button
        label={l`Send feedback`}
        size="small"
        variant="solid"
        color="secondary"
        onPress={onPressFeedback}>
        <ButtonIcon icon={MessageIcon} position="left" />
        <ButtonText>
          <Trans>Feedback</Trans>
        </ButtonText>
      </Button>
      <Button
        label={l`Get help`}
        size="small"
        variant="outline"
        color="secondary"
        onPress={onPressHelp}
        style={{
          backgroundColor: 'transparent',
        }}>
        <ButtonText>
          <Trans>Help</Trans>
        </ButtonText>
      </Button>
    </View>
  )
}
DrawerFooter = memo(DrawerFooter)

type DrawerItemProps = {
  isActive: boolean
  onPress: () => void
}

let SearchMenuItem = ({
  isActive,
  onPress,
}: DrawerItemProps): React.ReactNode => {
  const {t: l} = useLingui()
  return (
    <MenuItem
      icon={MagnifyingGlassIcon}
      activeIcon={MagnifyingGlassFilledIcon}
      label={l`Explore`}
      active={isActive}
      onPress={onPress}
    />
  )
}
SearchMenuItem = memo(SearchMenuItem)

let HomeMenuItem = ({isActive, onPress}: DrawerItemProps): React.ReactNode => {
  const {t: l} = useLingui()
  return (
    <MenuItem
      icon={HomeIcon}
      activeIcon={HomeFilledIcon}
      label={l`Home`}
      active={isActive}
      onPress={onPress}
    />
  )
}
HomeMenuItem = memo(HomeMenuItem)

let ChatMenuItem = ({isActive, onPress}: DrawerItemProps): React.ReactNode => {
  const {t: l} = useLingui()
  return (
    <MenuItem
      icon={MessageIcon}
      activeIcon={MessageFilledIcon}
      label={l`Chat`}
      active={isActive}
      onPress={onPress}
    />
  )
}
ChatMenuItem = memo(ChatMenuItem)

let NotificationsMenuItem = ({
  isActive,
  onPress,
}: DrawerItemProps): React.ReactNode => {
  const {t: l} = useLingui()
  const numUnreadNotifications = useUnreadNotifications()
  return (
    <MenuItem
      icon={BellIcon}
      activeIcon={BellFilledIcon}
      label={l`Notifications`}
      accessibilityHint={
        numUnreadNotifications === ''
          ? ''
          : plural(numUnreadNotifications ?? 0, {
              one: '# unread item',
              other: '# unread items',
            })
      }
      count={numUnreadNotifications}
      active={isActive}
      onPress={onPress}
    />
  )
}
NotificationsMenuItem = memo(NotificationsMenuItem)

function AtmosphereMenuItem({isActive, onPress}: DrawerItemProps) {
  const {t: l} = useLingui()
  return (
    <MenuItem
      icon={EarthIcon}
      label={l`Atmosphere`}
      beta
      active={isActive}
      onPress={onPress}
    />
  )
}

let FeedsMenuItem = ({isActive, onPress}: DrawerItemProps): React.ReactNode => {
  const {t: l} = useLingui()
  return (
    <MenuItem
      icon={HashtagIcon}
      activeIcon={HashtagFilledIcon}
      label={l`Feeds`}
      active={isActive}
      onPress={onPress}
    />
  )
}
FeedsMenuItem = memo(FeedsMenuItem)

let ListsMenuItem = ({isActive, onPress}: DrawerItemProps): React.ReactNode => {
  const {t: l} = useLingui()
  return (
    <MenuItem
      icon={ListIcon}
      label={l`Lists`}
      active={isActive}
      onPress={onPress}
    />
  )
}
ListsMenuItem = memo(ListsMenuItem)

let BookmarksMenuItem = ({
  isActive,
  onPress,
}: DrawerItemProps): React.ReactNode => {
  const {t: l} = useLingui()
  return (
    <MenuItem
      icon={BookmarkIcon}
      activeIcon={BookmarkFilledIcon}
      label={l({message: 'Saved', context: 'link to bookmarks screen'})}
      active={isActive}
      onPress={onPress}
    />
  )
}
BookmarksMenuItem = memo(BookmarksMenuItem)

let ProfileMenuItem = ({
  isActive,
  onPress,
}: DrawerItemProps): React.ReactNode => {
  const {t: l} = useLingui()
  return (
    <MenuItem
      icon={UserCircleIcon}
      activeIcon={UserCircleFilledIcon}
      label={l`Profile`}
      active={isActive}
      onPress={onPress}
    />
  )
}
ProfileMenuItem = memo(ProfileMenuItem)

let SettingsMenuItem = ({
  isActive,
  onPress,
}: DrawerItemProps): React.ReactNode => {
  const {i18n, t: l} = useLingui()
  const unreadCountQuery = useModerationInboxUnreadCountQuery()
  const unreadCount = unreadCountQuery.data?.unreadCounts.total ?? 0
  const count =
    unreadCount > 0
      ? unreadCount >= UNREAD_NOTIFICATION_CAP
        ? l({
            message: `${i18n.number(UNREAD_NOTIFICATION_CAP - 1)}+`,
            comment:
              'Displayed when the number of notifications exceeds the cap – for example, 99+',
          })
        : i18n.number(unreadCount)
      : undefined

  return (
    <MenuItem
      icon={SettingsIcon}
      label={l`Settings`}
      count={count}
      accessibilityHint={
        unreadCount > 0
          ? plural(unreadCount, {
              one: '# unread update',
              other: '# unread updates',
            })
          : ''
      }
      active={isActive}
      onPress={onPress}
    />
  )
}
SettingsMenuItem = memo(SettingsMenuItem)

function MenuItem({
  beta,
  icon: Icon,
  activeIcon: ActiveIcon = Icon,
  label,
  count,
  active,
  onPress,
  accessibilityHint,
}: {
  beta?: boolean
  icon: React.ComponentType<SVGIconProps>
  activeIcon?: React.ComponentType<SVGIconProps>
  label: string
  count?: string
  active: boolean
  onPress: () => void
  accessibilityHint?: string
}) {
  const t = useTheme()
  const c = m3e.colors(t)
  const {t: l} = useLingui()
  const accessibilityLabel = beta ? l`${label}, Beta` : label
  const selection = useSharedValue(active ? 1 : 0)
  const interaction = useSharedValue(0)

  useEffect(() => {
    selection.set(withSpring(active ? 1 : 0, m3e.motion.defaultSpatial))
  }, [active, selection])

  const indicatorStyle = useAnimatedStyle(() => {
    const value = selection.get()
    return {
      opacity: interpolate(value, [0, 0.5], [0, 1], Extrapolation.CLAMP),
      transform: [{scale: interpolate(value, [0, 1], [0.92, 1])}],
    }
  })

  const stateLayerStyle = useAnimatedStyle(() => ({
    opacity: interaction.get(),
  }))

  const setInteraction = (opacity: number, isEntering: boolean) => {
    interaction.set(
      withSpring(
        opacity,
        isEntering ? m3e.motion.fastEffects : m3e.motion.defaultEffects,
      ),
    )
  }

  const contentColor = active ? c.onSecondaryContainer : c.onSurfaceVariant
  const CurrentIcon = active ? ActiveIcon : Icon

  return (
    <Pressable
      testID={`menuItemButton-${label}`}
      onPress={onPress}
      onPressIn={() => setInteraction(m3e.stateLayer.pressed, true)}
      onPressOut={() => setInteraction(0, false)}
      onHoverIn={() => setInteraction(m3e.stateLayer.hovered, true)}
      onHoverOut={() => setInteraction(0, false)}
      accessibilityRole="tab"
      accessibilityState={{selected: active}}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={[
        a.flex_row,
        a.align_center,
        a.gap_md,
        {
          height: 56,
          marginHorizontal: 8,
          paddingLeft: 12,
          paddingRight: 20,
        },
      ]}>
      <Animated.View
        style={[
          a.absolute,
          a.inset_0,
          {
            borderRadius: m3e.shape.full,
            backgroundColor: c.secondaryContainer,
          },
          indicatorStyle,
        ]}
      />
      <Animated.View
        style={[
          a.absolute,
          a.inset_0,
          {borderRadius: m3e.shape.full, backgroundColor: contentColor},
          stateLayerStyle,
        ]}
      />
      <CurrentIcon width={24} style={{color: contentColor}} />
      <View style={[a.flex_1, a.flex_row, a.align_center, a.gap_sm]}>
        <Text
          style={[
            a.flex_shrink,
            a.text_lg,
            active ? a.font_bold : a.font_medium,
            {color: contentColor},
            web(a.leading_snug),
          ]}
          numberOfLines={1}>
          {label}
        </Text>
        {beta && <BetaTag />}
      </View>
      {count ? (
        <View
          style={[
            a.rounded_full,
            a.align_center,
            a.justify_center,
            {
              minWidth: 24,
              height: 24,
              paddingHorizontal: 8,
              backgroundColor: c.primary,
            },
          ]}>
          <Text
            style={[
              a.text_xs,
              a.font_semi_bold,
              {fontVariant: ['tabular-nums'], color: c.onPrimary},
            ]}
            numberOfLines={1}>
            {count}
          </Text>
        </View>
      ) : null}
    </Pressable>
  )
}

function ExtraLinks() {
  const {t: l} = useLingui()
  const t = useTheme()
  const logoVariant = useLogoVariant()

  return (
    <View style={[a.flex_col, a.gap_md, a.flex_wrap]}>
      <InlineLinkText
        style={[a.text_md]}
        label={l`Terms of Service`}
        to="https://bsky.social/about/support/tos">
        <Trans>Terms of Service</Trans>
      </InlineLinkText>
      <InlineLinkText
        style={[a.text_md]}
        to="https://bsky.social/about/support/privacy-policy"
        label={l`Privacy Policy`}>
        <Trans>Privacy Policy</Trans>
      </InlineLinkText>
      {logoVariant === 'kawaii' && (
        <Text style={t.atoms.text_contrast_medium}>
          <Trans>
            Logo by{' '}
            <InlineLinkText
              style={[a.text_md]}
              to="/profile/sawaratsuki.bsky.social"
              label="@sawaratsuki.bsky.social">
              @sawaratsuki.bsky.social
            </InlineLinkText>
          </Trans>
        </Text>
      )}
    </View>
  )
}
