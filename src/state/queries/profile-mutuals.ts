import {type AtIdentifierString} from '@atproto/syntax'
import {
  type InfiniteData,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useAppviewClient, useSession} from '#/state/session'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

const useProfileMutualsQuery_root = 'profile-mutuals'
export const RQKEY = (did: string | undefined) =>
  createQueryKey(useProfileMutualsQuery_root, {did})

const FOLLOWS_PAGE_SIZE = 100

const RELATIONSHIPS_CHUNK_SIZE = 30

const MIN_PAGE_RESULTS = 20
const MAX_FOLLOWS_PAGES_PER_PAGE = 5

type Page = {
  profiles: app.bsky.actor.defs.ProfileView[]
  cursor: string | undefined
}

export function useProfileMutualsQuery(did: string | undefined) {
  const client = useAppviewClient()
  const {currentAccount} = useSession()
  const isSelf = !!did && did === currentAccount?.did

  async function filterFollowingBack(
    follows: app.bsky.actor.defs.ProfileView[],
  ) {
    if (isSelf) return follows.filter(profile => profile.viewer?.followedBy)

    const chunks: app.bsky.actor.defs.ProfileView[][] = []
    for (let i = 0; i < follows.length; i += RELATIONSHIPS_CHUNK_SIZE) {
      chunks.push(follows.slice(i, i + RELATIONSHIPS_CHUNK_SIZE))
    }
    const followingBack = new Set<string>()
    await Promise.all(
      chunks.map(async chunk => {
        const data = await client.call(app.bsky.graph.getRelationships, {
          actor: did as AtIdentifierString,
          others: chunk.map(profile => profile.did as AtIdentifierString),
        })
        for (const relationship of data.relationships) {
          if (
            bsky.isType(app.bsky.graph.defs.relationship, relationship) &&
            relationship.followedBy
          ) {
            followingBack.add(relationship.did)
          }
        }
      }),
    )
    return follows.filter(profile => followingBack.has(profile.did))
  }

  return useInfiniteQuery<
    Page,
    Error,
    InfiniteData<Page>,
    QueryKey,
    string | undefined
  >({
    queryKey: RQKEY(did),
    enabled: !!did,
    staleTime: STALE.MINUTES.FIVE,
    initialPageParam: undefined,
    getNextPageParam: page => page.cursor,
    async queryFn({pageParam}) {
      const profiles: app.bsky.actor.defs.ProfileView[] = []
      let cursor = pageParam
      let pages = 0
      do {
        const data = await client.call(app.bsky.graph.getFollows, {
          actor: did as AtIdentifierString,
          limit: FOLLOWS_PAGE_SIZE,
          cursor,
        })
        profiles.push(...(await filterFollowingBack(data.follows)))
        cursor = data.cursor
        pages++
      } while (
        cursor &&
        profiles.length < MIN_PAGE_RESULTS &&
        pages < MAX_FOLLOWS_PAGES_PER_PAGE
      )
      return {profiles, cursor}
    },
  })
}
