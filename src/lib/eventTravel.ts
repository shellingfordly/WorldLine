import type { LifeEvent, Vec3 } from '../types'
import {
  EARTH_RADIUS,
  GLOBE_SURFACE_LIFT,
  projectGlobe,
  slerpOnSphere,
  type GeoSample,
} from './projectors'

export type TravelHop = {
  fromIndex: number
  toIndex: number
  t: number
  duration: number
}

export function easeFlight(t: number) {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}

export function neighborIndex(index: number, direction: number, length: number) {
  if (length <= 0) return 0
  const step = direction < 0 ? -1 : 1
  return Math.min(length - 1, Math.max(0, index + step))
}

export function indexNearYear(events: { year: number }[], year: number) {
  if (events.length === 0) return 0
  let best = 0
  let dist = Infinity
  for (let i = 0; i < events.length; i += 1) {
    const d = Math.abs(events[i].year - year)
    if (d < dist) {
      dist = d
      best = i
    }
  }
  return best
}

export function firstEventInYear(events: { year: number }[], year: number) {
  const calendar = Math.floor(year)
  const hit = events.findIndex((event) => Math.floor(event.year) === calendar)
  if (hit >= 0) return hit
  return indexNearYear(events, calendar + 0.5)
}

export function flightDuration(from: GeoSample, to: GeoSample) {
  const a = projectGlobe(from)
  const b = projectGlobe(to)
  const al = Math.hypot(a.x, a.y, a.z) || 1
  const bl = Math.hypot(b.x, b.y, b.z) || 1
  const dot = Math.min(
    1,
    Math.max(-1, (a.x * b.x + a.y * b.y + a.z * b.z) / (al * bl)),
  )
  return 0.55 + Math.acos(dot) * 0.42
}

function tangentToward(from: Vec3, to: Vec3): Vec3 {
  const fl = Math.hypot(from.x, from.y, from.z) || 1
  const rx = from.x / fl
  const ry = from.y / fl
  const rz = from.z / fl
  const dx = to.x - from.x
  const dy = to.y - from.y
  const dz = to.z - from.z
  const along = dx * rx + dy * ry + dz * rz
  const tx = dx - rx * along
  const ty = dy - ry * along
  const tz = dz - rz * along
  const len = Math.hypot(tx, ty, tz)
  if (len < 1e-6) return { x: -rz, y: 0, z: rx }
  return { x: tx / len, y: ty / len, z: tz / len }
}

export function observerOnHop(from: GeoSample, to: GeoSample, t: number) {
  const a = projectGlobe(from)
  const b = projectGlobe(to)
  const position = slerpOnSphere(
    a,
    b,
    easeFlight(t),
    EARTH_RADIUS + GLOBE_SURFACE_LIFT,
  )
  return { position, heading: tangentToward(position, b) }
}

export function observerOnTimeline(
  events: LifeEvent[],
  activeIndex: number,
  travel: TravelHop | null,
) {
  if (events.length === 0) {
    return observerOnHop({ lat: 0, lng: 0 }, { lat: 0, lng: 8 }, 0)
  }
  if (travel) {
    return observerOnHop(
      events[travel.fromIndex],
      events[travel.toIndex],
      travel.t,
    )
  }
  const here = events[Math.min(Math.max(activeIndex, 0), events.length - 1)]
  const toward =
    activeIndex < events.length - 1
      ? events[activeIndex + 1]
      : events[Math.max(activeIndex - 1, 0)]
  return observerOnHop(here, toward, 0)
}
