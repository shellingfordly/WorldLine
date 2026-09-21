export type SegmentRange = {
  current: number
  from: number
  to: number
}

export function focusedSegmentRange(
  events: { year: number }[],
  year: number,
  span = 2,
): SegmentRange {
  const lastIndex = Math.max(events.length - 2, 0)
  if (events.length < 2) {
    return { current: 0, from: 0, to: 0 }
  }

  let current = 0
  if (year >= events[events.length - 1].year) {
    current = lastIndex
  } else {
    for (let i = 0; i < events.length - 1; i += 1) {
      if (year >= events[i].year && year <= events[i + 1].year) {
        current = i
        break
      }
    }
  }

  return {
    current,
    from: Math.max(0, current - span),
    to: Math.min(lastIndex, current + span),
  }
}

export function adjacentHops(activeIndex: number, eventCount: number) {
  return {
    prev: activeIndex > 0 ? activeIndex - 1 : null,
    next: activeIndex < eventCount - 1 ? activeIndex : null,
  }
}

export function outwardPulse(phase: number, width = 0.16, fromStart = true) {
  const p = ((phase % 1) + 1) % 1
  const from = Math.max(0, p - width)
  const to = p
  if (fromStart) return { from, to }
  return { from: 1 - to, to: 1 - from }
}

export function flownPortion(t: number) {
  const head = Math.min(1, Math.max(0, t))
  return { from: 0, to: head }
}

export type GuideSpan = { from: number; to: number }

export function guideCount(arcLength: number, dashSize: number, gapSize: number) {
  const period = dashSize + Math.max(gapSize, 0)
  if (!(arcLength > 0) || !(period > 0)) return 1
  const fitted = Math.round((arcLength * 0.6) / period)
  return Math.max(6, Math.min(28, fitted))
}

export function travelingGuides(
  elapsed: number,
  arcLength: number,
  dashSize: number,
  gapSize: number,
  count: number,
  fromStart = true,
  travelSeconds?: number,
  pauseSeconds = 0.8,
): Array<GuideSpan | null> {
  const hidden = Array.from({ length: Math.max(count, 0) }, () => null)
  if (!(arcLength > 1e-4) || !(dashSize > 0) || count <= 0) return hidden
  const travel = travelSeconds ?? 2.2 + arcLength * 0.35
  const cycle = travel + pauseSeconds
  const local = ((elapsed % cycle) + cycle) % cycle
  if (local >= travel) return hidden

  const period = dashSize + Math.max(gapSize, 0)
  const lead = (local / travel) * (arcLength + Math.max(count - 1, 0) * period)
  return hidden.map((_, index) => {
    const startDist = lead - index * period
    const endDist = startDist + dashSize
    if (startDist < -1e-4 || endDist > arcLength + 1e-4) return null
    const from = fromStart ? startDist / arcLength : (arcLength - endDist) / arcLength
    const to = fromStart ? endDist / arcLength : (arcLength - startDist) / arcLength
    return { from, to }
  })
}
