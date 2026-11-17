import {type Client} from '@atproto/lex'
import {type AtUriString} from '@atproto/syntax'

import {getRepoClient} from '#/lib/api/repo-agent'
import {logger} from '#/logger'
import {app, com} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {type FeedAPI, type FeedAPIResponse} from './types'

export class LikesRecordsFeedAPI implements FeedAPI {
  client: Client
  actor: string
  private repoClient: Client | null = null

  constructor({
    client,
    feedParams,
  }: {
    client: Client
    feedParams: {actor: string}
  }) {
    this.client = client
    this.actor = feedParams.actor
  }

  private async getRepoClient(): Promise<Client> {
    if (this.repoClient) return this.repoClient
    this.repoClient = await getRepoClient(this.actor)
    return this.repoClient
  }

  async peekLatest(): Promise<app.bsky.feed.defs.FeedViewPost> {
    const res = await this.fetch({cursor: undefined, limit: 1})
    return res.feed[0]
  }

  async fetch({
    cursor,
    limit,
  }: {
    cursor: string | undefined
    limit: number
  }): Promise<FeedAPIResponse> {
    const repoClient = await this.getRepoClient()
    const pageLimit = Math.min(limit, 25)
    const data = await repoClient.call(com.atproto.repo.listRecords, {
      repo: this.actor,
      collection: 'app.bsky.feed.like',
      limit: pageLimit,
      cursor,
    } as com.atproto.repo.listRecords.$Params)

    if (data.records.length === 0) {
      return {feed: []}
    }

    const uris: AtUriString[] = []
    for (const record of data.records) {
      if (
        bsky.isType(app.bsky.feed.like, record.value) &&
        typeof record.value.subject?.uri === 'string'
      ) {
        uris.push(record.value.subject.uri)
      }
    }

    let feed: app.bsky.feed.defs.FeedViewPost[] = []
    if (uris.length > 0) {
      try {
        const postsData = await this.client.call(app.bsky.feed.getPosts, {
          uris,
        })
        const byUri = new Map(postsData.posts.map(p => [p.uri, p]))
        feed = uris
          .map(uri => byUri.get(uri))
          .filter(post => !!post)
          .map(post => ({post}))
      } catch (err) {
        logger.warn('LikesRecordsFeedAPI: failed to hydrate liked posts', {
          safeMessage: err,
        })
      }
    }

    return {
      cursor: data.cursor,
      feed,
    }
  }
}
