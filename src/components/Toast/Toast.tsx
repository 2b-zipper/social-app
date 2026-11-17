import {createContext, useContext, useMemo} from 'react'
import {type GestureResponderEvent, View} from 'react-native'

import {atoms as a, useAlf, useTheme, utils} from '#/alf'
import * as m3e from '#/alf/m3e'
import {
  Button,
  type ButtonProps,
  type UninheritableButtonProps,
} from '#/components/Button'
import {CircleCheck_Stroke2_Corner0_Rounded as CircleCheck} from '#/components/icons/CircleCheck'
import {
  CircleInfo_Stroke2_Corner0_Rounded as CircleInfo,
  CircleInfo_Stroke2_Corner0_Rounded as ErrorIcon,
} from '#/components/icons/CircleInfo'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import {dismiss} from '#/components/Toast/sonner'
import {type ToastType} from '#/components/Toast/types'
import {Text as BaseText} from '#/components/Typography'

export const ICONS = {
  default: CircleCheck,
  success: CircleCheck,
  error: ErrorIcon,
  warning: WarningIcon,
  info: CircleInfo,
}

const ToastConfigContext = createContext<{
  id: string
  type: ToastType
}>({
  id: '',
  type: 'default',
})
ToastConfigContext.displayName = 'ToastConfigContext'

export function ToastConfigProvider({
  children,
  id,
  type,
}: {
  children: React.ReactNode
  id: string
  type: ToastType
}) {
  return (
    <ToastConfigContext.Provider
      value={useMemo(() => ({id, type}), [id, type])}>
      {children}
    </ToastConfigContext.Provider>
  )
}

export function Outer({children}: {children: React.ReactNode}) {
  const t = useTheme()
  const {type} = useContext(ToastConfigContext)
  const styles = useToastStyles({type})

  return (
    <View
      style={[
        a.flex_1,
        a.p_lg,
        a.flex_row,
        a.gap_sm,
        t.atoms.shadow_md,
        {
          paddingVertical: 14, // 16 seems too big
          borderRadius: m3e.shape.medium,
          backgroundColor: styles.backgroundColor,
        },
      ]}>
      {children}
    </View>
  )
}

export function Icon({icon}: {icon?: React.ComponentType<SVGIconProps>}) {
  const {type} = useContext(ToastConfigContext)
  const styles = useToastStyles({type})
  const IconComponent = icon || ICONS[type]
  return <IconComponent size="md" fill={styles.iconColor} />
}

export function Text({children}: {children: React.ReactNode}) {
  const {type} = useContext(ToastConfigContext)
  const {textColor} = useToastStyles({type})
  const {fontScaleCompensation} = useToastFontScaleCompensation()
  return (
    <View
      style={[
        a.flex_1,
        a.pr_lg,
        {
          top: fontScaleCompensation,
        },
      ]}>
      <BaseText
        selectable={false}
        style={[
          a.text_md,
          a.font_medium,
          a.leading_snug,
          a.pointer_events_none,
          {
            color: textColor,
          },
        ]}>
        {children}
      </BaseText>
    </View>
  )
}

export function Action(
  props: Omit<ButtonProps, UninheritableButtonProps | 'children'> & {
    children: React.ReactNode
  },
) {
  const t = useTheme()
  const c = m3e.colors(t)
  const {fontScaleCompensation} = useToastFontScaleCompensation()
  const {id} = useContext(ToastConfigContext)

  const onPress = (e: GestureResponderEvent) => {
    console.log('Toast Action pressed, dismissing toast', id)
    dismiss(id)
    props.onPress?.(e)
  }

  return (
    <View style={{top: fontScaleCompensation}}>
      <Button {...props} onPress={onPress}>
        {s => {
          const interacted = s.pressed || s.hovered || s.focused
          return (
            <>
              <View
                style={[
                  a.absolute,
                  a.rounded_full,
                  {
                    top: -6,
                    bottom: -6,
                    left: -12,
                    right: -12,
                    backgroundColor: interacted
                      ? utils.alpha(c.inversePrimary, m3e.stateLayer.pressed)
                      : 'transparent',
                  },
                ]}
              />
              <BaseText
                style={[
                  a.text_md,
                  a.font_semi_bold,
                  a.leading_snug,
                  {color: c.inversePrimary},
                ]}>
                {props.children}
              </BaseText>
            </>
          )
        }}
      </Button>
    </View>
  )
}

/**
 * Vibes-based number, provides t `top` value to wrap the text to compensate
 * for different type sizes and keep the first line of text aligned with the
 * icon. - esb
 */
function useToastFontScaleCompensation() {
  const {fonts} = useAlf()
  const fontScaleCompensation = useMemo(
    () => parseInt(fonts.scale) * -1 * 0.65,
    [fonts.scale],
  )
  return useMemo(
    () => ({
      fontScaleCompensation,
    }),
    [fontScaleCompensation],
  )
}

function useToastStyles({type}: {type: ToastType}) {
  const t = useTheme()
  const c = m3e.colors(t)
  const iconColors: Record<ToastType, string> = {
    default: c.inverseOnSurface,
    success: c.inversePrimary,
    error: c.inverseError,
    warning: c.inverseOnSurface,
    info: c.inverseOnSurface,
  }
  return {
    backgroundColor: c.inverseSurface,
    iconColor: iconColors[type],
    textColor: c.inverseOnSurface,
  }
}
