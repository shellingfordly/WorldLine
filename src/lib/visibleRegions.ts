import type { Vec3 } from '../types'
import { EARTH_RADIUS, globeSurface } from './projectors'

export type RegionCentroid = {
  lat: number
  lng: number
}

export function visibleSurfaceAngle(orbitRadius: number) {
  const distance = EARTH_RADIUS + orbitRadius
  return Math.acos(Math.min(0.999, EARTH_RADIUS / distance)) + 0.04
}

export function regionInView(
  centroid: RegionCentroid,
  cameraPos: Vec3,
  orbitRadius: number,
) {
  const point = globeSurface(centroid.lat, centroid.lng, 0)
  const cl = Math.hypot(cameraPos.x, cameraPos.y, cameraPos.z) || 1
  const pl = Math.hypot(point.x, point.y, point.z) || 1
  const dot =
    (point.x / pl) * (cameraPos.x / cl) +
    (point.y / pl) * (cameraPos.y / cl) +
    (point.z / pl) * (cameraPos.z / cl)
  return dot >= Math.cos(visibleSurfaceAngle(orbitRadius))
}

export function filterRegionsInView<T extends RegionCentroid>(
  regions: T[],
  cameraPos: Vec3,
  orbitRadius: number,
) {
  return regions.filter((region) => regionInView(region, cameraPos, orbitRadius))
}
