import {createContext, useCallback, useContext, useEffect, useMemo} from 'react'
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native'
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'

import {HITSLOP_10} from '#/lib/constants'
import {useHaptics} from '#/lib/haptics'
import {
  atoms as a,
  native,
  type TextStyleProp,
  useTheme,
  utils,
  type ViewStyleProp,
} from '#/alf'
import * as m3e from '#/alf/m3e'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {CheckThick_Stroke2_Corner0_Rounded as Checkmark} from '#/components/icons/Check'
import {Text} from '#/components/Typography'
import {IS_NATIVE, IS_WEB} from '#/env'

export * from './Panel'

export type ItemState = {
  name: string
  selected: boolean
  disabled: boolean
  isInvalid: boolean
  hovered: boolean
  pressed: boolean
  focused: boolean
}

const ItemContext = createContext<ItemState>({
  name: '',
  selected: false,
  disabled: false,
  isInvalid: false,
  hovered: false,
  pressed: false,
  focused: false,
})
ItemContext.displayName = 'ToggleItemContext'

const GroupContext = createContext<{
  values: string[]
  disabled: boolean
  type: 'radio' | 'checkbox'
  maxSelectionsReached: boolean
  setFieldValue: (props: {name: string; value: boolean}) => void
}>({
  type: 'checkbox',
  values: [],
  disabled: false,
  maxSelectionsReached: false,
  setFieldValue: () => {},
})
GroupContext.displayName = 'ToggleGroupContext'

export type GroupProps = React.PropsWithChildren<{
  type?: 'radio' | 'checkbox'
  values: string[]
  maxSelections?: number
  disabled?: boolean
  onChange: (value: string[]) => void
  label: string
  style?: StyleProp<ViewStyle>
}>

export type ItemProps = ViewStyleProp & {
  type?: 'radio' | 'checkbox'
  name: string
  label: string
  value?: boolean
  disabled?: boolean
  onChange?: (selected: boolean) => void
  isInvalid?: boolean
  children: ((props: ItemState) => React.ReactNode) | React.ReactNode
  hitSlop?: PressableProps['hitSlop']
  highlightRow?: boolean
  testID?: string
}

export function useItemContext() {
  return useContext(ItemContext)
}

export function Group({
  children,
  values: providedValues,
  onChange,
  disabled = false,
  type = 'checkbox',
  maxSelections,
  label,
  style,
}: GroupProps) {
  const groupRole = type === 'radio' ? 'radiogroup' : undefined
  const values = type === 'radio' ? providedValues.slice(0, 1) : providedValues

  const setFieldValue = useCallback<
    (props: {name: string; value: boolean}) => void
  >(
    ({name, value}) => {
      if (type === 'checkbox') {
        const pruned = values.filter(v => v !== name)
        const next = value ? pruned.concat(name) : pruned
        onChange(next)
      } else {
        onChange([name])
      }
    },
    [type, onChange, values],
  )

  const maxReached = !!(
    type === 'checkbox' &&
    maxSelections &&
    values.length >= maxSelections
  )

  const context = useMemo(
    () => ({
      values,
      type,
      disabled,
      maxSelectionsReached: maxReached,
      setFieldValue,
    }),
    [values, disabled, type, maxReached, setFieldValue],
  )

  return (
    <GroupContext.Provider value={context}>
      <View
        style={[a.w_full, style]}
        role={groupRole}
        {...(groupRole === 'radiogroup'
          ? {
              'aria-label': label,
              accessibilityLabel: label,
              accessibilityRole: groupRole,
            }
          : {})}>
        {children}
      </View>
    </GroupContext.Provider>
  )
}

export function Item({
  children,
  name,
  value = false,
  disabled: itemDisabled = false,
  onChange,
  isInvalid,
  style,
  type = 'checkbox',
  label,
  highlightRow,
  ...rest
}: ItemProps) {
  const t = useTheme()

  const {
    values: selectedValues,
    type: groupType,
    disabled: groupDisabled,
    setFieldValue,
    maxSelectionsReached,
  } = useContext(GroupContext)
  const {
    state: hovered,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState()
  const {
    state: pressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()
  const haptics = useHaptics()

  const role = groupType === 'radio' ? 'radio' : type
  const selected = selectedValues.includes(name) || !!value
  const disabled =
    groupDisabled || itemDisabled || (!selected && maxSelectionsReached)

  const onPress = useCallback(() => {
    const next = !selected
    haptics.toggle(groupType === 'radio' || next)
    setFieldValue({name, value: next})
    onChange?.(next)
  }, [haptics, groupType, name, selected, onChange, setFieldValue])

  const state = useMemo(
    () => ({
      name,
      selected,
      disabled: disabled ?? false,
      isInvalid: isInvalid ?? false,
      hovered,
      pressed,
      focused,
    }),
    [name, selected, disabled, hovered, pressed, focused, isInvalid],
  )

  const highlightStyle = highlightRow
    ? [
        a.rounded_full,
        a.p_md,
        hovered && t.atoms.bg_contrast_25,
        selected && {backgroundColor: t.palette.primary_50},
      ]
    : null

  return (
    <ItemContext.Provider value={state}>
      <Pressable
        accessibilityHint={undefined} // optional
        hitSlop={HITSLOP_10}
        {...rest}
        disabled={disabled}
        aria-disabled={disabled ?? false}
        aria-checked={selected}
        aria-invalid={isInvalid}
        aria-label={label}
        role={role}
        accessibilityRole={role}
        accessibilityState={{
          disabled: disabled ?? false,
          selected: selected,
        }}
        accessibilityLabel={label}
        onPress={onPress}
        onHoverIn={onHoverIn}
        onHoverOut={onHoverOut}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onFocus={onFocus}
        onBlur={onBlur}
        style={[a.flex_row, a.align_center, a.gap_sm, highlightStyle, style]}>
        {typeof children === 'function' ? children(state) : children}
      </Pressable>
    </ItemContext.Provider>
  )
}

export function LabelText({
  children,
  style,
}: React.PropsWithChildren<TextStyleProp>) {
  const t = useTheme()
  const {disabled} = useItemContext()
  return (
    <Text
      style={[
        a.font_semi_bold,
        a.leading_tight,
        a.user_select_none,
        {
          color: disabled
            ? t.atoms.text_contrast_low.color
            : t.atoms.text_contrast_high.color,
        },
        native({
          paddingTop: 2,
        }),
        style,
      ]}>
      {children}
    </Text>
  )
}

const CONTROL_SIZE = 20
const STATE_LAYER_SIZE = 40

function useSelectionSprings(selected: boolean) {
  const fill = useSharedValue(selected ? 1 : 0)
  const pop = useSharedValue(selected ? 1 : 0)

  useEffect(() => {
    fill.set(withSpring(selected ? 1 : 0, m3e.motion.fastEffects))
    pop.set(withSpring(selected ? 1 : 0, m3e.motion.fastSpatial))
  }, [selected, fill, pop])

  return {fill, pop}
}

function SelectionStateLayer({
  color,
  hovered,
  pressed,
  focused,
}: {
  color: string
  hovered: boolean
  pressed: boolean
  focused: boolean
}) {
  const opacity = pressed
    ? m3e.stateLayer.pressed
    : focused
      ? m3e.stateLayer.focused
      : hovered
        ? m3e.stateLayer.hovered
        : 0
  if (opacity === 0) return null
  const offset = (CONTROL_SIZE - STATE_LAYER_SIZE) / 2
  return (
    <View
      pointerEvents="none"
      style={[
        a.absolute,
        a.rounded_full,
        {
          top: offset,
          left: offset,
          width: STATE_LAYER_SIZE,
          height: STATE_LAYER_SIZE,
          backgroundColor: utils.alpha(color, opacity),
        },
      ]}
    />
  )
}

export function Checkbox() {
  const t = useTheme()
  const c = m3e.colors(t)
  const {selected, hovered, pressed, focused, disabled, isInvalid} =
    useItemContext()
  const {fill, pop} = useSelectionSprings(selected)

  const accent = isInvalid ? c.error : c.primary
  const clear = utils.alpha(accent, 0)
  const outline = isInvalid
    ? c.error
    : hovered
      ? c.onSurface
      : c.onSurfaceVariant

  const boxStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(fill.get(), [0, 1], [clear, accent]),
    borderColor: interpolateColor(fill.get(), [0, 1], [outline, accent]),
  }))

  const checkStyle = useAnimatedStyle(() => ({
    opacity: fill.get(),
    transform: [{scale: Math.max(0, pop.get())}],
  }))

  return (
    <View
      style={[
        {
          width: CONTROL_SIZE,
          height: CONTROL_SIZE,
          opacity: disabled ? 0.38 : 1,
        },
      ]}>
      <SelectionStateLayer
        color={selected ? accent : c.onSurface}
        hovered={hovered && !disabled}
        pressed={pressed && !disabled}
        focused={focused && !disabled}
      />
      <Animated.View
        style={[
          a.align_center,
          a.justify_center,
          {
            width: CONTROL_SIZE,
            height: CONTROL_SIZE,
            borderWidth: 2,
            borderRadius: m3e.shape.extraSmall,
          },
          boxStyle,
        ]}>
        <Animated.View style={checkStyle}>
          <Checkmark width={12} fill={isInvalid ? c.onError : c.onPrimary} />
        </Animated.View>
      </Animated.View>
    </View>
  )
}

const SWITCH_THUMB_OFF = 16
const SWITCH_THUMB_ON = 24
const SWITCH_THUMB_PRESSED = 28
const SWITCH_TRAVEL = 20

export function Switch() {
  const t = useTheme()
  const c = m3e.colors(t)
  const {selected, hovered, pressed, disabled, isInvalid} = useItemContext()

  const onColor = isInvalid ? t.palette.negative_500 : c.primary
  const offTrack = isInvalid
    ? t.palette.negative_200
    : hovered
      ? t.palette.contrast_200
      : t.palette.contrast_100
  const offOutline = isInvalid ? t.palette.negative_400 : t.palette.contrast_400
  const offThumb = isInvalid ? t.palette.negative_400 : t.palette.contrast_600

  const position = useSharedValue(selected ? 1 : 0)
  const fill = useSharedValue(selected ? 1 : 0)
  const press = useSharedValue(0)

  useEffect(() => {
    position.set(withSpring(selected ? 1 : 0, m3e.motion.fastSpatial))
    fill.set(withSpring(selected ? 1 : 0, m3e.motion.fastEffects))
  }, [selected, position, fill])

  useEffect(() => {
    press.set(withSpring(pressed ? 1 : 0, m3e.motion.fastSpatial))
  }, [pressed, press])

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(fill.get(), [0, 1], [offTrack, onColor]),
    borderColor: interpolateColor(fill.get(), [0, 1], [offOutline, onColor]),
  }))

  const thumbStyle = useAnimatedStyle(() => {
    const resting = interpolate(
      position.get(),
      [0, 1],
      [SWITCH_THUMB_OFF, SWITCH_THUMB_ON],
    )
    const size = resting + (SWITCH_THUMB_PRESSED - resting) * press.get()
    return {
      backgroundColor: interpolateColor(
        fill.get(),
        [0, 1],
        [offThumb, c.onPrimary],
      ),
      transform: [
        {translateX: position.get() * SWITCH_TRAVEL},
        {scale: size / SWITCH_THUMB_PRESSED},
      ],
    }
  })

  const iconStyle = useAnimatedStyle(() => ({
    opacity: fill.get(),
  }))

  return (
    <Animated.View
      style={[
        a.relative,
        a.rounded_full,
        {
          height: 32,
          width: 52,
          borderWidth: 2,
          opacity: disabled ? 0.38 : 1,
        },
        trackStyle,
      ]}>
      <Animated.View
        style={[
          a.absolute,
          a.rounded_full,
          a.align_center,
          a.justify_center,
          {
            top: 0,
            left: 0,
            width: SWITCH_THUMB_PRESSED,
            height: SWITCH_THUMB_PRESSED,
          },
          thumbStyle,
        ]}>
        <Animated.View style={iconStyle}>
          <Checkmark width={16} fill={onColor} />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  )
}

export function Radio() {
  const props = useContext(ItemContext)

  return <BaseRadio {...props} />
}

export function BaseRadio({
  hovered,
  focused,
  selected,
  disabled,
  isInvalid,
  pressed = false,
}: Pick<
  ItemState,
  'hovered' | 'focused' | 'selected' | 'disabled' | 'isInvalid'
> & {
  pressed?: boolean
}) {
  const t = useTheme()
  const c = m3e.colors(t)
  const {fill, pop} = useSelectionSprings(selected)

  const accent = isInvalid ? c.error : c.primary
  const outline = isInvalid
    ? c.error
    : hovered
      ? c.onSurface
      : c.onSurfaceVariant

  const ringStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(fill.get(), [0, 1], [outline, accent]),
  }))

  const dotStyle = useAnimatedStyle(() => ({
    opacity: fill.get(),
    transform: [{scale: Math.max(0, pop.get())}],
  }))

  return (
    <View
      style={[
        {
          width: CONTROL_SIZE,
          height: CONTROL_SIZE,
          opacity: disabled ? 0.38 : 1,
        },
      ]}>
      <SelectionStateLayer
        color={selected ? accent : c.onSurface}
        hovered={hovered && !disabled}
        pressed={pressed && !disabled}
        focused={focused && !disabled}
      />
      <Animated.View
        style={[
          a.align_center,
          a.justify_center,
          a.rounded_full,
          {width: CONTROL_SIZE, height: CONTROL_SIZE, borderWidth: 2},
          ringStyle,
        ]}>
        <Animated.View
          style={[
            a.rounded_full,
            {width: 10, height: 10, backgroundColor: accent},
            dotStyle,
          ]}
        />
      </Animated.View>
    </View>
  )
}

export function RadioWithLabel({
  label,
  selected,
}: {
  label: string
  selected: boolean
}) {
  const t = useTheme()

  return (
    <View style={[a.flex_1, a.flex_row, a.align_center, a.gap_sm]}>
      <Radio />
      <LabelText
        style={[
          a.font_medium,
          a.flex_1,
          a.text_md,
          a.leading_tight,
          selected ? t.atoms.text : t.atoms.text_contrast_high,
        ]}>
        {label}
      </LabelText>
    </View>
  )
}

export const Platform = IS_NATIVE || IS_WEB ? Switch : Checkbox
