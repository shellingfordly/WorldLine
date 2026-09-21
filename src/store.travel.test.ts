import { describe, expect, it } from 'vitest'
import type { LifeEvent } from './types'
import { getObservatoryState, bootTimeline, focusEvent, stepEvent, tickTravel } from './store'

function event(id: string, year: number): LifeEvent {
  return {
    id,
    title: id,
    date: `${Math.floor(year)}-01-01`,
    year,
    lat: 0,
    lng: year,
    place: id,
    images: [],
    tags: [],
    body: '',
  }
}

describe('bootTimeline', () => {
  it('starts on the event closest to the given day', () => {
    const events = [event('old', 2008), event('near', 2026.2), event('mid', 2016)]
    bootTimeline(events, new Date(2026, 8, 21))
    expect(getObservatoryState().activeIndex).toBe(1)
    expect(getObservatoryState().year).toBe(2026.2)
  })
})

describe('stepEvent', () => {
  it('ignores a second step while a hop is in flight', () => {
    const events = [
      event('a', 2008),
      event('b', 2012),
      event('c', 2016),
      event('d', 2020),
    ]
    const before = getObservatoryState().activeIndex
    stepEvent(events, 1)
    const first = getObservatoryState().travel
    stepEvent(events, 1)
    const second = getObservatoryState().travel
    expect(first).not.toBeNull()
    expect(second?.toIndex).toBe(first?.toIndex)
    expect(second?.toIndex).toBe(Math.min(before + 1, events.length - 1))
  })
})

describe('focusEvent', () => {
  it('flies to the opened event and keeps the archive open', () => {
    const events = [
      event('a', 2008),
      event('b', 2012),
      event('c', 2016),
      event('d', 2020),
    ]
    tickTravel(30, events)
    const start = getObservatoryState().activeIndex
    const target = start === 0 ? 2 : 0
    focusEvent(events, events[target].id)
    const state = getObservatoryState()
    expect(state.selectedId).toBe(events[target].id)
    expect(state.travel?.toIndex).toBe(target)
  })
})
