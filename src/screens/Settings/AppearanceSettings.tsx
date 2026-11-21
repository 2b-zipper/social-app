import {useCallback, useState} from 'react'
import {Pressable, View} from 'react-native'
import Animated, {
  FadeInUp,
  FadeOutUp,
  LayoutAnimationConfig,
  LinearTransition,
} from 'react-native-reanimated'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {
  useCustomThemeHex,
  useHideTabLabels,
  useMaterialYou,
  useSetCustomThemeHex,
  useSetHideTabLabels,
  useSetMaterialYou,
  useSetThemeColorPreset,
  useThemeColorPreset,
} from '#/state/preferences'
import {useKawaiiMode, useSetKawaiiMode} from '#/state/preferences/kawaii'
import {useSetThemePrefs, useThemePrefs} from '#/state/shell'
import {type Alf, atoms as a, native, useAlf, useTheme} from '#/alf'
import * as m3e from '#/alf/m3e'
import {THEME_COLOR_PRESETS} from '#/alf/materialYou'
import * as SegmentedControl from '#/components/forms/SegmentedControl'
import * as TextField from '#/components/forms/TextField'
import * as Toggle from '#/components/forms/Toggle'
import {CheckThick_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {EyeSlash_Stroke2_Corner0_Rounded as EyeSlashIcon} from '#/components/icons/EyeSlash'
import {Moon_Stroke2_Corner0_Rounded as MoonIcon} from '#/components/icons/Moon'
import {PaintRoller_Stroke2_Corner2_Rounded as PaletteIcon} from '#/components/icons/PaintRoller'
import {Phone_Stroke2_Corner0_Rounded as PhoneIcon} from '#/components/icons/Phone'
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import {TextSize_Stroke2_Corner0_Rounded as TextSize} from '#/components/icons/TextSize'
import {TitleCase_Stroke2_Corner0_Rounded as Aa} from '#/components/icons/TitleCase'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {IS_ANDROID, IS_WEB} from '#/env'
import * as SettingsList from './components/SettingsList'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AppearanceSettings'>
export function AppearanceSettingsScreen({}: Props) {
  const {_} = useLingui()
  const {fonts} = useAlf()

  const {colorMode, darkTheme} = useThemePrefs()
  const {setColorMode, setDarkTheme} = useSetThemePrefs()

  const t = useTheme()
  const c = m3e.colors(t)
  const materialYou = useMaterialYou()
  const setMaterialYou = useSetMaterialYou()
  const themeColorPreset = useThemeColorPreset()
  const setThemeColorPreset = useSetThemeColorPreset()
  const customThemeHex = useCustomThemeHex()
  const setCustomThemeHex = useSetCustomThemeHex()
  const [hexDraft, setHexDraft] = useState(customThemeHex)
  const hideTabLabels = useHideTabLabels()
  const setHideTabLabels = useSetHideTabLabels()
  const kawaii = useKawaiiMode()
  const setKawaii = useSetKawaiiMode()

  const onChangeAppearance = useCallback(
    (value: 'light' | 'system' | 'dark') => {
      setColorMode(value)
    },
    [setColorMode],
  )

  const onChangeDarkTheme = useCallback(
    (value: 'dim' | 'dark') => {
      setDarkTheme(value)
    },
    [setDarkTheme],
  )

  const onChangeFontFamily = useCallback(
    (value: 'system' | 'theme') => {
      fonts.setFontFamily(value)
    },
    [fonts],
  )

  const onChangeFontScale = useCallback(
    (value: Alf['fonts']['scale']) => {
      fonts.setFontScale(value)
    },
    [fonts],
  )

  return (
    <LayoutAnimationConfig skipExiting skipEntering>
      <Layout.Screen testID="preferencesThreadsScreen">
        <Layout.Header.Outer>
          <Layout.Header.BackButton />
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>Appearance</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>
          <Layout.Header.Slot />
        </Layout.Header.Outer>
        <Layout.Content>
          <SettingsList.Container>
            <AppearanceToggleButtonGroup
              title={_(msg`Color mode`)}
              icon={PhoneIcon}
              items={[
                {
                  label: _(msg`System`),
                  name: 'system',
                },
                {
                  label: _(msg`Light`),
                  name: 'light',
                },
                {
                  label: _(msg`Dark`),
                  name: 'dark',
                },
              ]}
              value={colorMode}
              onChange={onChangeAppearance}
            />

            {colorMode !== 'light' && (
              <Animated.View
                entering={native(FadeInUp)}
                exiting={native(FadeOutUp)}>
                <AppearanceToggleButtonGroup
                  title={_(msg`Dark theme`)}
                  icon={MoonIcon}
                  items={[
                    {
                      label: _(msg`Dim`),
                      name: 'dim',
                    },
                    {
                      label: _(msg`Dark`),
                      name: 'dark',
                    },
                  ]}
                  value={darkTheme ?? 'dim'}
                  onChange={onChangeDarkTheme}
                />
              </Animated.View>
            )}

            <Animated.View layout={native(LinearTransition)}>
              <SettingsList.Divider />

              <AppearanceToggleButtonGroup
                title={_(msg`Font`)}
                description={_(
                  msg`For the best experience, we recommend using the theme font.`,
                )}
                icon={Aa}
                items={[
                  {
                    label: _(msg`System`),
                    name: 'system',
                  },
                  {
                    label: _(msg`Theme`),
                    name: 'theme',
                  },
                ]}
                value={fonts.family}
                onChange={onChangeFontFamily}
              />

              <AppearanceToggleButtonGroup
                title={_(msg`Font size`)}
                icon={TextSize}
                items={[
                  {
                    label: _(msg`Smaller`),
                    name: '-1',
                  },
                  {
                    label: _(msg`Default`),
                    name: '0',
                  },
                  {
                    label: _(msg`Larger`),
                    name: '1',
                  },
                ]}
                value={fonts.scale}
                onChange={onChangeFontScale}
              />

              {IS_ANDROID && (
                <>
                  <SettingsList.Divider />

                  <SettingsList.Group contentContainerStyle={[a.gap_sm]}>
                    <SettingsList.ItemIcon icon={PaletteIcon} />
                    <SettingsList.ItemText>
                      <Trans>Material You</Trans>
                    </SettingsList.ItemText>
                    <Toggle.Item
                      name="material_you"
                      label={_(msg`Use the system accent color`)}
                      value={materialYou}
                      onChange={value => setMaterialYou(value)}
                      style={[a.w_full]}>
                      <Toggle.LabelText style={[a.flex_1]}>
                        <Trans>Use the system accent color</Trans>
                      </Toggle.LabelText>
                      <Toggle.Platform />
                    </Toggle.Item>
                  </SettingsList.Group>
                </>
              )}

              {IS_WEB && (
                <>
                  <SettingsList.Divider />

                  <SettingsList.Group contentContainerStyle={[a.gap_md]}>
                    <SettingsList.ItemIcon icon={PaletteIcon} />
                    <SettingsList.ItemText>
                      <Trans>Material You</Trans>
                    </SettingsList.ItemText>
                    <View style={[a.w_full, a.gap_sm]}>
                      <Text
                        style={[
                          a.text_sm,
                          a.leading_snug,
                          t.atoms.text_contrast_medium,
                        ]}>
                        <Trans>
                          Choose an accent and surface color palette.
                        </Trans>
                      </Text>
                      <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
                        {THEME_COLOR_PRESETS.map(preset => {
                          const selected = themeColorPreset === preset.id
                          const swatchColor =
                            preset.id === 'custom' ? customThemeHex : preset.hex
                          return (
                            <Pressable
                              key={preset.id}
                              accessibilityRole="radio"
                              accessibilityState={{selected}}
                              accessibilityLabel={preset.label}
                              accessibilityHint=""
                              onPress={() => setThemeColorPreset(preset.id)}
                              style={[
                                a.flex_row,
                                a.align_center,
                                a.gap_xs,
                                a.px_md,
                                a.py_sm,
                                a.rounded_full,
                                {
                                  backgroundColor: selected
                                    ? c.secondaryContainer
                                    : c.surfaceContainer,
                                  borderWidth: 1.5,
                                  borderColor: selected
                                    ? c.primary
                                    : c.outlineVariant,
                                },
                              ]}>
                              <View
                                style={[
                                  a.rounded_full,
                                  a.align_center,
                                  a.justify_center,
                                  {
                                    width: 18,
                                    height: 18,
                                    backgroundColor: swatchColor,
                                  },
                                ]}>
                                {selected && (
                                  <CheckIcon size="xs" fill="#FFFFFF" />
                                )}
                              </View>
                              <Text
                                style={[
                                  a.text_sm,
                                  selected ? a.font_bold : a.font_medium,
                                  {
                                    color: selected
                                      ? c.onSecondaryContainer
                                      : c.onSurface,
                                  },
                                ]}>
                                {preset.label}
                              </Text>
                            </Pressable>
                          )
                        })}
                      </View>
                      {themeColorPreset === 'custom' && (
                        <View style={[a.w_full, a.pt_xs]}>
                          <TextField.Root>
                            <TextField.Input
                              label={_(msg`Custom hex color (#RRGGBB)`)}
                              value={hexDraft}
                              autoCapitalize="characters"
                              onChangeText={val => {
                                setHexDraft(val)
                                const cleaned = val.startsWith('#')
                                  ? val
                                  : `#${val}`
                                if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) {
                                  setCustomThemeHex(cleaned)
                                }
                              }}
                            />
                          </TextField.Root>
                        </View>
                      )}
                    </View>
                  </SettingsList.Group>
                </>
              )}

              <SettingsList.Divider />

              <SettingsList.Group contentContainerStyle={[a.gap_sm]}>
                <SettingsList.ItemIcon icon={EyeSlashIcon} />
                <SettingsList.ItemText>
                  <Trans>Tab labels</Trans>
                </SettingsList.ItemText>
                <Toggle.Item
                  name="hide_tab_labels"
                  label={_(msg`Hide labels on the bottom tabs`)}
                  value={hideTabLabels}
                  onChange={value => setHideTabLabels(value)}
                  style={[a.w_full]}>
                  <Toggle.LabelText style={[a.flex_1]}>
                    <Trans>Hide labels on the bottom tabs</Trans>
                  </Toggle.LabelText>
                  <Toggle.Platform />
                </Toggle.Item>
              </SettingsList.Group>

              <SettingsList.Divider />

              <SettingsList.Group contentContainerStyle={[a.gap_sm]}>
                <SettingsList.ItemIcon icon={SparkleIcon} />
                <SettingsList.ItemText>
                  <Trans>Kawaii logo</Trans>
                </SettingsList.ItemText>
                <Toggle.Item
                  name="kawaii"
                  label={_(msg`Use the kawaii logo`)}
                  value={kawaii ?? false}
                  onChange={value => setKawaii(value)}
                  style={[a.w_full]}>
                  <Toggle.LabelText style={[a.flex_1]}>
                    <Trans>Use the kawaii logo</Trans>
                  </Toggle.LabelText>
                  <Toggle.Platform />
                </Toggle.Item>
              </SettingsList.Group>

              {/*{IS_NATIVE && IS_INTERNAL && (
                <>
                  <SettingsList.Divider />
                  <AppIconSettingsListItem />
                </>
              )}*/}
            </Animated.View>
          </SettingsList.Container>
        </Layout.Content>
      </Layout.Screen>
    </LayoutAnimationConfig>
  )
}

export function AppearanceToggleButtonGroup<T extends string>({
  title,
  description,
  icon: Icon,
  items,
  value,
  onChange,
}: {
  title: string
  description?: string
  icon: React.ComponentType<SVGIconProps>
  items: {
    label: string
    name: T
  }[]
  value: T
  onChange: (value: T) => void
}) {
  const t = useTheme()
  return (
    <>
      <SettingsList.Group contentContainerStyle={[a.gap_sm]} iconInset={false}>
        <SettingsList.ItemIcon icon={Icon} />
        <SettingsList.ItemText>{title}</SettingsList.ItemText>
        {description && (
          <Text
            style={[
              a.text_sm,
              a.leading_snug,
              t.atoms.text_contrast_medium,
              a.w_full,
            ]}>
            {description}
          </Text>
        )}
        <SegmentedControl.Root
          type="radio"
          label={title}
          value={value}
          onChange={onChange}>
          {items.map(item => (
            <SegmentedControl.Item
              key={item.name}
              label={item.label}
              value={item.name}>
              <SegmentedControl.ItemText>
                {item.label}
              </SegmentedControl.ItemText>
            </SegmentedControl.Item>
          ))}
        </SegmentedControl.Root>
      </SettingsList.Group>
    </>
  )
}
