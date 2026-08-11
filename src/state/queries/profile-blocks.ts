import {type AppBskyActorDefs, AppBskyGraphBlock} from '@atproto/api'
import {
  type InfiniteData,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {getRepoAgent} from '#/lib/api/repo-agent'
import {logger} from '#/logger'
import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useAgent} from '#/state/session'
import * as bsky from '#/types/bsky'

const useProfileBlocksQuery_root = 'profile-blocks'
export const RQKEY = (did: string | undefined) =>
  createQueryKey(useProfileBlocksQuery_root, {did})

const PAGE_SIZE = 50

const HYDRATE_CHUNK_SIZE = 25

type Page = {
  profiles: AppBskyActorDefs.ProfileViewDetailed[]
  cursor: string | undefined
}

export function useProfileBlocksQuery(did: string | undefined) {
  const agent = useAgent()

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
      const repoAgent = await getRepoAgent(did!)
      const res = await repoAgent.com.atproto.repo.listRecords({
        repo: did!,
        collection: 'app.bsky.graph.block',
        limit: PAGE_SIZE,
        cursor: pageParam,
      })

      const subjects: string[] = []
      for (const record of res.data.records) {
        if (
          bsky.dangerousIsType<AppBskyGraphBlock.Record>(
            record.value,
            AppBskyGraphBlock.isRecord,
          ) &&
          typeof record.value.subject === 'string'
        ) {
          subjects.push(record.value.subject)
        }
      }

      const chunks: string[][] = []
      for (let i = 0; i < subjects.length; i += HYDRATE_CHUNK_SIZE) {
        chunks.push(subjects.slice(i, i + HYDRATE_CHUNK_SIZE))
      }

      const byDid = new Map<string, AppBskyActorDefs.ProfileViewDetailed>()
      await Promise.all(
        chunks.map(async actors => {
          try {
            const profilesRes = await agent.app.bsky.actor.getProfiles({actors})
            for (const profile of profilesRes.data.profiles) {
              byDid.set(profile.did, profile)
            }
          } catch (err) {
            logger.warn('useProfileBlocksQuery: failed to hydrate profiles', {
              safeMessage: err,
            })
          }
        }),
      )

      return {
        profiles: subjects
          .map(subject => byDid.get(subject))
          .filter(profile => !!profile),
        cursor: res.data.cursor,
      }
    },
  })
}
