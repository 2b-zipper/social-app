import {AtpAgent} from '@atproto/api'

import {PUBLIC_BSKY_SERVICE} from '#/lib/constants'
import * as persisted from '#/state/persisted'

let publicAgent: AtpAgent | undefined

export function getPublicAgent(): AtpAgent {
  if (!publicAgent) {
    publicAgent = new AtpAgent({service: PUBLIC_BSKY_SERVICE})
  }
  return publicAgent
}

function isBlockError(err: unknown) {
  const name = (err as {error?: string})?.error
  return name === 'BlockedActor' || name === 'BlockedByActor'
}

export async function withBlockBypass<T>(
  authed: () => Promise<T>,
  publicFallback: (agent: AtpAgent) => Promise<T>,
): Promise<T> {
  try {
    return await authed()
  } catch (err) {
    if (!isBlockError(err) || !persisted.get('bypassBlocks')) throw err
    return await publicFallback(getPublicAgent())
  }
}
