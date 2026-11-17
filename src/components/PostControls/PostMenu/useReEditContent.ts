import {useCallback} from 'react'

import {IMAGE_SIZE_CONFIG_2K_1MB} from '#/lib/constants'
import {downloadAndResize} from '#/lib/media/manip'
import {logger} from '#/logger'
import {type Shadow} from '#/state/cache/post-shadow'
import {useGetPosts} from '#/state/queries/post'
import {type ComposerOpts} from '#/state/shell/composer'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {type Embed, parseEmbed} from '#/types/bsky/post'

type SourceImage = {fullsize: string; alt: string}

function getSourceImages(embed: Embed): SourceImage[] {
  switch (embed.type) {
    case 'images':
      return embed.view.images.map(image => ({
        fullsize: image.fullsize,
        alt: image.alt,
      }))
    case 'gallery':
      return embed.view.items
        .filter(item => bsky.isType(app.bsky.embed.gallery.viewImage, item))
        .map(item => ({
          fullsize: item.fullsize,
          alt: item.alt,
        }))
    case 'post_with_media':
      return getSourceImages(embed.media)
    default:
      return []
  }
}

function getQuotedUri(embed: Embed): string | undefined {
  if (embed.type === 'post') return embed.view.uri
  if (embed.type === 'post_with_media' && embed.view.type === 'post') {
    return embed.view.view.uri
  }
  return undefined
}

export function hasVideo(post: Shadow<app.bsky.feed.defs.PostView>): boolean {
  const embed = parseEmbed(post.embed)
  return (
    embed.type === 'video' ||
    (embed.type === 'post_with_media' && embed.media.type === 'video')
  )
}

export function useGatherReEditContent() {
  const getPosts = useGetPosts()

  return useCallback(
    async (
      post: Shadow<app.bsky.feed.defs.PostView>,
      record: app.bsky.feed.post.Main,
    ): Promise<ComposerOpts> => {
      const embed = parseEmbed(post.embed)
      const opts: ComposerOpts = {
        text: record.text,
        logContext: 'Other',
      }

      const sourceImages = getSourceImages(embed)
      if (sourceImages.length) {
        const downloaded = await Promise.all(
          sourceImages.map(async image => {
            try {
              const file = await downloadAndResize({
                uri: image.fullsize,
                ...IMAGE_SIZE_CONFIG_2K_1MB,
                timeout: 15e3,
              })
              if (!file) return undefined
              return {
                uri: file.path,
                width: file.width,
                height: file.height,
                altText: image.alt,
              }
            } catch (e) {
              logger.warn('Failed to download an image to re-edit', {
                safeMessage: e,
              })
              return undefined
            }
          }),
        )
        const images = downloaded.filter(image => !!image)
        if (images.length) opts.imageUris = images
      }

      const quotedUri = getQuotedUri(embed)
      const parentUri = record.reply?.parent.uri
      const uris = [quotedUri, parentUri].filter((uri): uri is string => !!uri)

      if (uris.length) {
        try {
          const posts = await getPosts({uris})
          const quoted = posts.find(p => p.uri === quotedUri)
          if (quoted) opts.quote = quoted

          const parent = posts.find(p => p.uri === parentUri)
          if (parent) {
            const parentRecord = parent.record as app.bsky.feed.post.Main
            opts.replyTo = {
              uri: parent.uri,
              cid: parent.cid,
              text: parentRecord.text ?? '',
              langs: parentRecord.langs,
              author: parent.author,
              embed: parent.embed,
            }
          }
        } catch (e) {
          logger.warn('Failed to hydrate reply or quote context to re-edit', {
            safeMessage: e,
          })
        }
      }

      return opts
    },
    [getPosts],
  )
}
