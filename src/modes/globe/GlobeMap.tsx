import { Line } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { globeSurface } from '../../lib/projectors'
import { filterRegionsInView } from '../../lib/visibleRegions'
import countriesData from '../../lib/geo/countries.json'
import regionsData from '../../lib/geo/regions.json'
import { WORLD_CITIES } from '../../lib/worldOutline'
import { FacingHtml } from '../../scene/FacingHtml'
import { globeMarkerScale, useObservatory } from '../../store'

type Outline = {
  id?: string
  name: string
  label?: boolean
  rings: [number, number][][]
}

type RegionMeta = Outline & {
  lat: number
  lng: number
  local: boolean
}

const COUNTRIES = countriesData.outlines as Outline[]
const REGIONS = regionsData.outlines as Outline[]

function projectRings(outlines: Outline[], lift: number) {
  return outlines.flatMap((outline) =>
    outline.rings.map((ring, index) => ({
      key: `${outline.name}-${index}`,
      points: ring.map(([lng, lat]) => {
        const p = globeSurface(lat, lng, lift)
        return new THREE.Vector3(p.x, p.y, p.z)
      }),
    })),
  )
}

function ringCentroid(ring: [number, number][]) {
  const closed =
    ring.length > 1 &&
    ring[0][0] === ring[ring.length - 1][0] &&
    ring[0][1] === ring[ring.length - 1][1]
  const pts = closed ? ring.slice(0, -1) : ring
  let lng = 0
  let lat = 0
  for (const point of pts) {
    lng += point[0]
    lat += point[1]
  }
  const n = Math.max(pts.length, 1)
  return { lng: lng / n, lat: lat / n }
}

export function shortRegionName(name: string) {
  return name
    .replace(/维吾尔自治区$/, '')
    .replace(/壮族自治区$/, '')
    .replace(/回族自治区$/, '')
    .replace(/特别行政区$/, '')
    .replace(/自治区$/, '')
    .replace(/联邦区$/, '')
    .replace(/特区$/, '')
    .replace(/省$/, '')
    .replace(/市$/, '')
    .replace(/州$/, '')
    .replace(/邦$/, '')
}

function RegionLabel({
  name,
  position,
  tight,
}: {
  name: string
  position: { x: number; y: number; z: number }
  tight: boolean
}) {
  return (
    <group position={[position.x, position.y, position.z]}>
      <FacingHtml center>
        <span className={`region-label${tight ? ' is-tight' : ''}`}>{name}</span>
      </FacingHtml>
    </group>
  )
}

function projectRegionSegments(outlines: Outline[]) {
  const points: THREE.Vector3[] = []
  for (const outline of outlines) {
    for (const ring of outline.rings) {
      for (let i = 0; i < ring.length - 1; i += 1) {
        const a = globeSurface(ring[i][1], ring[i][0], 0.055)
        const b = globeSurface(ring[i + 1][1], ring[i + 1][0], 0.055)
        points.push(new THREE.Vector3(a.x, a.y, a.z), new THREE.Vector3(b.x, b.y, b.z))
      }
    }
  }
  return points
}

export function GlobeMap() {
  const { camera } = useThree()
  const { selectedId, orbit } = useObservatory()
  const close = orbit.radius < 9
  const tight = orbit.radius < 6
  const zoom = globeMarkerScale(orbit.radius)
  const [visible, setVisible] = useState<RegionMeta[]>([])
  const last = useRef({ x: 999, y: 999, z: 999, r: 0 })

  const countries = useMemo(() => projectRings(COUNTRIES, 0.04), [])
  const catalog = useMemo<RegionMeta[]>(
    () =>
      REGIONS.map((outline) => {
        const ring = [...outline.rings].sort((a, b) => b.length - a.length)[0]
        const { lat, lng } = ringCentroid(ring)
        return {
          ...outline,
          lat,
          lng,
          local: (outline.id ?? '').startsWith('CN-'),
        }
      }),
    [],
  )

  useFrame(() => {
    if (!close) {
      if (visible.length > 0) setVisible([])
      return
    }
    const pos = camera.position
    const dx = pos.x - last.current.x
    const dy = pos.y - last.current.y
    const dz = pos.z - last.current.z
    const moved = dx * dx + dy * dy + dz * dz
    if (moved < 0.16 && Math.abs(orbit.radius - last.current.r) < 0.2) return
    last.current = { x: pos.x, y: pos.y, z: pos.z, r: orbit.radius }
    setVisible(
      filterRegionsInView(catalog, { x: pos.x, y: pos.y, z: pos.z }, orbit.radius),
    )
  })

  const regionSegments = useMemo(
    () => (visible.length > 0 ? projectRegionSegments(visible) : []),
    [visible],
  )

  const regionLabels = useMemo(
    () =>
      visible
        .filter(
          (outline) =>
            outline.label &&
            (outline.local || (outline.id ?? '').startsWith('US-')),
        )
        .map((outline) => {
          const p = globeSurface(outline.lat, outline.lng, 0.09)
          const n = new THREE.Vector3(p.x, p.y, p.z).normalize()
          const offset = n.multiplyScalar(0.12)
          return {
            id: outline.id ?? outline.name,
            name: shortRegionName(outline.name),
            position: {
              x: p.x + offset.x,
              y: p.y + offset.y,
              z: p.z + offset.z,
            },
          }
        }),
    [visible, tight],
  )

  return (
    <group>
      {countries.map((line) => (
        <Line
          key={line.key}
          points={line.points}
          color="#8fd8ea"
          lineWidth={tight ? 1.4 : 1.05}
          transparent
          opacity={tight ? 0.82 : 0.58}
        />
      ))}
      {close && regionSegments.length > 1 && (
        <Line
          points={regionSegments}
          segments
          color="#d7f4f8"
          lineWidth={1}
          transparent
          opacity={tight ? 0.26 : 0.16}
        />
      )}
      {close &&
        regionLabels.map((label) => (
          <RegionLabel
            key={label.id}
            name={label.name}
            tight={tight}
            position={label.position}
          />
        ))}
      {WORLD_CITIES.map((city) => {
        const p = globeSurface(city.lat, city.lng, 0.08)
        const n = new THREE.Vector3(p.x, p.y, p.z).normalize()
        const offset = n.multiplyScalar(0.28)
        return (
          <group key={city.name} position={[p.x, p.y, p.z]}>
            <mesh scale={zoom}>
              <sphereGeometry args={[0.045, 10, 10]} />
              <meshBasicMaterial color="#c4a36a" />
            </mesh>
            {!selectedId && !close && (
              <FacingHtml
                position={[offset.x, offset.y, offset.z]}
                style={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: '10px',
                  color: 'rgba(199, 163, 106, 0.84)',
                  letterSpacing: '0.08em',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  textShadow: '0 0 12px rgba(5,7,10,0.9)',
                }}
              >
                {city.name}
              </FacingHtml>
            )}
          </group>
        )
      })}
    </group>
  )
}
