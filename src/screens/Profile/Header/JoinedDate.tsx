import {useState} from 'react'
import {View} from 'react-native'
import {AtUri} from '@atproto/syntax'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'
import {differenceInDays, differenceInMonths, differenceInYears} from 'date-fns'

import {HITSLOP_10} from '#/lib/constants'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useAccountDetailsQuery} from '#/state/queries/account-details'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useDialogControl} from '#/components/Dialog'
import {CalendarDays_Stroke2_Corner0_Rounded as CalendarDaysIcon} from '#/components/icons/CalendarDays'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {type app} from '#/lexicons'
import {navigate} from '#/Navigation'

export function ProfileHeaderJoinedDate({
  profile,
}: {
  profile: app.bsky.actor.defs.ProfileViewDetailed
}) {
  const t = useTheme()
  const {t: l, i18n} = useLingui()
  const control = useDialogControl()

  if (!profile.createdAt) return null

  const joinedDate = i18n.date(new Date(profile.createdAt), {
    dateStyle: 'long',
  })

  return (
    <View style={[a.flex_row]}>
      <Button
        label={l`View account details`}
        hitSlop={HITSLOP_10}
        onPress={control.open}>
        {({hovered, pressed}) => (
          <View
            style={[
              a.flex_row,
              a.align_center,
              a.gap_xs,
              {opacity: hovered || pressed ? 0.5 : 1},
            ]}>
            <CalendarDaysIcon
              size="sm"
              fill={t.atoms.text_contrast_medium.color}
            />
            <Text
              style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
              <Trans>Joined {joinedDate}</Trans>
            </Text>
          </View>
        )}
      </Button>

      <Dialog.Outer control={control}>
        <Dialog.Handle />
        <DialogInner profile={profile} createdAt={profile.createdAt} />
      </Dialog.Outer>
    </View>
  )
}

function DialogInner({
  profile,
  createdAt,
}: {
  profile: app.bsky.actor.defs.ProfileViewDetailed
  createdAt: string
}) {
  const control = Dialog.useDialogContext()
  const {t: l, i18n} = useLingui()
  const [now] = useState(() => new Date())
  const {data, isPending, isError} = useAccountDetailsQuery(profile.did)

  const firstPostUri = data?.firstPostUri

  const created = new Date(createdAt)
  const years = differenceInYears(now, created)
  const months = differenceInMonths(now, created) - years * 12
  const accountAge =
    years > 0
      ? `${plural(years, {one: '# year', other: '# years'})}, ${plural(months, {
          one: '# month',
          other: '# months',
        })}`
      : months > 0
        ? plural(months, {one: '# month', other: '# months'})
        : plural(differenceInDays(now, created), {
            one: '# day',
            other: '# days',
          })

  return (
    <Dialog.ScrollableInner label={l`Account details`}>
      <View style={[a.gap_lg]}>
        <Text style={[a.text_2xl, a.font_bold]}>
          <Trans>Account details</Trans>
        </Text>

        <View style={[a.gap_md]}>
          <DetailRow label={l`Joined`}>
            {i18n.date(new Date(createdAt), {
              dateStyle: 'long',
              timeStyle: 'short',
            })}
          </DetailRow>
          <DetailRow label={l`Account age`}>{accountAge}</DetailRow>
          <DetailRow label={l`Handle`}>
            {sanitizeHandle(profile.handle, '@')}
          </DetailRow>
          <DetailRow label={l`DID`}>{profile.did}</DetailRow>
          <DetailRow label={l`Hosting provider`}>
            {isPending ? l`Loading…` : (data?.pds ?? l`Unknown`)}
          </DetailRow>
        </View>

        {isPending ? (
          <View style={[a.py_md, a.align_center]}>
            <Loader size="lg" />
          </View>
        ) : firstPostUri ? (
          <Button
            label={l`Go to first post`}
            color="secondary"
            size="large"
            onPress={() => {
              control.close(() => {
                void navigate({
                  name: 'PostThread',
                  params: {
                    name: profile.did,
                    rkey: new AtUri(firstPostUri).rkey,
                  },
                })
              })
            }}>
            <ButtonText>
              <Trans>Go to first post</Trans>
            </ButtonText>
          </Button>
        ) : (
          <Text style={[a.text_sm, a.leading_snug, a.italic]}>
            {isError ? (
              <Trans>Could not reach this account's hosting provider.</Trans>
            ) : (
              <Trans>This account has no posts.</Trans>
            )}
          </Text>
        )}

        <Button
          label={l`Close`}
          color="primary"
          size="large"
          onPress={() => control.close()}>
          <ButtonText>
            <Trans>Close</Trans>
          </ButtonText>
        </Button>
      </View>
    </Dialog.ScrollableInner>
  )
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  const t = useTheme()
  return (
    <View style={[a.gap_2xs]}>
      <Text
        style={[
          a.text_sm,
          a.font_semi_bold,
          a.leading_snug,
          t.atoms.text_contrast_medium,
        ]}>
        {label}
      </Text>
      <Text style={[a.text_md, a.leading_snug]}>{children}</Text>
    </View>
  )
}
