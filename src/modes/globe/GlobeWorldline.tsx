import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Line2, LineGeometry, LineMaterial } from 'three-stdlib'
import type { LifeEvent } from '../../types'
import {
  EARTH_RADIUS,
  GLOBE_SURFACE_LIFT,
  projectGlobe,
  slerpOnSphere,
} from '../../lib/projectors'
import { easeFlight, observerOnTimeline } from '../../lib/eventTravel'
import { globeMarkerScale, getObservatoryState, useObservatory } from '../../store'
import { adjacentHops, flownPortion, guideCount, travelingGuides } from './worldlineFocus'

function arcAngle(a: THREE.Vector3, b: THREE.Vector3) {
  const dot = a.clone().normalize().dot(b.clone().normalize())
  return Math.acos(Math.min(1, Math.max(-1, dot)))
}

function sampleArc(a: LifeEvent, b: LifeEvent, radius: number) {
  const start = projectGlobe(a)
  const end = projectGlobe(b)
  const from = new THREE.Vector3(start.x, start.y, start.z)
  const to = new THREE.Vector3(end.x, end.y, end.z)
  const steps = Math.max(48, Math.ceil(arcAngle(from, to) / 0.008))
  const points: THREE.Vector3[] = []
  for (let step = 0; step <= steps; step += 1) {
    const p = slerpOnSphere(start, end, step / steps, radius)
    points.push(new THREE.Vector3(p.x, p.y, p.z))
  }
  return points
}

function createAirplaneShape() {
  const s = new THREE.Shape()
  const fw = 0.11
  const nose = 0.48
  const tail = -0.46

  s.moveTo(0, nose)
  s.bezierCurveTo(fw * 0.85, nose, fw, nose - 0.08, fw, nose - 0.16)
  s.lineTo(fw, 0.16)

  s.lineTo(0.5, -0.02)
  s.bezierCurveTo(0.6, -0.06, 0.6, -0.18, 0.5, -0.22)
  s.lineTo(fw, -0.04)

  s.lineTo(fw, -0.28)

  s.lineTo(0.24, -0.4)
  s.bezierCurveTo(0.3, -0.44, 0.28, -0.52, 0.2, -0.52)
  s.lineTo(fw * 0.75, -0.42)

  s.bezierCurveTo(fw * 0.55, tail, fw * 0.28, tail - 0.015, 0, tail)

  s.bezierCurveTo(-fw * 0.28, tail - 0.015, -fw * 0.55, tail, -fw * 0.75, -0.42)
  s.lineTo(-0.2, -0.52)
  s.bezierCurveTo(-0.28, -0.52, -0.3, -0.44, -0.24, -0.4)
  s.lineTo(-fw, -0.28)

  s.lineTo(-fw, -0.04)
  s.lineTo(-0.5, -0.22)
  s.bezierCurveTo(-0.6, -0.18, -0.6, -0.06, -0.5, -0.02)
  s.lineTo(-fw, 0.16)

  s.lineTo(-fw, nose - 0.16)
  s.bezierCurveTo(-fw, nose - 0.08, -fw * 0.85, nose, 0, nose)
  return s
}

function ChubbyAirplane() {
  const body = '#f6ebc0'
  const geometry = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(createAirplaneShape(), {
      depth: 0.2,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.03,
      bevelSegments: 3,
      curveSegments: 8,
    })
    geo.rotateX(Math.PI / 2)
    geo.translate(0, 0.1, 0)
    geo.computeVertexNormals()
    return geo
  }, [])

  return (
    <mesh geometry={geometry} scale={0.95} raycast={() => null}>
      <meshBasicMaterial color={body} />
    </mesh>
  )
}

function AirplaneCursor({ events }: { events: LifeEvent[] }) {
  const group = useRef<THREE.Group>(null)
  const right = useMemo(() => new THREE.Vector3(), [])
  const up = useMemo(() => new THREE.Vector3(), [])
  const forward = useMemo(() => new THREE.Vector3(), [])
  const matrix = useMemo(() => new THREE.Matrix4(), [])
  const { orbit } = useObservatory()
  const zoom = globeMarkerScale(orbit.radius)

  useFrame(() => {
    const node = group.current
    if (!node) return
    const observatory = getObservatoryState()
    const sample = observerOnTimeline(
      events,
      observatory.activeIndex,
      observatory.travel,
    )
    node.position.set(sample.position.x, sample.position.y, sample.position.z)
    up.set(sample.position.x, sample.position.y, sample.position.z).normalize()
    const tip = 0.13 * 2.65 * 1.04 * 2.04
    node.position.addScaledVector(up, (tip + 0.17) * zoom)
    forward.set(sample.heading.x, sample.heading.y, sample.heading.z).normalize()
    right.crossVectors(up, forward)
    if (right.lengthSq() < 1e-6) {
      right.set(1, 0, 0)
    } else {
      right.normalize()
    }
    forward.crossVectors(right, up).normalize()
    matrix.makeBasis(right, up, forward)
    node.quaternion.setFromRotationMatrix(matrix)
    node.scale.setScalar(zoom * 0.42)
  })

  return (
    <group ref={group}>
      <ChubbyAirplane />
    </group>
  )
}

function sliceArc(points: THREE.Vector3[], from: number, to: number) {
  if (points.length < 2 || to - from < 1e-4) return []
  const last = points.length - 1
  const startT = Math.max(0, Math.min(last, from * last))
  const endT = Math.max(startT, Math.min(last, to * last))
  if (endT - startT < 1e-4) return []
  const at = (t: number) => {
    const index = Math.min(last - 1, Math.floor(t))
    return points[index].clone().lerp(points[index + 1], t - index)
  }
  const sliced: THREE.Vector3[] = []
  const push = (point: THREE.Vector3) => {
    const prev = sliced[sliced.length - 1]
    if (!prev || prev.distanceToSquared(point) > 1e-8) sliced.push(point)
  }
  push(at(startT))
  for (let index = Math.ceil(startT); index <= Math.floor(endT); index += 1) {
    push(points[index])
  }
  push(at(endT))
  return sliced.length >= 2 ? sliced : []
}

function LiveArc({
  points,
  color,
  width,
  span,
  opacity,
}: {
  points: THREE.Vector3[]
  color: string
  width: number
  span: () => { from: number; to: number } | null
  opacity: number | ((range: { from: number; to: number }) => number)
}) {
  const geom = useMemo(() => new LineGeometry(), [])
  const mat = useMemo(
    () =>
      new LineMaterial({
        color: new THREE.Color(color).getHex(),
        transparent: true,
        opacity: 0.3,
        linewidth: width,
        depthWrite: false,
      }),
    [color, width],
  )
  const line = useMemo(() => new Line2(geom, mat), [geom, mat])

  useEffect(() => {
    return () => {
      geom.dispose()
      mat.dispose()
    }
  }, [geom, mat])

  useFrame((state) => {
    mat.resolution.set(state.size.width, state.size.height)
    const range = span()
    const slice = range ? sliceArc(points, range.from, range.to) : []
    if (!range || slice.length < 2) {
      line.visible = false
      return
    }
    line.visible = true
    geom.setPositions(slice.flatMap((point) => [point.x, point.y, point.z]))
    mat.opacity = typeof opacity === 'function' ? opacity(range) : opacity
  })

  return <primitive object={line} />
}

const GUIDE_DASH = 0.36
const GUIDE_GAP = 0.26
const GUIDE_COLOR = '#cfc4b2'

function arcLength(points: THREE.Vector3[]) {
  let length = 0
  for (let index = 1; index < points.length; index += 1) {
    length += points[index].distanceTo(points[index - 1])
  }
  return length
}

function NeighborHop({
  points,
  fromStart,
  pulse,
}: {
  points: THREE.Vector3[]
  fromStart: boolean
  pulse: boolean
}) {
  const elapsed = useRef(0)
  const spans = useRef<Array<{ from: number; to: number } | null>>([])
  const length = useMemo(() => arcLength(points), [points])
  const count = useMemo(
    () => guideCount(length, GUIDE_DASH, GUIDE_GAP),
    [length],
  )

  useFrame((_, delta) => {
    if (!pulse) {
      spans.current = []
      return
    }
    elapsed.current += delta
    spans.current = travelingGuides(
      elapsed.current,
      length,
      GUIDE_DASH,
      GUIDE_GAP,
      count,
      fromStart,
    )
  })

  if (!pulse) return null

  return (
    <group>
      {Array.from({ length: count }, (_, index) => (
        <LiveArc
          key={index}
          points={points}
          color={GUIDE_COLOR}
          width={1.6}
          opacity={0.62}
          span={() => spans.current[index] ?? null}
        />
      ))}
    </group>
  )
}

function JumpTrail({ from, to }: { from: LifeEvent; to: LifeEvent }) {
  const points = useMemo(
    () => sampleArc(from, to, EARTH_RADIUS + GLOBE_SURFACE_LIFT),
    [from, to],
  )
  const geom = useMemo(() => new LineGeometry(), [])
  const mat = useMemo(() => {
    const material = new LineMaterial({
      color: new THREE.Color(GUIDE_COLOR).getHex(),
      transparent: true,
      opacity: 0.55,
      linewidth: 1.6,
      depthWrite: false,
      dashed: true,
      dashSize: GUIDE_DASH,
      gapSize: GUIDE_GAP,
    })
    material.dashed = true
    return material
  }, [])
  const line = useMemo(() => new Line2(geom, mat), [geom, mat])

  useEffect(() => {
    return () => {
      geom.dispose()
      mat.dispose()
    }
  }, [geom, mat])

  useFrame((state) => {
    mat.resolution.set(state.size.width, state.size.height)
    const travel = getObservatoryState().travel
    const range = travel ? flownPortion(easeFlight(travel.t)) : null
    const slice = range ? sliceArc(points, range.from, range.to) : []
    if (!range || slice.length < 2) {
      line.visible = false
      return
    }
    line.visible = true
    geom.setPositions(slice.flatMap((point) => [point.x, point.y, point.z]))
    line.computeLineDistances()
  })

  return <primitive object={line} />
}

export function GlobeWorldline({ events }: { events: LifeEvent[] }) {
  const { activeIndex, travel } = useObservatory()
  const radius = EARTH_RADIUS + GLOBE_SURFACE_LIFT
  const hops = adjacentHops(activeIndex, events.length)
  const flyingPrev =
    !!travel && travel.fromIndex === activeIndex && travel.toIndex === activeIndex - 1
  const flyingNext =
    !!travel && travel.fromIndex === activeIndex && travel.toIndex === activeIndex + 1

  const segments = useMemo(() => {
    if (events.length < 2) return []
    return events.slice(0, -1).map((event, index) => ({
      key: `${event.id}-${events[index + 1].id}`,
      points: sampleArc(event, events[index + 1], radius),
    }))
  }, [events, radius])

  const jumping =
    !!travel && Math.abs(travel.toIndex - travel.fromIndex) > 1

  return (
    <group>
      {hops.prev !== null && segments[hops.prev] && (
        <NeighborHop
          key={segments[hops.prev].key}
          points={segments[hops.prev].points}
          fromStart={false}
          pulse={!flyingPrev}
        />
      )}
      {hops.next !== null && segments[hops.next] && (
        <NeighborHop
          key={segments[hops.next].key}
          points={segments[hops.next].points}
          fromStart
          pulse={!flyingNext}
        />
      )}
      {jumping && travel && (
        <JumpTrail from={events[travel.fromIndex]} to={events[travel.toIndex]} />
      )}
      <AirplaneCursor events={events} />
    </group>
  )
}
