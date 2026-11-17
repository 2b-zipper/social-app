import {type Client} from '@atproto/lex'
import {type AtIdentifierString} from '@atproto/syntax'
import {
  type InfiniteData,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {getRepoClient} from '#/lib/api/repo-agent'
import {logger} from '#/logger'
import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useAppviewClient} from '#/state/session'
import {app, com} from '#/lexicons'
import * as bsky from '#/types/bsky'

const useProfileBlocksQuery_root = 'profile-blocks'
export const RQKEY = (did: string | undefined) =>
  createQueryKey(useProfileBlocksQuery_root, {did})

const PAGE_SIZE = 50

const HYDRATE_CHUNK_SIZE = 25

export type ProfileListPage = {
  profiles: app.bsky.actor.defs.ProfileViewDetailed[]
  cursor: string | undefined
}

export async function hydrateProfiles(client: Client, dids: string[]) {
  const chunks: string[][] = []
  for (let i = 0; i < dids.length; i += HYDRATE_CHUNK_SIZE) {
    chunks.push(dids.slice(i, i + HYDRATE_CHUNK_SIZE))
  }

  const byDid = new Map<string, app.bsky.actor.defs.ProfileViewDetailed>()
  await Promise.all(
    chunks.map(async actors => {
      try {
        const data = await client.call(app.bsky.actor.getProfiles, {
          actors: actors as AtIdentifierString[],
        })
        for (const profile of data.profiles) {
          byDid.set(profile.did, profile)
        }
      } catch (err) {
        logger.warn('hydrateProfiles: failed to hydrate profiles', {
          safeMessage: err,
        })
      }
    }),
  )

  return dids.map(did => byDid.get(did)).filter(profile => !!profile)
}

export function useProfileBlocksQuery(did: string | undefined) {
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
    async queryFn({pageParam}) {
      const repoClient = await getRepoClient(did!)
      const data = await repoClient.call(com.atproto.repo.listRecords, {
        repo: did!,
        collection: 'app.bsky.graph.block',
        limit: PAGE_SIZE,
        cursor: pageParam,
      } as com.atproto.repo.listRecords.$Params)

      const subjects: string[] = []
      for (const record of data.records) {
        if (
          bsky.isType(app.bsky.graph.block, record.value) &&
          typeof record.value.subject === 'string'
        ) {
          subjects.push(record.value.subject)
        }
      }

      return {
        profiles: await hydrateProfiles(client, subjects),
        cursor: data.cursor,
      }
    },
  })
}
