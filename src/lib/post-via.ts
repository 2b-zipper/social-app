const MAX_LENGTH = 64

export function getPostVia(record: unknown): string | undefined {
  if (!record || typeof record !== 'object') return undefined
  const fields = record as Record<string, unknown>

  let via = fields.via
  if (typeof via !== 'string') {
    via = Object.entries(fields).find(
      ([key, value]) => key.endsWith('.via') && typeof value === 'string',
    )?.[1]
  }
  if (typeof via !== 'string') return undefined

  const name = via.replace(/\s+/g, ' ').trim()
  if (!name) return undefined
  return name.length > MAX_LENGTH ? `${name.slice(0, MAX_LENGTH)}…` : name
}
