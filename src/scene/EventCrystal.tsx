import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Mesh } from 'three'
import type { LifeEvent, Vec3 } from '../types'
import { globeMarkerScale, setHoveredId, focusEvent, useObservatory } from '../store'
import { FacingHtml } from './FacingHtml'

export function EventCrystal({
  event,
  events,
  position,
  size = 0.12,
  lit = false,
}: {
  event: LifeEvent
  events: LifeEvent[]
  position: Vec3
  size?: number
  lit?: boolean
}) {
  const mesh = useRef<Mesh>(null)
  const wire = useRef<Mesh>(null)
  const core = useRef<Mesh>(null)
  const { selectedId, hoveredId, orbit } = useObservatory()
  const selected = selectedId === event.id
  const hovered = hoveredId === event.id

  useFrame((state) => {
    const wave = (Math.sin(state.clock.elapsedTime * 2.1 + event.year) + 1) / 2
    const feel = selected ? 1.16 : hovered ? 1.08 : lit ? 1.04 : 1
    const zoom = globeMarkerScale(orbit.radius) * feel
    const sx = 0.52 * zoom
    const sy = 2.65 * zoom
    mesh.current?.scale.set(sx, sy, sx)
    wire.current?.scale.set(sx * 1.06, sy * 1.04, sx * 1.06)
    // Keep the tip clear of the globe so top-down views don't fight the surface.
    const lift = size * sy + 0.06 * zoom
    mesh.current?.position.set(0, lift, 0)
    wire.current?.position.set(0, lift, 0)

    const mat = mesh.current?.material
    if (mat && 'emissiveIntensity' in mat) {
      const base = selected ? 1.15 : hovered ? 0.95 : lit ? 0.75 : 0.45
      mat.emissiveIntensity = base + wave * 0.35
    }

    if (core.current) {
      const inset = 0.38 + wave * 0.1
      core.current.scale.set(sx * inset, sy * inset, sx * inset)
      core.current.position.set(0, lift, 0)
      const coreMat = core.current.material
      if ('opacity' in coreMat) coreMat.opacity = 0.12 + wave * 0.22
    }
  })

  const labelLift = 0.48 * globeMarkerScale(orbit.radius)
  const baseLift = 0.08 * globeMarkerScale(orbit.radius)

  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh ref={core} raycast={() => null}>
        <octahedronGeometry args={[size, 0]} />
        <meshBasicMaterial
          color={selected ? '#f2c572' : '#8fd8ea'}
          transparent
          opacity={0.2}
          depthWrite={false}
        />
      </mesh>
      <mesh
        ref={mesh}
        scale={[0.52, 2.65, 0.52]}
        position={[0, size * 2.65 + 0.06, 0]}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHoveredId(event.id)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHoveredId(null)
          document.body.style.cursor = 'default'
        }}
        onClick={(e) => {
          e.stopPropagation()
          focusEvent(events, event.id)
        }}
      >
        <octahedronGeometry args={[size, 0]} />
        <meshStandardMaterial
          color={selected ? '#e7e1d4' : '#8fd8ea'}
          emissive={selected ? '#c4a36a' : '#3aa0b5'}
          emissiveIntensity={selected ? 2.4 : hovered ? 1.8 : 0.9}
          roughness={0.18}
          metalness={0.45}
          transparent
          opacity={0.92}
        />
      </mesh>
      <mesh
        ref={wire}
        raycast={() => null}
        scale={[0.55, 2.76, 0.55]}
        position={[0, size * 2.65 + 0.06, 0]}
      >
        <octahedronGeometry args={[size, 0]} />
        <meshBasicMaterial
          color="#e7e1d4"
          wireframe
          transparent
          opacity={selected ? 0.7 : 0.22}
        />
      </mesh>
      <FacingHtml position={[0, baseLift, 0]} center style={{ pointerEvents: 'auto' }}>
        <button
          type="button"
          className="crystal-hit"
          aria-label={`打开事件：${event.title}`}
          onMouseEnter={() => {
            setHoveredId(event.id)
            document.body.style.cursor = 'pointer'
          }}
          onMouseLeave={() => {
            setHoveredId(null)
            document.body.style.cursor = 'default'
          }}
          onClick={(e) => {
            e.stopPropagation()
            focusEvent(events, event.id)
          }}
        />
      </FacingHtml>
      {hovered && (
        <Html position={[0.18, labelLift, 0]} style={{ pointerEvents: 'none' }}>
          <div className="event-label">
            <span className="event-label__t">{event.date}</span>
            <strong>{event.title}</strong>
            <em>{event.place}</em>
          </div>
        </Html>
      )}
    </group>
  )
}
