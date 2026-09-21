import { describe, expect, it } from 'vitest'
import { focusedSegmentRange, adjacentHops, outwardPulse, flownPortion, travelingGuides, guideCount } from './worldlineFocus.ts'

const events = [2008, 2010, 2012, 2014, 2016, 2018, 2020, 2022].map((year) => ({
  year,
}))

describe('focusedSegmentRange', () => {
  it('keeps the current hop plus two neighbors on each side', () => {
    expect(focusedSegmentRange(events, 2014.5, 2)).toEqual({
      current: 3,
      from: 1,
      to: 5,
    })
  })

  it('clamps to the first hop before the archive starts', () => {
    expect(focusedSegmentRange(events, 2000, 2)).toEqual({
      current: 0,
      from: 0,
      to: 2,
    })
  })

  it('clamps to the last hop after the archive ends', () => {
    expect(focusedSegmentRange(events, 2030, 2)).toEqual({
      current: 6,
      from: 4,
      to: 6,
    })
  })
})

describe('adjacentHops', () => {
  it('only keeps the hops that touch the current event', () => {
    expect(adjacentHops(2, 5)).toEqual({ prev: 1, next: 2 })
    expect(adjacentHops(0, 5)).toEqual({ prev: null, next: 0 })
    expect(adjacentHops(4, 5)).toEqual({ prev: 3, next: null })
  })
})

describe('outwardPulse', () => {
  it('runs from the current event toward the next one', () => {
    const pulse = outwardPulse(0.4, 0.16, true)
    expect(pulse.from).toBeCloseTo(0.24, 5)
    expect(pulse.to).toBeCloseTo(0.4, 5)
  })

  it('runs from the current event back toward the previous one', () => {
    const pulse = outwardPulse(0.4, 0.16, false)
    expect(pulse.from).toBeCloseTo(0.6, 5)
    expect(pulse.to).toBeCloseTo(0.76, 5)
  })
})

describe('travelingGuides', () => {
  const dash = 0.4
  const gap = 0.25
  const count = 3

  it('sends short dashes out from the current event', () => {
    const dashes = travelingGuides(0.4, 4, dash, gap, count, true, 4, 1).filter(
      (span): span is { from: number; to: number } => span !== null,
    )
    expect(dashes.length).toBeGreaterThan(0)
    expect(Math.min(...dashes.map((span) => span.from))).toBeLessThan(0.2)
    for (const span of dashes) {
      expect((span.to - span.from) * 4).toBeLessThanOrEqual(dash + 0.001)
    }
  })

  it('lets those dashes disappear at the far event, then waits', () => {
    const late = travelingGuides(3.6, 4, dash, gap, count, true, 4, 1).filter(
      (span): span is { from: number; to: number } => span !== null,
    )
    expect(late.length).toBeGreaterThan(0)
    expect(Math.min(...late.map((span) => span.from))).toBeGreaterThan(0.5)
    const paused = travelingGuides(4.2, 4, dash, gap, count, true, 4, 1)
    expect(paused.every((span) => span === null)).toBe(true)
  })

  it('keeps every visible dash the same length', () => {
    const arc = 8
    const dashes = travelingGuides(1.6, arc, dash, gap, 6, true, 4, 1).filter(
      (span): span is { from: number; to: number } => span !== null,
    )
    expect(dashes.length).toBeGreaterThan(1)
    for (const span of dashes) {
      expect((span.to - span.from) * arc).toBeCloseTo(dash, 5)
    }
  })

  it('places more dashes on a longer hop', () => {
    expect(guideCount(12, dash, gap)).toBeGreaterThan(guideCount(2, dash, gap))
  })

  it('runs back toward the previous event', () => {
    const dashes = travelingGuides(0.4, 4, dash, gap, count, false, 4, 1).filter(
      (span): span is { from: number; to: number } => span !== null,
    )
    expect(dashes.length).toBeGreaterThan(0)
    expect(Math.max(...dashes.map((span) => span.to))).toBeGreaterThan(0.8)
  })
})

describe('flownPortion', () => {
  it('covers only the part of the hop the plane has already crossed', () => {
    expect(flownPortion(0)).toEqual({ from: 0, to: 0 })
    expect(flownPortion(0.5)).toEqual({ from: 0, to: 0.5 })
    expect(flownPortion(1.4)).toEqual({ from: 0, to: 1 })
  })
})
