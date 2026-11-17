import {type DidDocument, getPdsEndpoint} from '@atproto/common-web'
import {type Client} from '@atproto/lex'

import {createServiceClient} from '#/lib/lexClient'
import {logger} from '#/logger'

export async function resolveDidDoc(did: string): Promise<DidDocument | null> {
  try {
    if (did.startsWith('did:plc:')) {
      const res = await fetch(`https://plc.directory/${did}`)
      if (!res.ok) return null
      return (await res.json()) as DidDocument
    }
    if (did.startsWith('did:web:')) {
      const domain = did.slice('did:web:'.length)
      if (domain.includes(':')) return null
      const res = await fetch(
        `https://${decodeURIComponent(domain)}/.well-known/did.json`,
      )
      if (!res.ok) return null
      return (await res.json()) as DidDocument
    }
  } catch (err) {
    logger.warn('resolveDidDoc: failed to resolve DID doc', {safeMessage: err})
  }
  return null
}

export async function getRepoClient(did: string): Promise<Client> {
  const doc = await resolveDidDoc(did)
  const pds = doc ? getPdsEndpoint(doc) : null
  if (!pds) {
    throw new Error(`Could not resolve a PDS for ${did}`)
  }
  return createServiceClient(pds)
}
