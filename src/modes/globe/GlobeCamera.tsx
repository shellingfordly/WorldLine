import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { LifeEvent } from '../../types'
import {
  EARTH_RADIUS,
  GLOBE_SURFACE_LIFT,
  cameraFollow,
  framingLead,
  projectGlobe,
  slerpOnSphere,
  visibleSurfaceHalfAngle,
} from '../../lib/projectors'
import { observerOnTimeline } from '../../lib/eventTravel'
import { getObservatoryState, globeMarkerScale, tickTravel } from '../../store'

const PLANE_LIFT = 0.13 * 2.65 * 1.04 * 2.04 + 0.11

export function GlobeCamera({ events }: { events: LifeEvent[] }) {
  const { camera, size } = useThree()
  const east = useMemo(() => new THREE.Vector3(), [])
  const radial = useMemo(() => new THREE.Vector3(), [])
  const desiredDir = useMemo(() => new THREE.Vector3(), [])
  const currentDir = useMemo(() => new THREE.Vector3(), [])
  const focus = useMemo(() => new THREE.Vector3(), [])
  const aim = useMemo(() => new THREE.Vector3(), [])
  const look = useMemo(() => new THREE.Vector3(), [])
  const dest = useMemo(() => new THREE.Vector3(), [])
  const qPhi = useMemo(() => new THREE.Quaternion(), [])
  const qTheta = useMemo(() => new THREE.Quaternion(), [])
  const worldUp = useMemo(() => new THREE.Vector3(0, 1, 0), [])
  const fallback = useMemo(() => new THREE.Vector3(1, 0, 0), [])
  const distance = useRef(EARTH_RADIUS + 16)
  const primed = useRef(false)
  const viewShift = useRef(0)

  useFrame((_, delta) => {
    tickTravel(delta, events)
    const observatory = getObservatoryState()
    const sample = observerOnTimeline(
      events,
      observatory.activeIndex,
      observatory.travel,
    )
    focus.set(sample.position.x, sample.position.y, sample.position.z)
    const { theta, phi, radius } = observatory.orbit
    const fov = camera instanceof THREE.PerspectiveCamera ? (camera.fov * Math.PI) / 180 : undefined
    const destEvent = observatory.travel
      ? events[observatory.travel.toIndex]
      : events[Math.min(observatory.activeIndex + 1, events.length - 1)]
    if (destEvent) {
      const destPos = projectGlobe(destEvent)
      dest.set(destPos.x, destPos.y, destPos.z)
      const hop = angleBetween(focus, dest)
      const lead = framingLead(hop, radius, Boolean(observatory.travel), fov)
      if (lead > 1e-4) {
        const peeked = slerpOnSphere(
          { x: focus.x, y: focus.y, z: focus.z },
          { x: dest.x, y: dest.y, z: dest.z },
          lead,
          EARTH_RADIUS + GLOBE_SURFACE_LIFT,
        )
        focus.set(peeked.x, peeked.y, peeked.z)
      }
    }

    radial.copy(focus).normalize()
    aim.copy(focus).addScaledVector(radial, PLANE_LIFT * globeMarkerScale(radius))
    east.crossVectors(worldUp, radial)
    if (east.lengthSq() < 1e-6) east.crossVectors(fallback, radial)
    east.normalize()

    qPhi.setFromAxisAngle(east, phi)
    qTheta.setFromAxisAngle(worldUp, theta)
    desiredDir.copy(radial).applyQuaternion(qPhi).applyQuaternion(qTheta).normalize()

    currentDir.copy(camera.position).normalize()
    const angle = Number.isFinite(currentDir.x)
      ? Math.acos(Math.min(1, Math.max(-1, currentDir.dot(desiredDir))))
      : Math.PI
    const desiredDistance = EARTH_RADIUS + radius
    camera.near = Math.max(0.04, radius * 0.1)
    camera.far = EARTH_RADIUS * 4 + radius * 5
    const panel = observatory.selectedId
      ? document.querySelector('.archive__panel')
      : null
    const targetShift = panel ? panel.getBoundingClientRect().width / 2 : 0
    const glide = 1 - Math.exp(-delta * 5.2)
    viewShift.current += (targetShift - viewShift.current) * glide
    if (camera instanceof THREE.PerspectiveCamera) {
      if (viewShift.current > 0.5) {
        camera.setViewOffset(
          size.width,
          size.height,
          viewShift.current,
          0,
          size.width,
          size.height,
        )
      } else if (camera.view?.enabled) {
        camera.clearViewOffset()
      }
    }
    camera.updateProjectionMatrix()

    const broken = !Number.isFinite(camera.position.x) || !Number.isFinite(look.x)
    const snap = !primed.current || broken || angle > 2.05
    if (snap) {
      camera.position.copy(desiredDir).multiplyScalar(desiredDistance)
      look.copy(aim)
      distance.current = desiredDistance
      primed.current = true
    } else {
      const halfView = visibleSurfaceHalfAngle(radius, fov)
      const follow = cameraFollow(halfView, Boolean(observatory.travel), angle)
      const smoothing = 1 - Math.exp(-delta * follow)
      const next = slerpOnSphere(
        { x: currentDir.x, y: currentDir.y, z: currentDir.z },
        { x: desiredDir.x, y: desiredDir.y, z: desiredDir.z },
        smoothing,
        1,
      )
      currentDir.set(next.x, next.y, next.z)
      distance.current += (desiredDistance - distance.current) * smoothing
      camera.position.copy(currentDir).multiplyScalar(distance.current)
      const lookNext = slerpOnSphere(
        { x: look.x, y: look.y, z: look.z },
        { x: aim.x, y: aim.y, z: aim.z },
        smoothing,
        aim.length(),
      )
      look.set(lookNext.x, lookNext.y, lookNext.z)
    }

    camera.up.copy(worldUp)
    camera.lookAt(look)
    camera.updateMatrixWorld()
  }, -1)

  return null
}

function angleBetween(a: THREE.Vector3, b: THREE.Vector3) {
  const al = a.length() || 1
  const bl = b.length() || 1
  return Math.acos(Math.min(1, Math.max(-1, a.dot(b) / (al * bl))))
}
