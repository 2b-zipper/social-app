import {useEffect, useState} from 'react'
import {type GestureResponderEvent, Pressable, View} from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'
import {type BottomTabBarProps} from '@react-navigation/bottom-tabs'
import {StackActions} from '@react-navigation/native'

import {BOTTOM_BAR_AVI} from '#/lib/demo'
import {useHaptics} from '#/lib/haptics'
import {useDedupe} from '#/lib/hooks/useDedupe'
import {useMinimalShellFooterTransform} from '#/lib/hooks/useMinimalShellTransform'
import {useNavigationTabState} from '#/lib/hooks/useNavigationTabState'
import {getTabState, TabState} from '#/lib/routes/helpers'
import {type SharedNavTab, TAB_TO_NAV_ITEM} from '#/lib/routes/tab-to-nav-item'
import {emitSoftReset} from '#/state/events'
import {useHomeBadge} from '#/state/home-badge'
import {useHideTabLabels} from '#/state/preferences'
import {useUnreadMessageCount} from '#/state/queries/messages/list-conversations'
import {useUpdateAllRead} from '#/state/queries/messages/update-all-read'
import {useUnreadNotifications} from '#/state/queries/notifications/unread'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useShellLayout} from '#/state/shell/shell-layout'
import {useCloseAllActiveElements} from '#/state/util'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {Logo} from '#/view/icons/Logo'
import {Logotype} from '#/view/icons/Logotype'
import {atoms as a, useTheme} from '#/alf'
import * as m3e from '#/alf/m3e'
import {Button, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {SwitchAccountDialog} from '#/components/dialogs/SwitchAccount'
import {
  Bell_Filled_Corner0_Rounded as BellFilled,
  Bell_Stroke2_Corner0_Rounded as Bell,
} from '#/components/icons/Bell'
import {CircleCheck_Stroke2_Corner0_Rounded as CircleCheckIcon} from '#/components/icons/CircleCheck'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {
  HomeOpen_Filled_Corner0_Rounded as HomeFilled,
  HomeOpen_Stoke2_Corner0_Rounded as Home,
} from '#/components/icons/HomeOpen'
import {Inbox_Stroke2_Corner2_Rounded as InboxIcon} from '#/components/icons/Inbox'
import {
  MagnifyingGlass_Filled_Stroke2_Corner0_Rounded as MagnifyingGlassFilled,
  MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlass,
} from '#/components/icons/MagnifyingGlass'
import {
  Message_Stroke2_Corner0_Rounded as Message,
  Message_Stroke2_Corner0_Rounded_Filled as MessageFilled,
} from '#/components/icons/Message'
import * as Menu from '#/components/Menu'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useAgeAssurance} from '#/ageAssurance'
import {useAnalytics} from '#/analytics'
import {isFollowingV2HomeDotEnabled} from '#/features/followingV2/eligibility'
import {useActorStatus} from '#/features/liveNow'
import {useDemoMode} from '#/storage/hooks/demo-mode'
import {navBarBottomInset, styles, useNavBarHeight} from './BottomBarStyles'

const ICON_SIZE = 24
const AVATAR_SIZE = 26

export function BottomBar({navigation}: BottomTabBarProps) {
  const {hasSession, currentAccount} = useSession()
  const t = useTheme()
  const c = m3e.colors(t)
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const safeAreaInsets = useSafeAreaInsets()
  const navBarHeight = useNavBarHeight()
  const {footerHeight} = useShellLayout()
  const {isAtHome, isAtSearch, isAtNotifications, isAtMyProfile, isAtMessages} =
    useNavigationTabState()
  const numUnreadNotifications = useUnreadNotifications()
  const numUnreadMessages = useUnreadMessageCount()
  const hasHomeBadge = useHomeBadge()
  const aa = useAgeAssurance()
  const footerMinimalShellTransform = useMinimalShellFooterTransform()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})
  const {requestSwitchToAccount} = useLoggedOutViewControls()
  const closeAllActiveElements = useCloseAllActiveElements()
  const dedupe = useDedupe()
  const accountSwitchControl = useDialogControl()
  const messagesMenuControl = Menu.useMenuControl()
  const haptics = useHaptics()
  const [demoMode] = useDemoMode()
  const {isActive: live} = useActorStatus(profile)
  const isLabeler = profile?.associated?.labeler

  const currentTab: SharedNavTab | null = isAtHome
    ? 'Home'
    : isAtSearch
      ? 'Search'
      : isAtMessages
        ? 'Messages'
        : isAtNotifications
          ? 'Notifications'
          : isAtMyProfile
            ? 'MyProfile'
            : null

  const [pendingTab, setPendingTab] = useState<SharedNavTab | null>(null)
  const [prevTab, setPrevTab] = useState(currentTab)
  if (prevTab !== currentTab) {
    setPrevTab(currentTab)
    setPendingTab(null)
  }
  const activeTab = pendingTab ?? currentTab

  const showSignIn = () => {
    closeAllActiveElements()
    requestSwitchToAccount({requestedAccount: 'none'})
  }

  const showCreateAccount = () => {
    closeAllActiveElements()
    requestSwitchToAccount({requestedAccount: 'new'})
  }

  const onPressTab = (tab: SharedNavTab) => {
    ax.metric('nav:click', {
      item: TAB_TO_NAV_ITEM[tab],
      surface: 'bottomBar',
    })
    const state = navigation.getState()
    const tabState = getTabState(state, tab)
    if (tabState === TabState.InsideAtRoot) {
      emitSoftReset()
      return
    }
    if (tabState === TabState.Outside) setPendingTab(tab)
    // Let the indicator start animating before the next screen blocks the JS thread
    requestAnimationFrame(() => {
      if (tabState === TabState.Inside) {
        const target = state.routes.find(route => route.name === `${tab}Tab`)
          ?.state?.key
        dedupe(() => {
          if (target) {
            navigation.dispatch({...StackActions.popToTop(), target})
          } else {
            navigation.reset({index: 0, routes: [{name: `${tab}Tab`}]})
          }
        })
      } else {
        dedupe(() => navigation.navigate(`${tab}Tab`))
      }
    })
  }

  const onLongPressProfile = () => {
    haptics.longPress()
    accountSwitchControl.open()
  }

  const onLongPressMessages = () => {
    if (aa.flags.chatDisabled) return
    haptics.longPress()
    messagesMenuControl.open()
  }

  return (
    <>
      <SwitchAccountDialog control={accountSwitchControl} />
      <MessagesTabMenu control={messagesMenuControl} />
      <Animated.View
        style={[
          styles.bottomBar,
          {
            backgroundColor: c.surfaceContainer,
            paddingBottom: navBarBottomInset(safeAreaInsets.bottom),
          },
          footerMinimalShellTransform,
        ]}
        onLayout={e => {
          footerHeight.set(e.nativeEvent.layout.height)
        }}>
        {hasSession ? (
          <View
            style={[styles.items, {height: navBarHeight}]}
            accessibilityRole="tablist">
            <NavBarItem
              testID="bottomBarHomeBtn"
              active={activeTab === 'Home'}
              icon={Home}
              activeIcon={HomeFilled}
              label={l`Home`}
              hasNew={hasHomeBadge && isFollowingV2HomeDotEnabled(ax)}
              onPress={() => onPressTab('Home')}
              accessibilityHint=""
            />
            <NavBarItem
              testID="bottomBarSearchBtn"
              active={activeTab === 'Search'}
              icon={MagnifyingGlass}
              activeIcon={MagnifyingGlassFilled}
              label={l`Search`}
              onPress={() => onPressTab('Search')}
              accessibilityHint=""
            />
            <NavBarItem
              testID="bottomBarMessagesBtn"
              active={activeTab === 'Messages'}
              icon={Message}
              activeIcon={MessageFilled}
              label={l`Chat`}
              onPress={() => onPressTab('Messages')}
              onLongPress={onLongPressMessages}
              count={
                aa.flags.chatDisabled ? undefined : numUnreadMessages.numUnread
              }
              hasNew={aa.flags.chatDisabled ? false : numUnreadMessages.hasNew}
              accessibilityHint={
                !aa.flags.chatDisabled && numUnreadMessages.count > 0
                  ? numUnreadMessages.numUnread?.includes('+')
                    ? l({
                        message: `${numUnreadMessages.numUnread} unread items`,
                        comment:
                          'Accessibility hint for the bottom bar chat icon when the number of unread messages exceeds the cap, with the + symbol already included – for example, 99+ unread items',
                      })
                    : l({
                        message: plural(numUnreadMessages.numUnread ?? 0, {
                          one: '# unread item',
                          other: '# unread items',
                        }),
                      })
                  : ''
              }
            />
            <NavBarItem
              testID="bottomBarNotificationsBtn"
              active={activeTab === 'Notifications'}
              icon={Bell}
              activeIcon={BellFilled}
              label={l`Notifications`}
              onPress={() => onPressTab('Notifications')}
              count={numUnreadNotifications}
              accessibilityHint={
                numUnreadNotifications === ''
                  ? ''
                  : l({
                      message: plural(numUnreadNotifications ?? 0, {
                        one: '# unread item',
                        other: '# unread items',
                      }),
                    })
              }
            />
            <NavBarItem
              testID="bottomBarProfileBtn"
              active={activeTab === 'MyProfile'}
              renderIcon={active => (
                <View
                  style={[
                    {
                      padding: 1.5,
                      borderWidth: live ? 0 : 1.5,
                      borderRadius: isLabeler ? 6 : AVATAR_SIZE,
                      borderColor: active
                        ? c.onSecondaryContainer
                        : 'transparent',
                    },
                  ]}>
                  <UserAvatar
                    avatar={demoMode ? BOTTOM_BAR_AVI : profile?.avatar}
                    size={AVATAR_SIZE - 6}
                    // See https://github.com/bluesky-social/social-app/pull/1801:
                    usePlainRNImage={true}
                    type={isLabeler ? 'labeler' : 'user'}
                    live={live}
                    hideLiveBadge
                  />
                </View>
              )}
              label={l`Profile`}
              onPress={() => onPressTab('MyProfile')}
              onLongPress={onLongPressProfile}
              accessibilityHint=""
            />
          </View>
        ) : (
          <View
            style={[
              a.flex_row,
              a.align_center,
              a.justify_between,
              a.gap_sm,
              {
                minHeight: 64,
                paddingVertical: 8,
                paddingLeft: 16,
                paddingRight: 12,
              },
            ]}>
            <View style={[a.flex_row, a.align_center, a.gap_sm]}>
              <Logo allowVariants={false} width={28} />
              <View style={{paddingTop: 4}}>
                <Logotype width={80} fill={t.atoms.text.color} />
              </View>
            </View>

            <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
              <Button
                onPress={showCreateAccount}
                label={l`Create account`}
                size="small"
                color="primary">
                <ButtonText>
                  <Trans>Create account</Trans>
                </ButtonText>
              </Button>
              <Button
                onPress={showSignIn}
                label={l`Sign in`}
                size="small"
                color="secondary">
                <ButtonText>
                  <Trans>Sign in</Trans>
                </ButtonText>
              </Button>
            </View>
          </View>
        )}
      </Animated.View>
    </>
  )
}

function NavBarItem({
  testID,
  active,
  icon: Icon,
  activeIcon: ActiveIcon,
  renderIcon,
  label,
  count,
  hasNew = false,
  onPress,
  onLongPress,
  accessibilityHint,
}: {
  testID: string
  active: boolean
  icon?: React.ComponentType<SVGIconProps>
  activeIcon?: React.ComponentType<SVGIconProps>
  renderIcon?: (active: boolean) => React.ReactNode
  label: string
  count?: string
  hasNew?: boolean
  onPress: () => void
  onLongPress?: (event: GestureResponderEvent) => void
  accessibilityHint: string
}) {
  const t = useTheme()
  const c = m3e.colors(t)
  const hideLabel = useHideTabLabels()
  const selection = useSharedValue(active ? 1 : 0)
  const interaction = useSharedValue(0)

  useEffect(() => {
    selection.set(withSpring(active ? 1 : 0, m3e.motion.fastSpatial))
  }, [active, selection])

  const indicatorStyle = useAnimatedStyle(() => {
    const value = selection.get()
    return {
      opacity: interpolate(value, [0, 0.4], [0, 1], Extrapolation.CLAMP),
      transform: [{scaleX: interpolate(value, [0, 1], [0.3, 1])}],
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

  const iconColor = active ? c.onSecondaryContainer : c.onSurfaceVariant
  const CurrentIcon = active && ActiveIcon ? ActiveIcon : Icon

  return (
    <Pressable
      testID={testID}
      style={[styles.item, hideLabel && styles.itemCompact]}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => setInteraction(m3e.stateLayer.pressed, true)}
      onPressOut={() => setInteraction(0, false)}
      onHoverIn={() => setInteraction(m3e.stateLayer.hovered, true)}
      onHoverOut={() => setInteraction(0, false)}
      accessibilityRole="tab"
      accessibilityState={{selected: active}}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityLargeContentTitle={label}
      accessibilityShowsLargeContentViewer>
      <View style={styles.indicatorBox}>
        <Animated.View
          style={[
            styles.indicator,
            {backgroundColor: c.secondaryContainer},
            indicatorStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.indicator,
            {
              backgroundColor: active
                ? c.onSecondaryContainer
                : c.onSurfaceVariant,
            },
            stateLayerStyle,
          ]}
        />
        {renderIcon
          ? renderIcon(active)
          : CurrentIcon && (
              <CurrentIcon width={ICON_SIZE} style={{color: iconColor}} />
            )}
        {count ? (
          <View style={[styles.largeBadge, {backgroundColor: c.error}]}>
            <Text
              style={[styles.largeBadgeLabel, {color: c.onError}]}
              maxFontSizeMultiplier={1.3}>
              {count}
            </Text>
          </View>
        ) : hasNew ? (
          <View style={[styles.smallBadge, {backgroundColor: c.error}]} />
        ) : null}
      </View>
      {!hideLabel && (
        <Text
          style={[
            styles.label,
            active ? a.font_bold : a.font_medium,
            {color: active ? c.onSurface : c.onSurfaceVariant},
          ]}
          numberOfLines={1}
          maxFontSizeMultiplier={1.3}>
          {label}
        </Text>
      )}
    </Pressable>
  )
}

function MessagesTabMenu({control}: {control: Menu.MenuControlProps}) {
  const {t: l} = useLingui()

  const {mutate: markAllChatsRead} = useUpdateAllRead('accepted', {
    onMutate: () => {
      Toast.show(l`Marked all chats as read`, {type: 'success'})
    },
    onError: () => {
      Toast.show(l`Failed to mark all chats as read`, {type: 'error'})
    },
  })

  const {mutate: markAllRequestsRead} = useUpdateAllRead('request', {
    onMutate: () => {
      Toast.show(l`Marked all requests as read`, {type: 'success'})
    },
    onError: () => {
      Toast.show(l`Failed to mark all requests as read`, {type: 'error'})
    },
  })

  return (
    <Menu.Root control={control}>
      <Menu.Outer showCancel>
        <Menu.Group>
          <Menu.Item
            label={l`Mark all chats as read`}
            onPress={() => markAllChatsRead()}>
            <Menu.ItemIcon icon={CircleCheckIcon} />
            <Menu.ItemText>
              <Trans>Mark all chats as read</Trans>
            </Menu.ItemText>
          </Menu.Item>
          <Menu.Item
            label={l`Mark all requests as read`}
            onPress={() => markAllRequestsRead()}>
            <Menu.ItemIcon icon={InboxIcon} />
            <Menu.ItemText>
              <Trans>Mark all requests as read</Trans>
            </Menu.ItemText>
          </Menu.Item>
        </Menu.Group>
      </Menu.Outer>
    </Menu.Root>
  )
}
