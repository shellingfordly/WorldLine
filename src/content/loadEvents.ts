import type { LifeEvent } from '../types'
import { parseEventMarkdown } from './parseEvent'

const markdownFiles = import.meta.glob('../../content/events/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

const imageFiles = import.meta.glob('../../content/images/*', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

function fileName(path: string): string {
  return path.split('/').pop() ?? path
}

const imageByName = Object.fromEntries(
  Object.entries(imageFiles).map(([path, url]) => [fileName(path), url]),
)

export function loadEvents(): LifeEvent[] {
  return Object.entries(markdownFiles)
    .map(([path, raw]) => {
      const parsed = parseEventMarkdown(fileName(path), raw)
      return {
        id: parsed.id,
        title: parsed.title,
        date: parsed.date,
        year: parsed.year,
        place: parsed.place,
        lat: parsed.lat,
        lng: parsed.lng,
        images: parsed.imageNames.map((name) => imageByName[name]).filter(Boolean),
        tags: parsed.tags,
        body: parsed.body,
      } satisfies LifeEvent
    })
    .sort((a, b) => a.year - b.year)
}

export const events = loadEvents()
