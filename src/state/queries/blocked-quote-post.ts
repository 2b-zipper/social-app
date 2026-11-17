import {type AtUriString} from '@atproto/syntax'
import {useQuery} from '@tanstack/react-query'

import {getPublicClient} from '#/lib/api/public-agent'
import {markBypassedBlock} from '#/lib/moderation/bypassBlocks'
import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {app} from '#/lexicons'

const useBlockedQuotePostQuery_root = 'blocked-quote-post'

export function useBlockedQuotePostQuery({
  uri,
  enabled = true,
}: {
  uri: string
  enabled?: boolean
}) {
  return useQuery({
    enabled,
    staleTime: STALE.MINUTES.FIVE,
    queryKey: createQueryKey(useBlockedQuotePostQuery_root, {uri}),
    async queryFn() {
      const data = await getPublicClient().call(app.bsky.feed.getPosts, {
        uris: [uri as AtUriString],
      })
      const post = data.posts[0]
      return post ? markBypassedBlock(post) : null
    },
  })
}
