import {useCallback, useEffect, useRef, useState} from 'react'
import {
  type LayoutChangeEvent,
  type ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import * as m3e from '#/alf/m3e'
import {Text} from '#/components/Typography'
import {PressableWithHover} from '../util/PressableWithHover'
import {DraggableScrollView} from './DraggableScrollView'

export interface TabBarProps {
  testID?: string
  selectedPage: number
  items: string[]
  /** Unread status by tab index. */
  unread?: boolean[]
  align?: 'center' | 'left'
  indicatorColor?: string
  backgroundColor?: string

  onSelect?: (index: number) => void
  onPressSelected?: (index: number) => void

  /**
   * The drag-following indicator and transparent background only exist in
   * the native tab bar - accepted here so shared callers typecheck.
   */
  dragProgress?: SharedValue<number> // Ignored on web.
  dragState?: SharedValue<'idle' | 'dragging' | 'settling'> // Ignored on web.
  transparent?: boolean
}

const CONTENT_PADDING = 6
const ITEM_INSET = 4
const ITEM_VERTICAL_PADDING = 6
// How much of the previous/next item we're showing
// to give the user a hint there's more to scroll.
const OFFSCREEN_ITEM_WIDTH = 20

export function TabBar({
  testID,
  selectedPage,
  items,
  unread,
  align = 'center',
  onSelect,
  onPressSelected,
  transparent,
}: TabBarProps) {
  const t = useTheme()
  const c = m3e.colors(t)
  const {t: l} = useLingui()
  const scrollElRef = useRef<React.ComponentRef<typeof ScrollView>>(null)
  const itemRefs = useRef<Array<Element>>([])
  const {gtMobile} = useBreakpoints()
  const [itemLayouts, setItemLayouts] = useState<
    Record<number, {x: number; width: number}>
  >({})

  const indicatorX = useSharedValue(0)
  const indicatorW = useSharedValue(0)
  const hasIndicator = useSharedValue(0)

  const selectedLayout = itemLayouts[selectedPage]
  useEffect(() => {
    if (!selectedLayout) return
    const targetX = selectedLayout.x + ITEM_INSET
    const targetW = Math.max(0, selectedLayout.width - 2 * ITEM_INSET)
    if (hasIndicator.get() === 0) {
      indicatorX.set(targetX)
      indicatorW.set(targetW)
      hasIndicator.set(1)
    } else {
      const timingConfig = {
        duration: 220,
        easing: Easing.bezier(0.2, 0, 0, 1),
      }
      indicatorX.set(withTiming(targetX, timingConfig))
      indicatorW.set(withTiming(targetW, timingConfig))
    }
  }, [selectedLayout, indicatorX, indicatorW, hasIndicator])

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: hasIndicator.get(),
    width: indicatorW.get(),
    transform: [{translateX: indicatorX.get()}],
  }))

  useEffect(() => {
    const parent = scrollElRef.current?.getScrollableNode?.() as unknown as
      HTMLElement | undefined
    if (!parent) {
      return
    }
    const parentRect = parent.getBoundingClientRect()
    if (!parentRect) {
      return
    }
    const {
      left: parentLeft,
      right: parentRight,
      width: parentWidth,
    } = parentRect
    const child = itemRefs.current[selectedPage]
    if (!child) {
      return
    }
    const childRect = child.getBoundingClientRect?.()
    if (!childRect) {
      return
    }
    const {left: childLeft, right: childRight, width: childWidth} = childRect
    let dx = 0
    if (childRight >= parentRight) {
      dx += childRight - parentRight
      dx += parentWidth - childWidth - OFFSCREEN_ITEM_WIDTH
    } else if (childLeft <= parentLeft) {
      dx -= parentLeft - childLeft
      dx -= parentWidth - childWidth - OFFSCREEN_ITEM_WIDTH
    }
    let x = parent.scrollLeft + dx
    x = Math.max(0, x)
    x = Math.min(x, parent.scrollWidth - parentWidth)
    if (dx !== 0) {
      parent.scroll({
        left: x,
        behavior: 'smooth',
      })
    }
  }, [scrollElRef, selectedPage, align])

  const onPressItem = useCallback(
    (index: number) => {
      onSelect?.(index)
      if (index === selectedPage) {
        onPressSelected?.(index)
      }
    },
    [onSelect, selectedPage, onPressSelected],
  )

  const handleItemLayout = useCallback(
    (index: number, e: LayoutChangeEvent) => {
      const {x, width} = e.nativeEvent.layout
      setItemLayouts(prev => {
        const curr = prev[index]
        if (curr && curr.x === x && curr.width === width) return prev
        return {...prev, [index]: {x, width}}
      })
    },
    [],
  )

  return (
    <View
      testID={testID}
      style={[
        !transparent && t.atoms.bg,
        styles.outer,
        gtMobile && styles.outerDesktop,
      ]}
      accessibilityRole="tablist">
      <DraggableScrollView
        testID={`${testID}-selector`}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        ref={scrollElRef}
        contentContainerStyle={styles.contentContainer}>
        <View
          style={[styles.items, align === 'center' && styles.itemsCentered]}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              {backgroundColor: c.secondaryContainer},
              indicatorStyle,
            ]}
          />
          {items.map((item, i) => {
            const selected = i === selectedPage
            return (
              <View
                key={`${item}-${i}`}
                onLayout={e => handleItemLayout(i, e)}
                ref={node => {
                  itemRefs.current[i] = node as unknown as Element
                }}
                style={[
                  styles.itemContainer,
                  align === 'center' && styles.itemContainerCentered,
                ]}>
                <PressableWithHover
                  testID={`${testID}-selector-${i}`}
                  style={[
                    styles.item,
                    align === 'center' && styles.itemCentered,
                  ]}
                  hoverStyle={a.bg_transparent}
                  onPress={() => onPressItem(i)}
                  accessibilityLabel={
                    unread?.[i] ? l`${item}, unread` : undefined
                  }
                  accessibilityHint=""
                  accessibilityRole="tab">
                  <View style={styles.itemInner}>
                    <View
                      style={[
                        {opacity: selected ? 1 : 0.7},
                        unread?.[i] !== undefined && {paddingHorizontal: 12},
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
                      {unread?.[i] && (
                        <View
                          aria-hidden
                          testID={testID ? `${testID}-unread-${i}` : undefined}
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
                    </View>
                  </View>
                </PressableWithHover>
              </View>
            )
          })}
        </View>
      </DraggableScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    flexDirection: 'row',
  },
  outerDesktop: {
    width: 600,
  },
  contentContainer: {
    flexGrow: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: CONTENT_PADDING,
  },
  items: {
    flexDirection: 'row',
    position: 'relative',
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
  indicator: {
    position: 'absolute',
    top: ITEM_VERTICAL_PADDING,
    bottom: ITEM_VERTICAL_PADDING,
    left: 0,
    borderRadius: 999,
  },
  item: {
    paddingVertical: ITEM_VERTICAL_PADDING,
    paddingHorizontal: ITEM_INSET,
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
    ...web({overflowX: 'hidden'}),
  },
  itemText: {
    lineHeight: 20,
    textAlign: 'center',
  },
})
