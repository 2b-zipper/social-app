import {
  type ModerationCause,
  ModerationDecision,
  type ModerationUI,
} from '@bsky/sdk/moderation'

import * as persisted from '#/state/persisted'
import {type app} from '#/lexicons'

const BYPASSED_BLOCK = '__bypassedBlock'

export function markBypassedBlock<T extends app.bsky.feed.defs.PostView>(
  post: T,
): T {
  return {...post, [BYPASSED_BLOCK]: true}
}

export function isBypassedBlockPost(post: app.bsky.feed.defs.PostView) {
  return BYPASSED_BLOCK in post
}

export function markBypassedBlockFeed(feed: app.bsky.feed.defs.FeedViewPost[]) {
  return feed.map(item => ({...item, post: markBypassedBlock(item.post)}))
}

export function isPostAcrossBlock(post: app.bsky.feed.defs.PostView) {
  return (
    isBypassedBlockPost(post) ||
    !!post.author.viewer?.blocking ||
    !!post.author.viewer?.blockedBy
  )
}

const BLOCK_CAUSES = ['blocking', 'blocked-by', 'block-other']

function isBlockCause(cause: ModerationCause) {
  return BLOCK_CAUSES.includes(cause.type)
}

export type BypassedBlock = 'blocking' | 'blocked-by'

const bypassedBlocks = new WeakMap<ModerationUI, BypassedBlock>()

export function getBypassedBlock(
  modui: ModerationUI | undefined,
): BypassedBlock | undefined {
  return modui ? bypassedBlocks.get(modui) : undefined
}

export function getBypassedBlockCauses(
  decision: ModerationDecision,
): ModerationCause[] {
  if (!persisted.get('bypassBlocks') || decision.isMe) return []
  return decision.causes.filter(
    cause =>
      !cause.downgraded &&
      (cause.type === 'blocking' || cause.type === 'blocked-by'),
  )
}

let isInstalled = false

export function installModerationBlockBypass() {
  if (isInstalled) return
  isInstalled = true

  const originalUi = ModerationDecision.prototype.ui
  ModerationDecision.prototype.ui = function ui(
    this: ModerationDecision,
    context: Parameters<ModerationDecision['ui']>[0],
  ) {
    const modui = originalUi.call(this, context)
    if (!persisted.get('bypassBlocks') || !this.causes.some(isBlockCause)) {
      return modui
    }

    const unblocked: ModerationDecision = Object.create(this)
    unblocked.causes = this.causes.filter(cause => !isBlockCause(cause))
    const bypassed = originalUi.call(unblocked, context)
    bypassed.alerts = modui.alerts
    bypassed.informs = modui.informs

    const causes = getBypassedBlockCauses(this)
    if (causes.some(cause => cause.type === 'blocked-by')) {
      bypassedBlocks.set(bypassed, 'blocked-by')
    } else if (causes.length) {
      bypassedBlocks.set(bypassed, 'blocking')
    }
    return bypassed
  }
}
