import { describe, expect, it } from 'vitest'
import { parseEventMarkdown } from './parseEvent'

describe('parseEventMarkdown', () => {
  it('reads frontmatter and body from a single event file', () => {
    const event = parseEventMarkdown(
      'forbidden-city.md',
      `---
title: 在故宫看见午门的光
t: 2021-05-01
place: 北京 · 故宫
lat: 39.916
lng: 116.397
images:
  - palace.svg
tags:
  - 旅行
---

午门的砖是暖的。
`,
    )

    expect(event.id).toBe('forbidden-city')
    expect(event.title).toBe('在故宫看见午门的光')
    expect(event.place).toBe('北京 · 故宫')
    expect(event.lat).toBeCloseTo(39.916)
    expect(event.imageNames).toEqual(['palace.svg'])
    expect(event.tags).toEqual(['旅行'])
    expect(event.body).toContain('午门')
    expect(event.year).toBeGreaterThan(2021.3)
    expect(event.year).toBeLessThan(2021.4)
  })
})
