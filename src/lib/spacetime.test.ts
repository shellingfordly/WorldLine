import { describe, expect, it } from 'vitest'
import {
  clampYear,
  dateToYear,
  RULER_YEAR_STEP,
  rulerMonthMarks,
  rulerPosition,
  rulerTrackHeight,
  rulerTrackOffset,
  rulerYears,
  timeSpanFromEvents,
  yearFromDate,
} from './spacetime'

describe('time mapping', () => {
  it('turns an ISO date into a fractional year', () => {
    expect(dateToYear('2021-01-01')).toBe(2021)
    expect(dateToYear('2021-07-02')).toBeGreaterThan(2021.4)
    expect(dateToYear('2021-07-02')).toBeLessThan(2021.6)
  })

  it('reads the local calendar day as the current year', () => {
    expect(yearFromDate(new Date(2026, 8, 21))).toBeCloseTo(dateToYear('2026-09-21'), 5)
  })
})

describe('timeSpanFromEvents', () => {
  it('uses the earliest and latest event years', () => {
    expect(
      timeSpanFromEvents([
        { year: 2016.2 },
        { year: 2008.603 },
        { year: 2026.256 },
      ]),
    ).toEqual({ start: 2008.603, end: 2026.256 })
  })

  it('expands a single event into a one-year window', () => {
    expect(timeSpanFromEvents([{ year: 2021.33 }])).toEqual({
      start: 2021.33,
      end: 2022.33,
    })
  })
})

describe('rulerYears', () => {
  it('lists every whole year the span covers', () => {
    expect(rulerYears({ start: 2008.603, end: 2026.256 })).toEqual(
      Array.from({ length: 19 }, (_, i) => 2008 + i),
    )
  })
})

describe('rulerMonthMarks', () => {
  it('places twelve month ticks for every labeled year, including the last', () => {
    const marks = rulerMonthMarks({ start: 2014.1, end: 2016.4 })
    expect(marks).toHaveLength(36)
    expect(marks[0]).toEqual({ year: 2014, month: 1, t: 2014 })
    expect(marks[11]).toEqual({ year: 2014, month: 12, t: 2014 + 11 / 12 })
    expect(marks[12]).toEqual({ year: 2015, month: 1, t: 2015 })
    expect(marks[24]).toEqual({ year: 2016, month: 1, t: 2016 })
    expect(marks[27]).toEqual({ year: 2016, month: 4, t: 2016 + 3 / 12 })
    expect(marks[35]).toEqual({ year: 2016, month: 12, t: 2016 + 11 / 12 })
  })
})

describe('rulerPosition', () => {
  it('maps whole years onto the year-label scale', () => {
    const span = { start: 2008.6, end: 2026.2 }
    expect(rulerPosition(2008, span)).toBe(0)
    expect(rulerPosition(2026, span)).toBe(1)
    expect(rulerPosition(2017, span)).toBeCloseTo(0.5, 5)
  })
})

describe('rulerTrackOffset', () => {
  it('spaces years by the scroll step', () => {
    const span = { start: 2008.6, end: 2026.2 }
    expect(rulerTrackOffset(2008, span)).toBe(0)
    expect(rulerTrackOffset(2009, span)).toBe(RULER_YEAR_STEP)
    expect(rulerTrackOffset(2008.5, span)).toBe(RULER_YEAR_STEP * 0.5)
    expect(rulerTrackHeight(span)).toBe(19 * RULER_YEAR_STEP)
  })
})

describe('clampYear', () => {
  it('stays inside the event span', () => {
    const span = { start: 2008.6, end: 2026.2 }
    expect(clampYear(2000, span)).toBe(2008.6)
    expect(clampYear(2030, span)).toBe(2026.2)
    expect(clampYear(2016, span)).toBe(2016)
  })
})
