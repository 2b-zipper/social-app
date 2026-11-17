import {StyleSheet, useWindowDimensions} from 'react-native'
import Animated, {ZoomIn, ZoomOut} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useMediaQuery} from 'react-responsive'

import {HITSLOP_20} from '#/lib/constants'
import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {useMinimalShellFabTransform} from '#/lib/hooks/useMinimalShellTransform'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {clamp} from '#/lib/numbers'
import {useSession} from '#/state/session'
import {navBarBottomInset} from '#/view/shell/bottom-bar/BottomBarStyles'
import {atoms as a, useLayoutBreakpoints, useTheme, utils, web} from '#/alf'
import * as m3e from '#/alf/m3e'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {ArrowTop_Stroke2_Corner0_Rounded as ArrowIcon} from '#/components/icons/Arrow'
import {CENTER_COLUMN_OFFSET} from '#/components/Layout'
import {IS_NATIVE} from '#/env'

const SIZE = 48
const FAB_SIZE = 56

const enter = ZoomIn.springify()
  .mass(m3e.motion.fastSpatial.mass ?? 1)
  .stiffness(m3e.motion.fastSpatial.stiffness ?? 800)
  .damping(m3e.motion.fastSpatial.damping ?? 34)
const exit = ZoomOut.springify()
  .mass(m3e.motion.fastEffects.mass ?? 1)
  .stiffness(m3e.motion.fastEffects.stiffness ?? 3800)
  .damping(m3e.motion.fastEffects.damping ?? 123)

export function LoadLatestBtn({
  onPress,
  label,
  showIndicator,
}: {
  onPress: () => void
  label: string
  showIndicator: boolean
}) {
  const {hasSession} = useSession()
  const {isDesktop, isTablet, isMobile, isTabletOrMobile} = useWebMediaQueries()
  const {centerColumnOffset} = useLayoutBreakpoints()
  const {width: windowWidth} = useWindowDimensions()
  const fabMinimalShellTransform = useMinimalShellFabTransform()
  const insets = useSafeAreaInsets()
  const t = useTheme()
  const c = m3e.colors(t)
  const {
    state: hovered,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState()

  // move button inline if it starts overlapping the left nav
  const isTallViewport = useMediaQuery({minHeight: 700})

  // Adjust height of the fab if we have a session only on mobile web. If we don't have a session, we want to adjust
  // it on both tablet and mobile since we are showing the bottom bar (see createNativeStackNavigatorWithAuth)
  const showBottomBar = hasSession ? isMobile : isTabletOrMobile

  const bottomPosition = isTablet
    ? {bottom: 50}
    : IS_NATIVE
      ? {bottom: navBarBottomInset(insets.bottom) + 16 + (FAB_SIZE - SIZE) / 2}
      : {bottom: clamp(insets.bottom, 15, 60) + 15}

  const containerColor = showIndicator
    ? c.primaryContainer
    : c.secondaryContainer
  const contentColor = showIndicator
    ? c.onPrimaryContainer
    : c.onSecondaryContainer

  return (
    <Animated.View
      testID="loadLatestBtn"
      style={[
        a.fixed,
        a.z_20,
        {left: 16},
        isDesktop &&
          (isTallViewport
            ? styles.loadLatestOutOfLine
            : styles.loadLatestInline),
        isTablet &&
          (centerColumnOffset
            ? styles.loadLatestInlineOffset
            : styles.loadLatestInline),
        /*
         * Always inline on native: the native left nav is a scroll view drawn
         * above the screen, so it would swallow taps on the out-of-line spot.
         */
        IS_NATIVE && (isTablet || isDesktop) && {left: windowWidth / 2 - 282},
        bottomPosition,
        showBottomBar && fabMinimalShellTransform,
      ]}>
      <Animated.View
        entering={IS_NATIVE ? enter : undefined}
        exiting={IS_NATIVE ? exit : undefined}>
        <PressableScale
          style={[
            a.align_center,
            a.justify_center,
            a.shadow_md,
            {
              width: SIZE,
              height: SIZE,
              borderRadius: m3e.shape.medium,
              backgroundColor: containerColor,
              elevation: 3,
            },
          ]}
          onPress={onPress}
          hitSlop={HITSLOP_20}
          accessibilityLabel={label}
          accessibilityHint=""
          targetScale={0.9}
          onPointerEnter={onHoverIn}
          onPointerLeave={onHoverOut}>
          {hovered && (
            <Animated.View
              style={[
                a.absolute,
                a.inset_0,
                {
                  borderRadius: m3e.shape.medium,
                  backgroundColor: utils.alpha(
                    contentColor,
                    m3e.stateLayer.hovered,
                  ),
                },
              ]}
            />
          )}
          <ArrowIcon size="lg" style={{color: contentColor}} />
        </PressableScale>
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  loadLatestInline: {
    left: web('calc(50vw - 282px)'),
  },
  loadLatestInlineOffset: {
    left: web(`calc(50vw - 282px + ${CENTER_COLUMN_OFFSET}px)`),
  },
  loadLatestOutOfLine: {
    left: web('calc(50vw - 382px)'),
  },
})
