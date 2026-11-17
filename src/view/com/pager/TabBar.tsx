import {useCallback} from 'react'
import {
  type LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import Animated, {
  interpolate,
  scrollTo,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import {scheduleOnRN, scheduleOnUI} from 'react-native-worklets'
import {useLingui} from '@lingui/react/macro'

import {PressableWithHover} from '#/view/com/util/PressableWithHover'
import {BlockDrawerGesture} from '#/view/shell/BlockDrawerGesture'
import {atoms as a, useTheme} from '#/alf'
import {Center} from '#/components/Layout'
import {Text} from '#/components/Typography'

export interface TabBarProps {
  testID?: string
  selectedPage: number
  items: string[]
  /** Unread status by tab index. */
  unread?: boolean[]
  align?: 'center' | 'left'
  onSelect?: (index: number) => void
  onPressSelected?: (index: number) => void
  dragProgress: SharedValue<number>
  dragState: SharedValue<'idle' | 'dragging' | 'settling'>
  transparent?: boolean
}

const CONTENT_PADDING = 6
// How much of the previous/next item we're requiring
// when deciding whether to scroll into view on tap.
const OFFSCREEN_ITEM_WIDTH = 20

export function TabBar({
  testID,
  selectedPage,
  items,
  unread,
  align = 'center',
  onSelect,
  onPressSelected,
  dragProgress,
  dragState,
  transparent,
}: TabBarProps) {
  const t = useTheme()
  const scrollElRef = useAnimatedRef<ScrollView>()
  const syncScrollState = useSharedValue<'synced' | 'unsynced' | 'needs-sync'>(
    'synced',
  )
  const didInitialScroll = useSharedValue(false)
  const contentSize = useSharedValue(0)
  const containerSize = useSharedValue(0)
  const scrollX = useSharedValue(0)
  const layouts = useSharedValue<{x: number; width: number}[]>([])
  const itemsLength = items.length

  const scrollToOffsetJS = useCallback(
    (x: number) => {
      scrollElRef.current?.scrollTo({
        x,
        y: 0,
        animated: true,
      })
    },
    [scrollElRef],
  )

  const indexToOffset = useCallback(
    (index: number) => {
      'worklet'
      const layout = layouts.get()[index]
      const availableSize = containerSize.get() - 2 * CONTENT_PADDING
      const maxOffset = Math.max(0, contentSize.get() - availableSize)
      if (!layout) {
        // Should not happen, but fall back to equal sizes.
        return itemsLength > 1 ? (index / (itemsLength - 1)) * maxOffset : 0
      }
      if (maxOffset === 0) {
        return 0
      }
      const freeSpace = availableSize - layout.width
      const accumulatingOffset = interpolate(
        index,
        // Gradually shift every next item to the left so that the first item
        // is positioned like "left: 0" but the last item is like "right: 0".
        [0, itemsLength - 1],
        [0, freeSpace],
        'clamp',
      )
      return Math.min(Math.max(layout.x - accumulatingOffset, 0), maxOffset)
    },
    [itemsLength, contentSize, containerSize, layouts],
  )

  const progressToOffset = useCallback(
    (progress: number) => {
      'worklet'
      return interpolate(
        progress,
        [Math.floor(progress), Math.ceil(progress)],
        [
          indexToOffset(Math.floor(progress)),
          indexToOffset(Math.ceil(progress)),
        ],
        'clamp',
      )
    },
    [indexToOffset],
  )

  // When we know the entire layout for the first time, scroll selection into view.
  useAnimatedReaction(
    () => layouts.get().length,
    (nextLayoutsLength, prevLayoutsLength) => {
      if (nextLayoutsLength !== prevLayoutsLength) {
        if (
          nextLayoutsLength === itemsLength &&
          didInitialScroll.get() === false
        ) {
          didInitialScroll.set(true)
          const progress = dragProgress.get()
          const offset = progressToOffset(progress)
          // It's unclear why we need to go back to JS here. It seems iOS-specific.
          scheduleOnRN(scrollToOffsetJS, offset)
        }
      }
    },
  )

  // When you swipe the pager, the tabbar should scroll automatically
  // as you're dragging the page and then even during deceleration.
  useAnimatedReaction(
    () => dragProgress.get(),
    (nextProgress, prevProgress) => {
      if (
        nextProgress !== prevProgress &&
        dragState.value !== 'idle' &&
        // This is only OK to do when we're 100% sure we're synced.
        // Otherwise, there would be a jump at the beginning of the swipe.
        syncScrollState.get() === 'synced'
      ) {
        const offset = progressToOffset(nextProgress)
        scrollTo(scrollElRef, offset, 0, false)
      }
    },
  )

  // If the syncing is currently off but you've just finished swiping,
  // it's an opportunity to resync. It won't feel disruptive because
  // you're not directly interacting with the tabbar at the moment.
  useAnimatedReaction(
    () => dragState.value,
    (nextDragState, prevDragState) => {
      if (
        nextDragState !== prevDragState &&
        nextDragState === 'idle' &&
        (syncScrollState.get() === 'unsynced' ||
          syncScrollState.get() === 'needs-sync')
      ) {
        const progress = dragProgress.get()
        const offset = progressToOffset(progress)
        scrollTo(scrollElRef, offset, 0, true)
        syncScrollState.set('synced')
      }
    },
  )

  // When you press on the item, we'll scroll into view -- unless you previously
  // have scrolled the tabbar manually, in which case it'll re-sync on next press.
  const onPressUIThread = useCallback(
    (index: number) => {
      'worklet'
      const itemLayout = layouts.get()[index]
      if (!itemLayout) {
        // Should not happen.
        return
      }
      const leftEdge = itemLayout.x - OFFSCREEN_ITEM_WIDTH
      const rightEdge = itemLayout.x + itemLayout.width + OFFSCREEN_ITEM_WIDTH
      const scrollLeft = scrollX.get()
      const scrollRight = scrollLeft + containerSize.get()
      const scrollIntoView = leftEdge < scrollLeft || rightEdge > scrollRight
      if (
        syncScrollState.get() === 'synced' ||
        syncScrollState.get() === 'needs-sync' ||
        scrollIntoView
      ) {
        const offset = progressToOffset(index)
        scrollTo(scrollElRef, offset, 0, true)
        syncScrollState.set('synced')
      } else {
        // The item is already in view so it's disruptive to
        // scroll right now. Do it on the next opportunity.
        syncScrollState.set('needs-sync')
      }
    },
    [
      syncScrollState,
      scrollElRef,
      scrollX,
      progressToOffset,
      containerSize,
      layouts,
    ],
  )

  const onItemLayout = useCallback(
    (i: number, layout: {x: number; width: number}) => {
      'worklet'
      layouts.modify(ls => {
        ls[i] = layout
        return ls
      })
    },
    [layouts],
  )

  const onPressItem = useCallback(
    (index: number) => {
      scheduleOnUI(onPressUIThread, index)
      onSelect?.(index)
      if (index === selectedPage) {
        onPressSelected?.(index)
      }
    },
    [onSelect, selectedPage, onPressSelected, onPressUIThread],
  )

  return (
    <Center
      testID={testID}
      style={[!transparent && t.atoms.bg, a.flex_row]}
      accessibilityRole="tablist">
      <BlockDrawerGesture>
        <ScrollView
          testID={`${testID}-selector`}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          ref={scrollElRef}
          contentContainerStyle={styles.contentContainer}
          onLayout={e => {
            containerSize.set(e.nativeEvent.layout.width)
          }}
          onScrollBeginDrag={() => {
            // Remember that you've manually messed with the tabbar scroll.
            // This will disable auto-adjustment until after next pager swipe or item tap.
            syncScrollState.set('unsynced')
          }}
          onScroll={e => {
            scrollX.set(Math.round(e.nativeEvent.contentOffset.x))
          }}>
          <Animated.View
            onLayout={e => {
              contentSize.set(e.nativeEvent.layout.width)
            }}
            style={[styles.items, align === 'center' && styles.itemsCentered]}>
            {items.map((item, i) => {
              return (
                <TabBarItem
                  key={i}
                  index={i}
                  isSelected={i === selectedPage}
                  testID={testID}
                  dragProgress={dragProgress}
                  item={item}
                  unread={unread?.[i]}
                  onPressItem={onPressItem}
                  onItemLayout={onItemLayout}
                  align={align}
                />
              )
            })}
          </Animated.View>
        </ScrollView>
      </BlockDrawerGesture>
    </Center>
  )
}

function TabBarItem({
  index,
  isSelected,
  testID,
  dragProgress,
  item,
  unread,
  onPressItem,
  onItemLayout,
  align,
}: {
  index: number
  isSelected: boolean
  testID: string | undefined
  dragProgress: SharedValue<number>
  item: string
  unread?: boolean
  onPressItem: (index: number) => void
  onItemLayout: (index: number, layout: {x: number; width: number}) => void
  align: 'center' | 'left'
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const textOpacityStyle = useAnimatedStyle(() => {
    if (!_WORKLET) {
      return {opacity: isSelected ? 1 : 0.7}
    }
    return {
      opacity: interpolate(
        dragProgress.get(),
        [index - 1, index, index + 1],
        [0.7, 1, 0.7],
        'clamp',
      ),
    }
  })

  const pillStyle = useAnimatedStyle(() => {
    if (!_WORKLET) {
      return {opacity: isSelected ? 1 : 0}
    }
    const activeAmount = interpolate(
      dragProgress.get(),
      [index - 1, index, index + 1],
      [0, 1, 0],
      'clamp',
    )
    return {
      opacity: activeAmount,
      transform: [
        {
          scale: interpolate(activeAmount, [0, 1], [0.92, 1], 'clamp'),
        },
      ],
    }
  })

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      scheduleOnUI(onItemLayout, index, e.nativeEvent.layout)
    },
    [index, onItemLayout],
  )

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.itemContainer,
        align === 'center' && styles.itemContainerCentered,
      ]}>
      <PressableWithHover
        testID={`${testID}-selector-${index}`}
        style={[styles.item, align === 'center' && styles.itemCentered]}
        hoverStyle={a.bg_transparent}
        onPress={() => onPressItem(index)}
        accessibilityLabel={unread ? l`${item}, unread` : undefined}
        accessibilityHint=""
        accessibilityRole="tab">
        <View style={[styles.itemInner, t.atoms.bg_contrast_25]}>
          <Animated.View
            style={[
              a.absolute,
              a.inset_0,
              a.rounded_full,
              {backgroundColor: t.palette.primary_100},
              pillStyle,
            ]}
          />
          <Animated.View
            style={[
              textOpacityStyle,
              unread !== undefined && {paddingHorizontal: 12},
            ]}>
            <Text
              emoji
              testID={testID ? `${testID}-${item}` : undefined}
              style={[
                styles.itemText,
                t.atoms.text,
                a.text_md,
                a.font_semi_bold,
              ]}>
              {item}
            </Text>
            {unread && (
              <View
                aria-hidden
                testID={testID ? `${testID}-unread-${index}` : undefined}
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 0,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: t.palette.primary_500,
                }}
              />
            )}
          </Animated.View>
        </View>
      </PressableWithHover>
    </View>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: CONTENT_PADDING,
  },
  items: {
    flexDirection: 'row',
  },
  itemsCentered: {
    flexGrow: 1,
  },
  itemContainer: {
    flexShrink: 0,
  },
  itemContainerCentered: {
    flexGrow: 1,
  },
  item: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  itemCentered: {
    flexGrow: 1,
  },
  itemInner: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    overflow: 'hidden',
  },
  itemText: {
    lineHeight: 20,
    textAlign: 'center',
  },
})
