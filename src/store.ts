import { useSyncExternalStore } from 'react'
import { EARTH_RADIUS } from './lib/projectors'
import {
  easeFlight,
  firstEventInYear,
  flightDuration,
  indexNearYear,
  neighborIndex,
  type TravelHop,
} from './lib/eventTravel'
import {
  clampYear,
  timeSpanFromEvents,
  yearFromDate,
  type TimeSpan,
} from './lib/spacetime'
import type { LifeEvent } from './types'

export type OrbitState = {
  theta: number
  phi: number
  radius: number
}

export const DEFAULT_RADIUS = 16
const DEFAULT_ORBIT: OrbitState = { theta: 0, phi: 0.18, radius: DEFAULT_RADIUS }
const MIN_RADIUS = 1.45
const MAX_RADIUS = 36

export function globeMarkerScale(radius: number) {
  const scale = (EARTH_RADIUS + radius) / (EARTH_RADIUS + DEFAULT_RADIUS)
  return Math.max(0.36, Math.min(1.12, scale))
}

type ObservatoryState = {
  year: number
  span: TimeSpan
  selectedId: string | null
  hoveredId: string | null
  orbit: OrbitState
  booted: boolean
  activeIndex: number
  travel: TravelHop | null
}

const listeners = new Set<() => void>()

const FALLBACK_SPAN: TimeSpan = { start: 2000, end: 2026 }

let state: ObservatoryState = {
  year: 2016.5,
  span: FALLBACK_SPAN,
  selectedId: null,
  hoveredId: null,
  orbit: { ...DEFAULT_ORBIT },
  booted: false,
  activeIndex: 0,
  travel: null,
}

let timelineReady = false
let lastTravelEmit = 0

function emit() {
  listeners.forEach((listener) => listener())
}

function setState(patch: Partial<ObservatoryState>) {
  state = { ...state, ...patch }
  emit()
}

export function getObservatoryState() {
  return state
}

export function subscribeObservatory(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useObservatory() {
  return useSyncExternalStore(subscribeObservatory, getObservatoryState)
}

export function bootTimeline(events: { year: number }[], now = new Date()) {
  const span = timeSpanFromEvents(events)
  const nowYear = clampYear(yearFromDate(now), span)
  const activeIndex = indexNearYear(events, nowYear)
  const year = events[activeIndex]?.year ?? nowYear
  if (!timelineReady) {
    timelineReady = true
    setState({ span, year, activeIndex, travel: null })
    return
  }
  setState({
    span,
    year: clampYear(state.year, span),
    activeIndex: Math.min(state.activeIndex, Math.max(events.length - 1, 0)),
  })
}

export function setYear(year: number) {
  setState({ year: clampYear(year, state.span) })
}

function startHop(events: LifeEvent[], toIndex: number, selectedId: string | null = null) {
  if (state.travel || events.length === 0) return
  const fromIndex = Math.min(Math.max(state.activeIndex, 0), events.length - 1)
  const dest = Math.min(Math.max(toIndex, 0), events.length - 1)
  if (dest === fromIndex) return
  setState({
    selectedId,
    travel: {
      fromIndex,
      toIndex: dest,
      t: 0,
      duration: flightDuration(events[fromIndex], events[dest]),
    },
    orbit: {
      ...state.orbit,
      theta: DEFAULT_ORBIT.theta,
      phi: DEFAULT_ORBIT.phi,
    },
  })
}

export function stepEvent(events: LifeEvent[], direction: number) {
  startHop(events, neighborIndex(state.activeIndex, direction, events.length))
}

export function stepToYear(events: LifeEvent[], year: number) {
  startHop(events, firstEventInYear(events, year))
}

export function focusEvent(events: LifeEvent[], id: string) {
  const index = events.findIndex((event) => event.id === id)
  if (index < 0 || state.travel) return
  const here = Math.min(Math.max(state.activeIndex, 0), events.length - 1)
  if (index === here) {
    setSelectedId(id)
    return
  }
  startHop(events, index, id)
}

export function tickTravel(delta: number, events: LifeEvent[]) {
  const travel = state.travel
  if (!travel || events.length === 0) return
  const t = Math.min(1, travel.t + delta / Math.max(travel.duration, 0.05))
  const from = events[travel.fromIndex]
  const to = events[travel.toIndex]
  const year = from.year + (to.year - from.year) * easeFlight(t)
  if (t >= 1) {
    setState({
      travel: null,
      activeIndex: travel.toIndex,
      year: to.year,
    })
    return
  }
  state = { ...state, travel: { ...travel, t }, year }
  const now = typeof performance === 'undefined' ? Date.now() : performance.now()
  if (now - lastTravelEmit > 48) {
    lastTravelEmit = now
    emit()
  }
}

export function setSelectedId(id: string | null) {
  setState({ selectedId: id })
}

export function setHoveredId(id: string | null) {
  if (state.hoveredId === id) return
  setState({ hoveredId: id })
}

export function setOrbit(orbit: Partial<OrbitState>) {
  setState({
    orbit: {
      ...state.orbit,
      ...orbit,
      phi: Math.min(1.2, Math.max(0.06, orbit.phi ?? state.orbit.phi)),
      radius: Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, orbit.radius ?? state.orbit.radius)),
    },
  })
}

export function nudgeZoom(factor: number) {
  setOrbit({ radius: state.orbit.radius * factor })
}

export function setBooted() {
  setState({ booted: true })
}
