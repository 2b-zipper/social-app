import {cloneElement, Fragment, isValidElement, useMemo, useRef} from 'react'
import {
  type GestureResponderEvent,
  Pressable,
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'
import flattenReactChildren from 'react-keyed-flatten-children'

import {atoms as a, useTheme} from '#/alf'
import * as m3e from '#/alf/m3e'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {BaseRadio} from '#/components/forms/Toggle'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {
  Context,
  ItemContext,
  useMenuContext,
  useMenuItemContext,
} from '#/components/Menu/context'
import {getMenuSourceViewTag} from '#/components/Menu/sourceViewTag'
import {
  type ContextType,
  type GroupProps,
  type ItemIconProps,
  type ItemProps,
  type ItemTextProps,
  type OuterProps,
  type TriggerProps,
} from '#/components/Menu/types'
import {Text} from '#/components/Typography'
import {IS_ANDROID, IS_IOS, IS_IPAD, IS_LIQUID_GLASS, IS_NATIVE} from '#/env'

// iOS 26's floaty sheet presentation subtracts the bottom safe-area inset from
// the requested detent, which eats the visible bottom padding of short (e.g.
// single-item) menus. Flooring the native sheet height restores that padding.
const IOS_MENU_MIN_HEIGHT = 128

export {
  type DialogControlProps as MenuControlProps,
  useDialogControl as useMenuControl,
} from '#/components/Dialog'

export {useMenuContext}

export function Root({
  children,
  control,
}: React.PropsWithChildren<{
  control?: Dialog.DialogControlProps
}>) {
  const defaultControl = Dialog.useDialogControl()
  const context = useMemo<ContextType>(
    () => ({
      control: control || defaultControl,
    }),
    [control, defaultControl],
  )

  return <Context.Provider value={context}>{children}</Context.Provider>
}

export function Trigger({
  children,
  label,
  role = 'button',
  hint,
}: TriggerProps) {
  const context = useMenuContext()
  const triggerRef = useRef<React.ComponentRef<typeof View>>(null)
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()
  const {
    state: pressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState()

  const onPress = (event?: GestureResponderEvent) => {
    if (!IS_IOS) {
      context.control.open(event)
      return
    }

    const sourceViewTag = getMenuSourceViewTag(triggerRef.current, event)
    context.control.open({sourceViewTag})
  }

  return children({
    IS_NATIVE: true,
    control: context.control,
    state: {
      hovered: false,
      focused,
      pressed,
    },
    props: {
      ref: triggerRef,
      onPress,
      onFocus,
      onBlur,
      onPressIn,
      onPressOut,
      accessibilityHint: hint,
      accessibilityLabel: label,
      accessibilityRole: role,
    },
  })
}

export function Outer({
  children,
  showCancel,
  popover = 'adaptive',
}: OuterProps) {
  const context = useMenuContext()
  const {t: l} = useLingui()

  return (
    <Dialog.Outer
      control={context.control}
      nativeOptions={{
        popover: IS_IOS ? popover : 'never',
        preventExpansion: true,
        minHeight: IS_IOS ? IOS_MENU_MIN_HEIGHT : undefined,
        ...(IS_IPAD && IS_LIQUID_GLASS ? {backgroundColor: 'transparent'} : {}),
      }}>
      <Dialog.Handle />
      {/* Re-wrap with context since Dialogs are portal-ed to root */}
      <Context.Provider value={context}>
        <Dialog.ScrollableInner label={l`Menu`}>
          <View style={[a.gap_lg]}>
            {children}
            {IS_NATIVE && showCancel && <Cancel />}
          </View>
        </Dialog.ScrollableInner>
      </Context.Provider>
    </Dialog.Outer>
  )
}

export function Item({
  children,
  label,
  style,
  onPress,
  destructive = false,
  ...rest
}: ItemProps) {
  const t = useTheme()
  const c = m3e.colors(t)
  const context = useMenuContext()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()
  const {
    state: pressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState()

  return (
    <Pressable
      {...rest}
      accessibilityHint=""
      accessibilityLabel={label}
      onFocus={onFocus}
      onBlur={onBlur}
      onPress={e => {
        if (IS_ANDROID) {
          /**
           * Below fix for iOS doesn't work for Android, this does.
           */
          onPress?.(e)
          context.control.close()
        } else if (IS_IOS) {
          /**
           * Fixes a subtle bug on iOS
           * {@link https://github.com/bluesky-social/social-app/pull/5849/files#diff-de516ef5e7bd9840cd639213301df38cf03acfcad5bda85a1d63efd249ba79deL124-L127}
           */
          context.control.close(() => {
            onPress?.(e)
          })
        }
      }}
      onPressIn={e => {
        onPressIn()
        rest.onPressIn?.(e)
      }}
      onPressOut={e => {
        onPressOut()
        rest.onPressOut?.(e)
      }}
      style={[
        a.flex_row,
        a.align_center,
        a.gap_sm,
        a.px_lg,
        a.overflow_hidden,
        a.curve_continuous,
        {
          minHeight: 56,
          paddingVertical: 12,
          borderRadius: m3e.shape.largeIncreased,
          backgroundColor: c.surfaceContainer,
        },
        style,
        (focused || pressed) &&
          !rest.disabled && {backgroundColor: c.surfaceContainerHigh},
      ]}>
      <ItemContext.Provider
        value={{disabled: Boolean(rest.disabled), destructive}}>
        {children}
      </ItemContext.Provider>
    </Pressable>
  )
}

export function ItemText({children, style}: ItemTextProps) {
  const t = useTheme()
  const {disabled, destructive} = useMenuItemContext()
  return (
    <Text
      numberOfLines={1}
      ellipsizeMode="middle"
      style={[
        a.flex_1,
        a.text_md,
        a.font_medium,
        {color: m3e.colors(t).onSurface},
        style,
        destructive && {color: m3e.colors(t).error},
        disabled && t.atoms.text_contrast_low,
      ]}>
      {children}
    </Text>
  )
}

export function ItemIcon({icon: Comp, fill}: ItemIconProps) {
  const t = useTheme()
  const {disabled, destructive} = useMenuItemContext()
  return (
    <Comp
      size="lg"
      fill={
        fill
          ? fill({disabled})
          : disabled
            ? t.atoms.text_contrast_low.color
            : destructive
              ? m3e.colors(t).error
              : m3e.colors(t).onSurfaceVariant
      }
    />
  )
}

export function ItemRadio({selected}: {selected: boolean}) {
  const {disabled} = useMenuItemContext()
  return (
    <BaseRadio
      selected={selected}
      hovered={false}
      focused={false}
      disabled={disabled}
      isInvalid={false}
    />
  )
}

/**
 * NATIVE ONLY - for adding non-pressable items to the menu
 *
 * @platform ios, android
 */
export function ContainerItem({
  children,
  style,
}: {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.gap_sm,
        a.px_lg,
        a.curve_continuous,
        {
          paddingVertical: 12,
          borderRadius: m3e.shape.largeIncreased,
          backgroundColor: m3e.colors(t).surfaceContainer,
        },
        style,
      ]}>
      {children}
    </View>
  )
}

export function LabelText({
  children,
  style,
}: {
  children: React.ReactNode
  style?: StyleProp<TextStyle>
}) {
  const t = useTheme()
  return (
    <Text
      style={[
        a.font_semi_bold,
        t.atoms.text_contrast_medium,
        {marginBottom: -8},
        style,
      ]}>
      {children}
    </Text>
  )
}

const GROUP_OUTER_RADIUS = m3e.shape.largeIncreased
const GROUP_INNER_RADIUS = m3e.shape.extraSmall

export function Group({children, style}: GroupProps) {
  const items = flattenReactChildren(children).filter(
    (child): child is React.ReactElement<{style?: StyleProp<ViewStyle>}> =>
      isValidElement(child) &&
      (child.type === Item || child.type === ContainerItem),
  )
  return (
    <View style={[a.gap_2xs, style]}>
      {items.map((child, i) => {
        const top = i === 0 ? GROUP_OUTER_RADIUS : GROUP_INNER_RADIUS
        const bottom =
          i === items.length - 1 ? GROUP_OUTER_RADIUS : GROUP_INNER_RADIUS
        return (
          <Fragment key={child.key ?? i}>
            {cloneElement(child, {
              style: [
                child.props.style,
                {
                  borderTopLeftRadius: top,
                  borderTopRightRadius: top,
                  borderBottomLeftRadius: bottom,
                  borderBottomRightRadius: bottom,
                },
              ],
            })}
          </Fragment>
        )
      })}
    </View>
  )
}

function Cancel() {
  const {t: l} = useLingui()
  const context = useMenuContext()

  return (
    <Button
      label={l`Close this dialog`}
      size="small"
      variant="ghost"
      color="secondary"
      onPress={() => context.control.close()}>
      <ButtonText>
        <Trans>Cancel</Trans>
      </ButtonText>
    </Button>
  )
}

export function Divider() {
  return null
}
