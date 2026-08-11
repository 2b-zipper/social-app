import {
  type AppBskyFeedDefs,
  AppBskyFeedLike,
  type AtpAgent,
} from '@atproto/api'

import {getRepoAgent} from '#/lib/api/repo-agent'
import {logger} from '#/logger'
import * as bsky from '#/types/bsky'
import {type FeedAPI, type FeedAPIResponse} from './types'

export class LikesRecordsFeedAPI implements FeedAPI {
  agent: AtpAgent
  actor: string
  private repoAgent: AtpAgent | null = null

  constructor({
    agent,
    feedParams,
  }: {
    agent: AtpAgent
    feedParams: {actor: string}
  }) {
    this.agent = agent
    this.actor = feedParams.actor
  }

  private async getRepoAgent(): Promise<AtpAgent> {
    if (this.repoAgent) return this.repoAgent
    this.repoAgent = await getRepoAgent(this.actor)
    return this.repoAgent
  }

  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
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
    const repoAgent = await this.getRepoAgent()
    const pageLimit = Math.min(limit, 25)
    const res = await repoAgent.com.atproto.repo.listRecords({
      repo: this.actor,
      collection: 'app.bsky.feed.like',
      limit: pageLimit,
      cursor,
    })

    if (res.data.records.length === 0) {
      return {feed: []}
    }

    const uris: string[] = []
    for (const record of res.data.records) {
      if (
        bsky.dangerousIsType<AppBskyFeedLike.Record>(
          record.value,
          AppBskyFeedLike.isRecord,
        ) &&
        typeof record.value.subject?.uri === 'string'
      ) {
        uris.push(record.value.subject.uri)
      }
    }

    let feed: AppBskyFeedDefs.FeedViewPost[] = []
    if (uris.length > 0) {
      try {
        const postsRes = await this.agent.app.bsky.feed.getPosts({uris})
        const byUri = new Map(postsRes.data.posts.map(p => [p.uri, p]))
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
      cursor: res.data.cursor,
      feed,
    }
  }
}
