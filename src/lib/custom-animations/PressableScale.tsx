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

import {IS_NATIVE, IS_WEB_TOUCH_DEVICE} from '#/env'

const DEFAULT_TARGET_SCALE = IS_NATIVE || IS_WEB_TOUCH_DEVICE ? 0.95 : 1

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
        scale.set(
          withSpring(targetScale, {damping: 15, stiffness: 320, mass: 0.6}),
        )
      }}
      onPressOut={e => {
        if (onPressOut) {
          onPressOut(e)
        }
        cancelAnimation(scale)
        scale.set(withSpring(1, {damping: 14, stiffness: 280, mass: 0.6}))
      }}
      style={[!reducedMotion && animatedStyle, style]}
      {...rest}>
      {children}
    </AnimatedPressable>
  )
}
