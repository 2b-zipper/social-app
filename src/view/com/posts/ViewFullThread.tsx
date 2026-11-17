import {useMemo} from 'react'
import {View} from 'react-native'
import Svg, {Circle, Line} from 'react-native-svg'
import {AtUri} from '@atproto/syntax'
import {useLingui} from '@lingui/react/macro'

import {makeProfileLink} from '#/lib/routes/links'
import {atoms as a, useTheme} from '#/alf'
import {Link} from '#/components/Link'
import {SubtleHover} from '#/components/SubtleHover'
import {Text} from '#/components/Typography'

export function ViewFullThread({uri}: {uri: string}) {
  const t = useTheme()
  const itemHref = useMemo(() => {
    const urip = new AtUri(uri)
    return makeProfileLink({did: urip.hostname, handle: ''}, 'post', urip.rkey)
  }, [uri])
  const {t: l} = useLingui()

  return (
    <Link
      style={[
        a.flex_row,
        a.align_center,
        t.atoms.bg_contrast_25,
        {
          gap: 10,
          paddingLeft: 14,
          paddingVertical: 6,
          marginHorizontal: 8,
          marginVertical: 1,
          borderRadius: 6,
          overflow: 'hidden',
        },
      ]}
      to={itemHref}
      label={l`View full thread`}>
      {({hovered}) => (
        <>
          <SubtleHover hover={hovered} />
          <View style={[a.align_center, {width: 42}]}>
            <Svg width="4" height="36">
              <Line
                x1="2"
                y1="0"
                x2="2"
                y2="13"
                stroke={t.palette.primary_200}
                strokeWidth="2.5"
              />
              <Circle cx="2" cy="19" r="1.5" fill={t.palette.primary_200} />
              <Circle cx="2" cy="25" r="1.5" fill={t.palette.primary_200} />
              <Circle cx="2" cy="31" r="1.5" fill={t.palette.primary_200} />
            </Svg>
          </View>
          <Text style={[a.text_md, t.atoms.text_link, a.font_semi_bold]}>
            {/* HACKFIX: Trans isn't working after SDK 53 upgrade -sfn */}
            {l`View full thread`}
          </Text>
        </>
      )}
    </Link>
  )
}
