import {type AppBskyFeedDefs, type ModerationUI} from '@atproto/api'

import * as persisted from '#/state/persisted'

const BYPASSED_BLOCK = '__bypassedBlock'

export function markBypassedBlock<T extends AppBskyFeedDefs.PostView>(
  post: T,
): T {
  return {...post, [BYPASSED_BLOCK]: true}
}

export function isBypassedBlockPost(post: AppBskyFeedDefs.PostView) {
  return BYPASSED_BLOCK in post
}

export function markBypassedBlockFeed(feed: AppBskyFeedDefs.FeedViewPost[]) {
  return feed.map(item => ({...item, post: markBypassedBlock(item.post)}))
}

const BLOCK_CAUSES = ['blocking', 'blocked-by', 'block-other']

function isBlockCause(cause: {type: string}) {
  return BLOCK_CAUSES.includes(cause.type)
}

export function ignoreBlockUi(modui: ModerationUI): ModerationUI {
  if (!persisted.get('bypassBlocks')) return modui
  const next: ModerationUI = Object.assign(
    Object.create(Object.getPrototypeOf(modui)),
    modui,
  )
  next.blurs = modui.blurs.filter(cause => !isBlockCause(cause))
  next.filters = modui.filters.filter(cause => !isBlockCause(cause))
  return next
}
