import {type Client} from '@atproto/lex'

import {PUBLIC_BSKY_SERVICE} from '#/lib/constants'
import {createServiceClient} from '#/lib/lexClient'
import {getErrorName} from '#/lib/xrpc-error'
import * as persisted from '#/state/persisted'

let publicClient: Client | undefined

export function getPublicClient(): Client {
  if (!publicClient) {
    publicClient = createServiceClient(PUBLIC_BSKY_SERVICE)
  }
  return publicClient
}

function isBlockError(err: unknown) {
  const name = getErrorName(err)
  return name === 'BlockedActor' || name === 'BlockedByActor'
}

export async function withBlockBypass<T>(
  authed: () => Promise<T>,
  publicFallback: (client: Client) => Promise<T>,
): Promise<T> {
  try {
    return await authed()
  } catch (err) {
    if (!isBlockError(err) || !persisted.get('bypassBlocks')) throw err
    return await publicFallback(getPublicClient())
  }
}
