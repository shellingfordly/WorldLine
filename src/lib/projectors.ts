import type { LifeEvent, Vec3 } from '../types'

export type GeoSample = {
  lat: number
  lng: number
  year?: number
}

export const EARTH_RADIUS = 7.4
export const GLOBE_SURFACE_LIFT = 0.16

export function projectGlobe(sample: GeoSample): Vec3 {
  return globeSurface(sample.lat, sample.lng, GLOBE_SURFACE_LIFT)
}

export function globeSurface(lat: number, lng: number, lift = 0.05): Vec3 {
  const phi = ((90 - lat) * Math.PI) / 180
  const theta = (lng * Math.PI) / 180
  const radius = EARTH_RADIUS + lift
  return {
    x: radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  }
}

function orthoUnit(x: number, y: number, z: number): Vec3 {
  if (Math.abs(y) < 0.9) {
    const cx = z
    const cz = -x
    const len = Math.hypot(cx, cz) || 1
    return { x: cx / len, y: 0, z: cz / len }
  }
  const cy = -z
  const cz = y
  const len = Math.hypot(cy, cz) || 1
  return { x: 0, y: cy / len, z: cz / len }
}

function rotateAround(axis: Vec3, x: number, y: number, z: number, angle: number): Vec3 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const ix = axis.y * z - axis.z * y
  const iy = axis.z * x - axis.x * z
  const iz = axis.x * y - axis.y * x
  return {
    x: x * c + ix * s,
    y: y * c + iy * s,
    z: z * c + iz * s,
  }
}

export function slerpOnSphere(a: Vec3, b: Vec3, t: number, radius: number): Vec3 {
  const al = Math.hypot(a.x, a.y, a.z) || 1
  const bl = Math.hypot(b.x, b.y, b.z) || 1
  const ua = a.x / al
  const va = a.y / al
  const wa = a.z / al
  const ub = b.x / bl
  const vb = b.y / bl
  const wb = b.z / bl
  let dot = ua * ub + va * vb + wa * wb
  dot = Math.min(1, Math.max(-1, dot))

  if (dot > 0.9995) {
    const x = ua + (ub - ua) * t
    const y = va + (vb - va) * t
    const z = wa + (wb - wa) * t
    const len = Math.hypot(x, y, z) || 1
    return { x: (x / len) * radius, y: (y / len) * radius, z: (z / len) * radius }
  }

  if (dot < -0.9995) {
    const axis = orthoUnit(ua, va, wa)
    const rotated = rotateAround(axis, ua, va, wa, Math.PI * t)
    const len = Math.hypot(rotated.x, rotated.y, rotated.z) || 1
    return {
      x: (rotated.x / len) * radius,
      y: (rotated.y / len) * radius,
      z: (rotated.z / len) * radius,
    }
  }

  const theta = Math.acos(dot)
  const sinT = Math.sin(theta)
  const w1 = Math.sin((1 - t) * theta) / sinT
  const w2 = Math.sin(t * theta) / sinT
  return {
    x: (ua * w1 + ub * w2) * radius,
    y: (va * w1 + vb * w2) * radius,
    z: (wa * w1 + wb * w2) * radius,
  }
}

export function sampleGlobeAlong(events: LifeEvent[], year: number): Vec3 {
  const radius = EARTH_RADIUS + GLOBE_SURFACE_LIFT
  if (events.length === 0) {
    return projectGlobe({ lat: 0, lng: 0, year })
  }

  const first = events[0]
  if (year <= first.year) return projectGlobe({ ...first, year })

  const last = events[events.length - 1]
  if (year >= last.year) return projectGlobe({ ...last, year })

  for (let i = 0; i < events.length - 1; i += 1) {
    const a = events[i]
    const b = events[i + 1]
    if (year >= a.year && year <= b.year) {
      const t = (year - a.year) / Math.max(b.year - a.year, 1e-6)
      return slerpOnSphere(projectGlobe(a), projectGlobe(b), t, radius)
    }
  }

  return projectGlobe({ ...last, year })
}

function nextEventOnWorldline(events: LifeEvent[], year: number): LifeEvent | null {
  if (events.length === 0) return null
  if (year < events[0].year) return events[0]
  for (let i = 0; i < events.length - 1; i += 1) {
    if (year >= events[i].year && year <= events[i + 1].year) {
      return events[i + 1]
    }
  }
  return null
}

export function framedWorldlineLook(events: LifeEvent[], year: number): Vec3 {
  const here = sampleGlobeAlong(events, year)
  const dest = nextEventOnWorldline(events, year)
  if (!dest) return here

  const destV = projectGlobe(dest)
  const hl = Math.hypot(here.x, here.y, here.z) || 1
  const dl = Math.hypot(destV.x, destV.y, destV.z) || 1
  const dot = Math.min(
    1,
    Math.max(-1, (here.x * destV.x + here.y * destV.y + here.z * destV.z) / (hl * dl)),
  )
  const angle = Math.acos(dot)
  if (angle > 1.05) return here

  const peek = angle < 0.55 ? 0.46 : 0.32
  return slerpOnSphere(here, destV, peek, EARTH_RADIUS + GLOBE_SURFACE_LIFT)
}

export function upcomingWorldlineFocus(
  events: LifeEvent[],
  year: number,
  peek = 0.28,
): Vec3 {
  const here = sampleGlobeAlong(events, year)
  if (events.length < 2) return here

  const last = events[events.length - 1]
  if (year >= last.year) return here

  let dest = last
  let startYear = events[0].year
  for (let i = 0; i < events.length - 1; i += 1) {
    if (year >= events[i].year && year <= events[i + 1].year) {
      dest = events[i + 1]
      startYear = events[i].year
      break
    }
    if (year < events[0].year) {
      dest = events[1]
      startYear = events[0].year
      break
    }
  }

  const span = Math.max(dest.year - startYear, 1e-6)
  const t = Math.min(1, Math.max(0, (year - startYear) / span))
  const ahead = peek * (1 - t)
  const radius = EARTH_RADIUS + GLOBE_SURFACE_LIFT
  return slerpOnSphere(here, projectGlobe(dest), ahead, radius)
}

const GLOBE_FOV = (42 * Math.PI) / 180

export function visibleSurfaceHalfAngle(orbitRadius: number, fovRad = GLOBE_FOV) {
  const clearance = Math.max(orbitRadius - GLOBE_SURFACE_LIFT, 0.2)
  const shell = EARTH_RADIUS + GLOBE_SURFACE_LIFT
  return Math.atan(Math.tan(fovRad / 2) * (clearance / shell))
}

export function framingLead(
  hopAngle: number,
  orbitRadius: number,
  traveling: boolean,
  fovRad = GLOBE_FOV,
) {
  if (!(hopAngle > 1e-4)) return 0
  const halfView = visibleSurfaceHalfAngle(orbitRadius, fovRad)
  const desired = traveling ? 0.32 : 0.16
  const budget = halfView * (traveling ? 0.14 : 0.06)
  return Math.min(desired, budget / hopAngle)
}

export function cameraFollow(halfView: number, traveling: boolean, turnAngle: number) {
  const base = traveling ? 7.4 + turnAngle * 6.2 : 5.4 + turnAngle * 7.2
  const zoom = Math.max(0.7 / Math.max(halfView, 0.04), 1)
  return base * zoom ** (traveling ? 1.35 : 1.05)
}
