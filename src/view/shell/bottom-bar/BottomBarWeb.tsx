import {useCallback, useEffect} from 'react'
import {View} from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import {msg, plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useNavigationState} from '@react-navigation/native'

import {useMinimalShellFooterTransform} from '#/lib/hooks/useMinimalShellTransform'
import {getCurrentRoute, isTab} from '#/lib/routes/helpers'
import {makeProfileLink} from '#/lib/routes/links'
import {type CommonNavigatorParams} from '#/lib/routes/types'
import {useHomeBadge} from '#/state/home-badge'
import {useHideTabLabels} from '#/state/preferences'
import {useUnreadMessageCount} from '#/state/queries/messages/list-conversations'
import {useUnreadNotifications} from '#/state/queries/notifications/unread'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useShellLayout} from '#/state/shell/shell-layout'
import {useCloseAllActiveElements} from '#/state/util'
import {Link} from '#/view/com/util/Link'
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
import {type Props as SVGIconProps} from '#/components/icons/common'
import {
  HomeOpen_Filled_Corner0_Rounded as HomeFilled,
  HomeOpen_Stoke2_Corner0_Rounded as Home,
} from '#/components/icons/HomeOpen'
import {
  MagnifyingGlass_Filled_Stroke2_Corner0_Rounded as MagnifyingGlassFilled,
  MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlass,
} from '#/components/icons/MagnifyingGlass'
import {
  Message_Stroke2_Corner0_Rounded as Message,
  Message_Stroke2_Corner0_Rounded_Filled as MessageFilled,
} from '#/components/icons/Message'
import {Text} from '#/components/Typography'
import {useAgeAssurance} from '#/ageAssurance'
import {useAnalytics} from '#/analytics'
import {isFollowingV2HomeDotEnabled} from '#/features/followingV2/eligibility'
import {useActorStatus} from '#/features/liveNow'
import {styles, useNavBarHeight} from './BottomBarStyles'

type NavItemValue = 'home' | 'search' | 'chat' | 'notifications' | 'profile'
const ICON_SIZE = 24
const AVATAR_SIZE = 26

export function BottomBarWeb() {
  const {_} = useLingui()
  const {hasSession, currentAccount} = useSession()
  const t = useTheme()
  const c = m3e.colors(t)
  const navBarHeight = useNavBarHeight()
  const footerMinimalShellTransform = useMinimalShellFooterTransform()
  const {requestSwitchToAccount} = useLoggedOutViewControls()
  const closeAllActiveElements = useCloseAllActiveElements()
  const {footerHeight} = useShellLayout()
  const accountSwitchControl = useDialogControl()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})

  const unreadMessageCount = useUnreadMessageCount()
  const notificationCountStr = useUnreadNotifications()
  const hasHomeBadge = useHomeBadge()
  const ax = useAnalytics()
  const aa = useAgeAssurance()
  const {isActive: live} = useActorStatus(profile)
  const isLabeler = profile?.associated?.labeler

  const showSignIn = useCallback(() => {
    closeAllActiveElements()
    requestSwitchToAccount({requestedAccount: 'none'})
  }, [requestSwitchToAccount, closeAllActiveElements])

  const showCreateAccount = useCallback(() => {
    closeAllActiveElements()
    requestSwitchToAccount({requestedAccount: 'new'})
  }, [requestSwitchToAccount, closeAllActiveElements])

  const onLongPressProfile = useCallback(() => {
    accountSwitchControl.open()
  }, [accountSwitchControl])

  return (
    <>
      <SwitchAccountDialog control={accountSwitchControl} />

      <Animated.View
        role="navigation"
        style={[
          styles.bottomBar,
          styles.bottomBarWeb,
          {
            backgroundColor: c.surfaceContainer,
            borderTopWidth: 0,
            paddingBottom: 8,
          },
          footerMinimalShellTransform,
        ]}
        onLayout={event => footerHeight.set(event.nativeEvent.layout.height)}>
        {hasSession ? (
          <View
            style={[styles.items, a.w_full, {height: navBarHeight}]}
            accessibilityRole="tablist">
            <NavItem
              routeName="Home"
              href="/"
              navItem="home"
              label={_(msg`Home`)}
              icon={Home}
              activeIcon={HomeFilled}
              hasNew={hasHomeBadge && isFollowingV2HomeDotEnabled(ax)}
            />
            <NavItem
              routeName="Search"
              href="/search"
              navItem="search"
              label={_(msg`Search`)}
              icon={MagnifyingGlass}
              activeIcon={MagnifyingGlassFilled}
            />
            <NavItem
              routeName="Messages"
              href="/messages"
              navItem="chat"
              label={_(msg`Chat`)}
              icon={Message}
              activeIcon={MessageFilled}
              notificationCount={
                aa.flags.chatDisabled ? undefined : unreadMessageCount.numUnread
              }
              hasNew={aa.flags.chatDisabled ? false : unreadMessageCount.hasNew}
            />
            <NavItem
              routeName="Notifications"
              href="/notifications"
              navItem="notifications"
              label={_(msg`Notifications`)}
              icon={Bell}
              activeIcon={BellFilled}
              notificationCount={notificationCountStr}
            />
            <NavItem
              routeName="Profile"
              href={
                currentAccount
                  ? makeProfileLink({
                      did: currentAccount.did,
                      handle: currentAccount.handle,
                    })
                  : '/'
              }
              navItem="profile"
              label={_(msg`Profile`)}
              onLongPress={onLongPressProfile}
              renderIcon={active => (
                <View
                  style={{
                    padding: 1.5,
                    borderWidth: live ? 0 : 1.5,
                    borderRadius: isLabeler ? 6 : AVATAR_SIZE,
                    borderColor: active
                      ? c.onSecondaryContainer
                      : 'transparent',
                  }}>
                  <UserAvatar
                    avatar={profile?.avatar}
                    size={AVATAR_SIZE - 6}
                    type={isLabeler ? 'labeler' : 'user'}
                    live={live}
                    hideLiveBadge
                  />
                </View>
              )}
            />
          </View>
        ) : (
          <View
            style={[
              a.w_full,
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
                label={_(msg`Create account`)}
                size="small"
                color="primary">
                <ButtonText>
                  <Trans>Create account</Trans>
                </ButtonText>
              </Button>
              <Button
                onPress={showSignIn}
                label={_(msg`Sign in`)}
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

function NavItem({
  href,
  routeName,
  navItem,
  label,
  icon: Icon,
  activeIcon: ActiveIcon,
  renderIcon,
  hasNew,
  notificationCount,
  onLongPress,
}: {
  href: string
  routeName: string
  navItem: NavItemValue
  label: string
  icon?: React.ComponentType<SVGIconProps>
  activeIcon?: React.ComponentType<SVGIconProps>
  renderIcon?: (active: boolean) => React.ReactNode
  hasNew?: boolean
  notificationCount?: string
  onLongPress?: () => void
}) {
  const t = useTheme()
  const c = m3e.colors(t)
  const {_} = useLingui()
  const ax = useAnalytics()
  const hideLabel = useHideTabLabels()
  const {currentAccount} = useSession()
  const currentRoute = useNavigationState(state => {
    if (!state) {
      return {name: 'Home'}
    }
    return getCurrentRoute(state)
  })

  const onBeforePress = useCallback(() => {
    ax.metric('nav:click', {item: navItem, surface: 'bottomBar'})
  }, [ax, navItem])

  const isOnDifferentProfile =
    currentRoute.name === 'Profile' &&
    routeName === 'Profile' &&
    (currentRoute.params as CommonNavigatorParams['Profile']).name !==
      currentAccount?.handle

  const isActive =
    currentRoute.name === 'Profile'
      ? isTab(currentRoute.name, routeName) &&
        (currentRoute.params as CommonNavigatorParams['Profile']).name ===
          (routeName === 'Profile'
            ? currentAccount?.handle
            : (currentRoute.params as CommonNavigatorParams['Profile']).name)
      : isTab(currentRoute.name, routeName)

  const selection = useSharedValue(isActive ? 1 : 0)
  useEffect(() => {
    selection.set(withSpring(isActive ? 1 : 0, m3e.motion.fastSpatial))
  }, [isActive, selection])

  const indicatorStyle = useAnimatedStyle(() => {
    const value = selection.get()
    return {
      opacity: interpolate(value, [0, 0.4], [0, 1], Extrapolation.CLAMP),
      transform: [{scaleX: interpolate(value, [0, 1], [0.3, 1])}],
    }
  })

  const iconColor = isActive ? c.onSecondaryContainer : c.onSurfaceVariant
  const CurrentIcon = isActive && ActiveIcon ? ActiveIcon : Icon

  return (
    <Link
      href={href}
      style={[
        styles.item,
        hideLabel && styles.itemCompact,
        {flexDirection: 'column'},
      ]}
      navigationAction={isOnDifferentProfile ? 'push' : 'navigate'}
      aria-role="link"
      aria-label={label}
      accessible={true}
      onBeforePress={onBeforePress}
      onLongPress={onLongPress}>
      <View style={styles.indicatorBox}>
        <Animated.View
          style={[
            styles.indicator,
            {backgroundColor: c.secondaryContainer},
            indicatorStyle,
          ]}
        />
        {renderIcon
          ? renderIcon(isActive)
          : CurrentIcon && (
              <CurrentIcon width={ICON_SIZE} style={{color: iconColor}} />
            )}
        {notificationCount ? (
          <View
            style={[styles.largeBadge, {backgroundColor: c.error}]}
            aria-label={_(
              msg`${plural(notificationCount, {
                one: '# unread item',
                other: '# unread items',
              })}`,
            )}>
            <Text style={[styles.largeBadgeLabel, {color: c.onError}]}>
              {notificationCount}
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
            isActive ? a.font_bold : a.font_medium,
            {color: isActive ? c.onSurface : c.onSurfaceVariant},
          ]}
          numberOfLines={1}>
          {label}
        </Text>
      )}
    </Link>
  )
}
