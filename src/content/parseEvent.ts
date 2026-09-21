import type { ParsedEvent } from '../types'
import { dateToYear } from '../lib/spacetime'

function unquote(value: string): string {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function coerce(value: string): string | number {
  if (value !== '' && Number.isFinite(Number(value))) return Number(value)
  return value
}

function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) {
    return { data: {}, content: raw }
  }

  const data: Record<string, unknown> = {}
  let listKey: string | null = null

  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim()) continue

    const listItem = line.match(/^\s+-\s+(.*)$/)
    if (listItem && listKey) {
      const existing = data[listKey]
      const list = Array.isArray(existing) ? [...existing] : []
      list.push(unquote(listItem[1]))
      data[listKey] = list
      continue
    }

    const pair = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/)
    if (!pair) continue
    const [, key, rest] = pair
    if (rest.trim() === '') {
      listKey = key
      data[key] = []
      continue
    }
    listKey = null
    data[key] = coerce(unquote(rest))
  }

  return { data, content: match[2] }
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) {
    throw new Error(`Expected a number, received ${String(value)}`)
  }
  return n
}

function asStringList(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }
  if (typeof value === 'string') return [value]
  return []
}

export function parseEventMarkdown(filename: string, raw: string): ParsedEvent {
  const { data, content } = parseFrontmatter(raw)
  const id = filename.replace(/\.md$/, '')
  const date = asString(data.t)
  if (!date) {
    throw new Error(`${filename} is missing frontmatter field t`)
  }

  return {
    id,
    title: asString(data.title, id),
    date,
    year: dateToYear(date),
    place: asString(data.place),
    lat: asNumber(data.lat),
    lng: asNumber(data.lng),
    imageNames: asStringList(data.images),
    tags: asStringList(data.tags),
    body: content.trim(),
  }
}
