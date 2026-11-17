import {getPdsEndpoint} from '@atproto/common-web'
import {useQuery} from '@tanstack/react-query'

import {resolveDidDoc} from '#/lib/api/repo-agent'
import {createServiceClient} from '#/lib/lexClient'
import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {com} from '#/lexicons'

const useAccountDetailsQuery_root = 'account-details'
export const RQKEY = (did: string | undefined) =>
  createQueryKey(useAccountDetailsQuery_root, {did})

type AccountDetails = {
  pds: string | null
  firstPostUri: string | null
}

export function useAccountDetailsQuery(did: string | undefined) {
  return useQuery<AccountDetails>({
    queryKey: RQKEY(did),
    enabled: !!did,
    staleTime: STALE.HOURS.ONE,
    async queryFn() {
      const doc = await resolveDidDoc(did!)
      const pds = doc ? (getPdsEndpoint(doc) ?? null) : null
      if (!pds) return {pds: null, firstPostUri: null}

      const data = await createServiceClient(pds).call(
        com.atproto.repo.listRecords,
        {
          repo: did!,
          collection: 'app.bsky.feed.post',
          limit: 1,
          reverse: true,
        } as com.atproto.repo.listRecords.$Params,
      )

      return {pds, firstPostUri: data.records[0]?.uri ?? null}
    },
  })
}
