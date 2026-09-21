export type TimeSpan = {
  start: number
  end: number
}

export function dateToYear(isoDate: string): number {
  const [yearText, monthText, dayText] = isoDate.split('-').map(Number)
  if (!yearText || !monthText || !dayText) {
    throw new Error(`Invalid date: ${isoDate}`)
  }
  const date = Date.UTC(yearText, monthText - 1, dayText)
  const start = Date.UTC(yearText, 0, 1)
  const next = Date.UTC(yearText + 1, 0, 1)
  const fraction = (date - start) / (next - start)
  return yearText + fraction
}

export function yearFromDate(date: Date): number {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return dateToYear(`${date.getFullYear()}-${month}-${day}`)
}

export function timeSpanFromEvents(events: { year: number }[]): TimeSpan {
  if (events.length === 0) {
    return { start: 2000, end: 2026 }
  }
  const years = events.map((event) => event.year)
  const start = Math.min(...years)
  const end = Math.max(...years)
  if (end <= start) {
    return { start, end: start + 1 }
  }
  return { start, end }
}

export function rulerYears(span: TimeSpan): number[] {
  const first = Math.floor(span.start)
  const last = Math.floor(span.end)
  return Array.from({ length: last - first + 1 }, (_, i) => first + i)
}

export type RulerMonthMark = {
  year: number
  month: number
  t: number
}

export function rulerMonthMarks(span: TimeSpan): RulerMonthMark[] {
  const first = Math.floor(span.start)
  const last = Math.floor(span.end)
  const marks: RulerMonthMark[] = []
  for (let year = first; year <= last; year += 1) {
    for (let month = 1; month <= 12; month += 1) {
      marks.push({ year, month, t: year + (month - 1) / 12 })
    }
  }
  return marks
}

export function rulerPosition(year: number, span: TimeSpan): number {
  const first = Math.floor(span.start)
  const last = Math.floor(span.end)
  const range = Math.max(last - first, 1e-6)
  return Math.min(1, Math.max(0, (year - first) / range))
}

export const RULER_YEAR_STEP = 108

export function rulerTrackOffset(year: number, span: TimeSpan, step = RULER_YEAR_STEP) {
  const first = Math.floor(span.start)
  return (year - first) * step
}

export function rulerTrackHeight(span: TimeSpan, step = RULER_YEAR_STEP) {
  const first = Math.floor(span.start)
  const last = Math.floor(span.end)
  return Math.max(last - first + 1, 0) * step
}

export function clampYear(year: number, span: TimeSpan): number {
  return Math.min(span.end, Math.max(span.start, year))
}

export function formatYear(year: number): string {
  return year.toFixed(3)
}

export function formatCoordinateTime(year: number): string {
  const whole = Math.floor(year)
  const fraction = year - whole
  const day = Math.min(365, Math.max(1, Math.round(fraction * 365) + 1))
  const date = new Date(Date.UTC(whole, 0, day))
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${whole}-${month}-${d}`
}
