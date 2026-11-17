import {type Client} from '@atproto/lex'
import {
  type InfiniteData,
  keepPreviousData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {getPublicClient} from '#/lib/api/public-agent'
import {logger} from '#/logger'
import {STALE} from '#/state/queries'
import {hydrateProfiles} from '#/state/queries/profile-blocks'
import {useAppviewClient} from '#/state/session'
import {app} from '#/lexicons'

export const RQKEY_ROOT = 'actor-search'
export const RQKEY = (
  query: string,
  limit?: number,
  includeBlocked?: boolean,
) => [RQKEY_ROOT, query, limit, includeBlocked]

type SearchParams = {q: string; limit: number; cursor: string | undefined}

async function searchIncludingBlocked(client: Client, params: SearchParams) {
  const data = await getPublicClient().call(app.bsky.actor.searchActors, params)
  const profiles = await hydrateProfiles(
    client,
    data.actors.map(actor => actor.did),
  )
  const viewers = new Map(profiles.map(profile => [profile.did, profile]))
  return {
    ...data,
    actors: data.actors.map(actor => ({
      ...actor,
      viewer: viewers.get(actor.did)?.viewer,
    })),
  }
}

export function useActorSearch({
  query,
  enabled,
  maintainData,
  limit = 25,
  includeBlocked = false,
}: {
  query: string
  enabled?: boolean
  maintainData?: boolean
  limit?: number
  includeBlocked?: boolean
}) {
  const client = useAppviewClient()
  return useInfiniteQuery<
    app.bsky.actor.searchActors.$OutputBody,
    Error,
    InfiniteData<app.bsky.actor.searchActors.$OutputBody>,
    QueryKey,
    string | undefined
  >({
    staleTime: STALE.MINUTES.FIVE,
    queryKey: RQKEY(query, limit, includeBlocked),
    queryFn: async ({pageParam}) => {
      const params = {q: query, limit, cursor: pageParam}
      if (includeBlocked) {
        try {
          return await searchIncludingBlocked(client, params)
        } catch (err) {
          logger.warn('useActorSearch: logged-out search failed', {
            safeMessage: err,
          })
        }
      }
      return await client.call(app.bsky.actor.searchActors, params)
    },
    enabled: enabled && !!query,
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    placeholderData: maintainData ? keepPreviousData : undefined,
    select,
  })
}

function select(data: InfiniteData<app.bsky.actor.searchActors.$OutputBody>) {
  // enforce uniqueness
  const dids = new Set()

  return {
    ...data,
    pages: data.pages.map(page => ({
      actors: page.actors.filter(actor => {
        if (dids.has(actor.did)) {
          return false
        }
        dids.add(actor.did)
        return true
      }),
    })),
  }
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
) {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<app.bsky.actor.searchActors.$OutputBody>
  >({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData) {
      continue
    }
    for (const actor of queryData.pages.flatMap(page => page.actors)) {
      if (actor.did === did) {
        yield actor
      }
    }
  }
}
