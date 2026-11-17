import {
  type InfiniteData,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {
  hydrateProfiles,
  type ProfileListPage,
} from '#/state/queries/profile-blocks'
import {createQueryKey} from '#/state/queries/util'
import {useAppviewClient} from '#/state/session'

const useProfileBlockedByQuery_root = 'profile-blocked-by'
export const RQKEY = (did: string | undefined) =>
  createQueryKey(useProfileBlockedByQuery_root, {did})

const CONSTELLATION_URL = 'https://constellation.microcosm.blue'

const PAGE_SIZE = 100

type BacklinkDidsResponse = {
  linking_dids?: unknown
  cursor?: unknown
}

export function useProfileBlockedByQuery(did: string | undefined) {
  const client = useAppviewClient()

  return useInfiniteQuery<
    ProfileListPage,
    Error,
    InfiniteData<ProfileListPage>,
    QueryKey,
    string | undefined
  >({
    queryKey: RQKEY(did),
    enabled: !!did,
    staleTime: STALE.MINUTES.FIVE,
    initialPageParam: undefined,
    getNextPageParam: page => page.cursor,
    async queryFn({pageParam, signal}) {
      const url = new URL(
        '/xrpc/blue.microcosm.links.getBacklinkDids',
        CONSTELLATION_URL,
      )
      url.searchParams.set('subject', did!)
      url.searchParams.set('source', 'app.bsky.graph.block:subject')
      url.searchParams.set('limit', String(PAGE_SIZE))
      if (pageParam) url.searchParams.set('cursor', pageParam)

      const res = await fetch(url.toString(), {
        headers: {Accept: 'application/json'},
        signal,
      })
      if (!res.ok) {
        throw new Error(`Constellation responded with ${res.status}`)
      }
      const data = (await res.json()) as BacklinkDidsResponse

      const dids = Array.isArray(data.linking_dids)
        ? data.linking_dids.filter(
            (value): value is string =>
              typeof value === 'string' && value.startsWith('did:'),
          )
        : []

      return {
        profiles: await hydrateProfiles(client, dids),
        cursor:
          typeof data.cursor === 'string' && data.cursor
            ? data.cursor
            : undefined,
      }
    },
  })
}
