import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'

import * as m3e from '#/alf/m3e'
import {IS_NATIVE, IS_WEB, IS_WEB_TOUCH_DEVICE} from '#/env'

const DEFAULT_TARGET_SCALE =
  IS_NATIVE || IS_WEB || IS_WEB_TOUCH_DEVICE ? 0.96 : 1

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function PressableScale({
  targetScale = DEFAULT_TARGET_SCALE,
  children,
  style,
  onPressIn,
  onPressOut,
  ...rest
}: {
  targetScale?: number
  style?: StyleProp<ViewStyle>
} & Exclude<PressableProps, 'onPressIn' | 'onPressOut' | 'style'>) {
  const reducedMotion = useReducedMotion()

  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.get()}],
  }))

  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPressIn={e => {
        if (onPressIn) {
          onPressIn(e)
        }
        cancelAnimation(scale)
        scale.set(withSpring(targetScale, m3e.motion.standardFastSpatial))
      }}
      onPressOut={e => {
        if (onPressOut) {
          onPressOut(e)
        }
        cancelAnimation(scale)
        scale.set(withSpring(1, m3e.motion.defaultSpatial))
      }}
      style={[!reducedMotion && animatedStyle, style]}
      {...rest}>
      {children}
    </AnimatedPressable>
  )
}
