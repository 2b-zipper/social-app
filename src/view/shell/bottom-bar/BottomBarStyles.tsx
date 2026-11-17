import {StyleSheet} from 'react-native'

import {clamp} from '#/lib/numbers'
import {useHideTabLabels} from '#/state/preferences'
import {atoms as a, tokens} from '#/alf'

export const NAV_BAR_HEIGHT = 64
export const NAV_BAR_HEIGHT_COMPACT = 56

export function useNavBarHeight() {
  return useHideTabLabels() ? NAV_BAR_HEIGHT_COMPACT : NAV_BAR_HEIGHT
}

export const NAV_INDICATOR_WIDTH = 56
export const NAV_INDICATOR_HEIGHT = 32

export function navBarBottomInset(safeAreaBottom: number) {
  return clamp(safeAreaBottom, 8, 60)
}

export const styles = StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomBarWeb: {
    ...a.fixed,
    flexDirection: 'row',
    paddingLeft: tokens.space.sm,
    paddingRight: tokens.space.sm,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  items: {
    flexDirection: 'row',
    paddingHorizontal: tokens.space.xs,
  },
  ctrl: {
    flex: 1,
    paddingTop: 10,
    paddingBottom: 4,
    alignItems: 'center',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 6,
  },
  itemCompact: {
    justifyContent: 'center',
    paddingTop: 0,
  },
  indicatorBox: {
    width: NAV_INDICATOR_WIDTH,
    height: NAV_INDICATOR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    ...StyleSheet.absoluteFill,
    borderRadius: NAV_INDICATOR_HEIGHT / 2,
  },
  label: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  largeBadge: {
    position: 'absolute',
    top: 0,
    left: NAV_INDICATOR_WIDTH / 2 + 2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  largeBadgeLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
  smallBadge: {
    position: 'absolute',
    top: 4,
    left: NAV_INDICATOR_WIDTH / 2 + 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    zIndex: 1,
  },
  notificationCount: {
    position: 'absolute',
    left: '52%',
    top: 8,
    paddingHorizontal: 5,
    paddingTop: 1,
    paddingBottom: 2,
    borderRadius: 6,
    zIndex: 1,
  },
  notificationCountWeb: {
    paddingTop: 3,
    paddingBottom: 3,
    borderRadius: 12,
  },
  notificationCountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
  hasNewBadge: {
    position: 'absolute',
    left: '54%',
    marginLeft: 4,
    top: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 1,
  },
  ctrlIcon: {
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  ctrlIconSizingWrapper: {},
  homeIcon: {},
  feedsIcon: {},
  searchIcon: {
    top: -1,
  },
  bellIcon: {},
  profileIcon: {
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  profileIconSquare: {
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  messagesIcon: {},
  onProfile: {
    borderWidth: 1,
    borderRadius: 100,
  },
  onProfileSquare: {
    borderWidth: 1,
    borderRadius: 3,
  },
})
