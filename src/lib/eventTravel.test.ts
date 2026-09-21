import { describe, expect, it } from 'vitest'
import type { LifeEvent } from '../types'
import { projectGlobe } from './projectors'
import {
  easeFlight,
  firstEventInYear,
  flightDuration,
  indexNearYear,
  neighborIndex,
  observerOnHop,
} from './eventTravel.ts'

function event(id: string, year: number, lat: number, lng: number): LifeEvent {
  return {
    id,
    title: id,
    date: `${Math.floor(year)}-01-01`,
    year,
    place: id,
    lat,
    lng,
    images: [],
    tags: [],
    body: '',
  }
}

const events = [
  event('beijing', 2008.6, 39.9, 116.4),
  event('mexico', 2017.2, 19.4, -99.1),
  event('nyc', 2017.7, 40.7, -74),
  event('qingdao', 2026.2, 36.1, 120.4),
]

describe('neighborIndex', () => {
  it('steps one event and clamps at the ends', () => {
    expect(neighborIndex(1, 1, 4)).toBe(2)
    expect(neighborIndex(1, -1, 4)).toBe(0)
    expect(neighborIndex(0, -1, 4)).toBe(0)
    expect(neighborIndex(3, 1, 4)).toBe(3)
  })
})

describe('indexNearYear', () => {
  it('picks the closest event to a year', () => {
    expect(indexNearYear(events, 2017.3)).toBe(1)
    expect(indexNearYear(events, 2017.6)).toBe(2)
    expect(indexNearYear(events, 2009)).toBe(0)
  })
})

describe('firstEventInYear', () => {
  it('returns the first event whose calendar year matches', () => {
    expect(firstEventInYear(events, 2017)).toBe(1)
    expect(firstEventInYear(events, 2008)).toBe(0)
  })

  it('falls back to the nearest event when a year is empty', () => {
    expect(firstEventInYear(events, 2012)).toBe(0)
  })
})

describe('easeFlight', () => {
  it('starts and ends on the events, with a slower middle', () => {
    expect(easeFlight(0)).toBe(0)
    expect(easeFlight(1)).toBe(1)
    expect(easeFlight(0.5)).toBeCloseTo(0.5, 5)
    expect(easeFlight(0.25)).toBeLessThan(0.25)
    expect(easeFlight(0.75)).toBeGreaterThan(0.75)
  })
})

describe('flightDuration', () => {
  it('takes longer for a transcontinental hop than a nearby hop', () => {
    const shortHop = flightDuration(events[1], events[2])
    const longHop = flightDuration(events[0], events[1])
    expect(shortHop).toBeGreaterThan(0.45)
    expect(longHop).toBeGreaterThan(shortHop)
    expect(longHop).toBeLessThan(2.4)
  })
})

describe('observerOnHop', () => {
  it('sits on the start, then the end', () => {
    const mexico = projectGlobe(events[1])
    const nyc = projectGlobe(events[2])
    const start = observerOnHop(events[1], events[2], 0)
    const end = observerOnHop(events[1], events[2], 1)
    expect(start.position.x).toBeCloseTo(mexico.x, 5)
    expect(start.position.y).toBeCloseTo(mexico.y, 5)
    expect(end.position.x).toBeCloseTo(nyc.x, 5)
    expect(end.position.y).toBeCloseTo(nyc.y, 5)
    expect(Math.hypot(start.heading.x, start.heading.y, start.heading.z)).toBeCloseTo(
      1,
      5,
    )
  })
})
