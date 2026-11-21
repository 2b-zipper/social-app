import {StyleSheet, View} from 'react-native'
import * as DismissableLayer from '@radix-ui/react-dismissable-layer'
import * as FocusGuards from '@radix-ui/react-focus-guards'
import * as FocusScope from '@radix-ui/react-focus-scope'
import {RemoveScrollBar} from 'react-remove-scroll-bar'

import {useA11y} from '#/state/a11y'
import {type ComposerOpts, useComposerState} from '#/state/shell/composer'
import {ComposePost, useComposerCancelRef} from '#/view/com/composer/Composer'
import {atoms as a, flatten, useBreakpoints, useTheme} from '#/alf'
import * as m3e from '#/alf/m3e'

const BOTTOM_BAR_HEIGHT = 65

export function Composer() {
  const state = useComposerState()
  const isActive = !!state

  if (!isActive) {
    return null
  }

  return (
    <>
      <RemoveScrollBar />
      <Inner state={state} />
    </>
  )
}

function Inner({state}: {state: ComposerOpts}) {
  const ref = useComposerCancelRef()
  const t = useTheme()
  const c = m3e.colors(t)
  const {gtMobile} = useBreakpoints()
  const {reduceMotionEnabled} = useA11y()

  FocusGuards.useFocusGuards()

  return (
    <FocusScope.FocusScope loop trapped asChild>
      <DismissableLayer.DismissableLayer
        role="dialog"
        aria-modal
        style={flatten([
          {position: 'fixed'},
          a.inset_0,
          {backgroundColor: c.scrim},
          a.flex,
          a.flex_col,
          a.align_center,
          !reduceMotionEnabled && a.fade_in,
        ])}
        onFocusOutside={evt => evt.preventDefault()}
        onInteractOutside={evt => evt.preventDefault()}
        onDismiss={() => ref.current?.onPressCancel()}>
        <View
          style={[
            styles.container,
            !gtMobile && styles.containerMobile,
            t.atoms.bg,
            t.atoms.shadow_xl,
            {borderColor: c.outlineVariant},
            !reduceMotionEnabled && [
              a.zoom_fade_in,
              {animationFillMode: 'backwards'},
            ],
          ]}>
          <ComposePost
            cancelRef={ref}
            replyTo={state.replyTo}
            quote={state.quote}
            onPost={state.onPost}
            onPostSuccess={state.onPostSuccess}
            mention={state.mention}
            text={state.text}
            imageUris={state.imageUris}
            videoUri={state.videoUri}
            openGallery={state.openGallery}
          />
        </View>
      </DismissableLayer.DismissableLayer>
    </FocusScope.FocusScope>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    maxWidth: 600,
    width: '100%',
    paddingVertical: 0,
    borderRadius: 25,
    marginBottom: 0,
    borderWidth: 1,
    maxHeight: 'calc(100% - (40px * 2))',
    overflow: 'hidden',
  },
  containerMobile: {
    borderRadius: 0,
    marginBottom: BOTTOM_BAR_HEIGHT,
    maxHeight: `calc(100% - ${BOTTOM_BAR_HEIGHT}px)`,
  },
})
