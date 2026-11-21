import {forwardRef, useCallback, useId, useMemo, useState} from 'react'
import {Pressable, type StyleProp, type TextStyle, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

import {useA11y} from '#/state/a11y'
import {atoms as a, flatten, flattenToCSS, useTheme, web} from '#/alf'
import * as m3e from '#/alf/m3e'
import type * as Dialog from '#/components/Dialog'
import {BaseRadio} from '#/components/forms/Toggle'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {
  Context,
  ItemContext,
  useMenuContext,
  useMenuItemContext,
} from '#/components/Menu/context'
import {
  type ContextType,
  type GroupProps,
  type ItemIconProps,
  type ItemProps,
  type ItemTextProps,
  type OuterProps,
  type RadixPassThroughTriggerProps,
  type TriggerProps,
} from '#/components/Menu/types'
import {Portal} from '#/components/Portal'
import {Text} from '#/components/Typography'

export {type DialogControlProps as MenuControlProps} from '#/components/Dialog'

export {useMenuContext}

export function useMenuControl(): Dialog.DialogControlProps {
  const id = useId()
  const [isOpen, setIsOpen] = useState(false)

  return useMemo(
    () => ({
      id,
      ref: {current: null},
      isOpen,
      open() {
        setIsOpen(true)
      },
      close(cb) {
        setIsOpen(false)
        if (cb) setTimeout(cb)
      },
    }),
    [id, isOpen, setIsOpen],
  )
}

export function Root({
  children,
  control,
}: React.PropsWithChildren<{
  control?: Dialog.DialogControlProps
}>) {
  const {_} = useLingui()
  const defaultControl = useMenuControl()
  const context = useMemo<ContextType>(
    () => ({
      control: control || defaultControl,
    }),
    [control, defaultControl],
  )
  const onOpenChange = useCallback(
    (open: boolean) => {
      if (context.control.isOpen && !open) {
        context.control.close()
      } else if (!context.control.isOpen && open) {
        context.control.open()
      }
    },
    [context.control],
  )

  return (
    <Context.Provider value={context}>
      {context.control.isOpen && (
        <Portal>
          <Pressable
            style={[a.fixed, a.inset_0, a.z_50]}
            onPress={() => context.control.close()}
            accessibilityHint=""
            accessibilityLabel={_(
              msg`Context menu backdrop, click to close the menu.`,
            )}
          />
        </Portal>
      )}
      <DropdownMenu.Root
        open={context.control.isOpen}
        onOpenChange={onOpenChange}>
        {children}
      </DropdownMenu.Root>
    </Context.Provider>
  )
}

const RadixTriggerPassThrough = forwardRef(
  (
    props: {
      children: (
        props: RadixPassThroughTriggerProps & {
          ref: React.Ref<HTMLElement>
        },
      ) => React.ReactNode
    },
    ref,
  ) => {
    // @ts-expect-error Radix provides no types of this stuff
    return props.children({...props, ref})
  },
)
RadixTriggerPassThrough.displayName = 'RadixTriggerPassThrough'

export function Trigger({
  children,
  label,
  role = 'button',
  hint,
}: TriggerProps) {
  const {control} = useMenuContext()
  const {
    state: hovered,
    onIn: onMouseEnter,
    onOut: onMouseLeave,
  } = useInteractionState()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()

  return (
    <DropdownMenu.Trigger asChild>
      <RadixTriggerPassThrough>
        {props =>
          children({
            IS_NATIVE: false,
            control,
            state: {
              hovered,
              focused,
              pressed: false,
            },
            props: {
              ...props,
              // No-op override to prevent false positive that interprets mobile scroll as a tap.
              // This requires the custom onPress handler below to compensate.
              // https://github.com/radix-ui/primitives/issues/1912
              onPointerDown: undefined,
              onPress: () => {
                if (window.event instanceof KeyboardEvent) {
                  // The onPointerDown hack above is not relevant to this press, so don't do anything.
                  return
                }
                // Compensate for the disabled onPointerDown above by triggering it manually.
                if (control.isOpen) {
                  control.close()
                } else {
                  control.open()
                }
              },
              onFocus: onFocus,
              onBlur: onBlur,
              onMouseEnter,
              onMouseLeave,
              accessibilityHint: hint,
              accessibilityLabel: label,
              accessibilityRole: role,
            },
          })
        }
      </RadixTriggerPassThrough>
    </DropdownMenu.Trigger>
  )
}

export function Outer({children, style, onCloseAutoFocus}: OuterProps) {
  const t = useTheme()
  const c = m3e.colors(t)
  const {reduceMotionEnabled} = useA11y()

  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        sideOffset={5}
        collisionPadding={{left: 5, right: 5, bottom: 5}}
        loop
        aria-label="Test"
        onCloseAutoFocus={onCloseAutoFocus}
        className="dropdown-menu-transform-origin dropdown-menu-constrain-size">
        <View
          style={[
            a.p_xs,
            a.border,
            t.atoms.shadow_md,
            a.overflow_auto,
            {
              borderRadius: m3e.shape.largeIncreased,
              backgroundColor: c.surfaceContainer,
              borderColor: c.outlineVariant,
            },
            !reduceMotionEnabled && a.zoom_fade_in,
            style,
          ]}>
          {children}
        </View>
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  )
}

export function Item({
  children,
  label,
  onPress,
  style,
  destructive = false,
  ...rest
}: ItemProps) {
  const t = useTheme()
  const c = m3e.colors(t)
  const {control} = useMenuContext()
  const {
    state: hovered,
    onIn: onMouseEnter,
    onOut: onMouseLeave,
  } = useInteractionState()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()

  return (
    <DropdownMenu.Item asChild>
      <Pressable
        {...rest}
        className="radix-dropdown-item"
        accessibilityHint=""
        accessibilityLabel={label}
        onPress={e => {
          onPress(e)

          /**
           * Ported forward from Radix
           * @see https://www.radix-ui.com/primitives/docs/components/dropdown-menu#item
           */
          if (!e.defaultPrevented) {
            control.close()
          }
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        // need `flatten` here for Radix compat
        style={flatten([
          a.flex_row,
          a.align_center,
          a.gap_md,
          a.py_sm,
          a.overflow_hidden,
          {
            minHeight: 44,
            paddingHorizontal: 14,
            borderRadius: m3e.shape.medium,
          },
          web({outline: 0}),
          (hovered || focused) &&
            !rest.disabled && [
              web({outline: '0 !important'}),
              {backgroundColor: c.surfaceContainerHigh},
            ],
          style,
        ])}
        {...web({
          onMouseEnter,
          onMouseLeave,
        })}>
        <ItemContext.Provider
          value={{disabled: Boolean(rest.disabled), destructive}}>
          {children}
        </ItemContext.Provider>
      </Pressable>
    </DropdownMenu.Item>
  )
}

export function ItemText({children, style}: ItemTextProps) {
  const t = useTheme()
  const c = m3e.colors(t)
  const {disabled, destructive} = useMenuItemContext()
  return (
    <Text
      style={[
        a.flex_1,
        a.text_md,
        a.font_medium,
        {color: c.onSurface},
        style,
        destructive && {color: c.error},
        disabled && t.atoms.text_contrast_low,
      ]}>
      {children}
    </Text>
  )
}

export function ItemIcon({icon: Comp, position = 'left', fill}: ItemIconProps) {
  const t = useTheme()
  const c = m3e.colors(t)
  const {disabled, destructive} = useMenuItemContext()
  return (
    <View
      style={[
        position === 'left' && {
          marginLeft: -2,
        },
        position === 'right' && {
          marginRight: -2,
          marginLeft: 12,
        },
      ]}>
      <Comp
        size="md"
        fill={
          fill
            ? fill({disabled})
            : disabled
              ? t.atoms.text_contrast_low.color
              : destructive
                ? c.error
                : c.onSurfaceVariant
        }
      />
    </View>
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
        a.p_sm,
        t.atoms.text_contrast_low,
        a.leading_snug,
        {paddingHorizontal: 10},
        style,
      ]}>
      {children}
    </Text>
  )
}

export function Group({children}: GroupProps) {
  return children
}

export function Divider() {
  const t = useTheme()
  return (
    <DropdownMenu.Separator
      style={flattenToCSS([
        a.my_xs,
        t.atoms.bg_contrast_100,
        a.flex_shrink_0,
        {height: 1},
      ])}
    />
  )
}

export function ContainerItem() {
  return null
}
