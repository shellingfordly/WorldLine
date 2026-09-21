import { Canvas } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import type { LifeEvent } from '../../types'
import { EventCrystal } from '../../scene/EventCrystal'
import { PostFx } from '../../scene/PostFx'
import { Starfield } from '../../scene/Starfield'
import { useSceneControls } from '../../scene/useSceneControls'
import { EARTH_RADIUS, projectGlobe } from '../../lib/projectors'
import { useObservatory } from '../../store'
import { GlobeCamera } from './GlobeCamera'
import { GlobeMap } from './GlobeMap'
import { GlobeWorldline } from './GlobeWorldline'

function EarthBody() {
  const { orbit } = useObservatory()
  const close = orbit.radius < 7

  return (
    <group>
      {!close && (
        <mesh>
          <sphereGeometry args={[EARTH_RADIUS, 64, 48]} />
          <meshBasicMaterial
            color="#8fd8ea"
            wireframe
            transparent
            opacity={0.08}
          />
        </mesh>
      )}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS, 64, 48]} />
        <meshStandardMaterial
          color="#071018"
          emissive="#12303a"
          emissiveIntensity={0.45}
          roughness={0.9}
          depthWrite
        />
      </mesh>
      <GlobeMap />
    </group>
  )
}

function GlobeCrystal({
  event,
  events,
  lit,
}: {
  event: LifeEvent
  events: LifeEvent[]
  lit: boolean
}) {
  const position = projectGlobe(event)
  const quaternion = useMemo(() => {
    const radial = new THREE.Vector3(position.x, position.y, position.z).normalize()
    return new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      radial,
    )
  }, [position.x, position.y, position.z])

  return (
    <group position={[position.x, position.y, position.z]} quaternion={quaternion}>
      <EventCrystal event={event} events={events} position={{ x: 0, y: 0, z: 0 }} size={0.13} lit={lit} />
    </group>
  )
}

function Rig({ events }: { events: LifeEvent[] }) {
  useSceneControls(events)
  const { orbit, activeIndex, travel } = useObservatory()
  const fogNear = Math.max(6, EARTH_RADIUS + orbit.radius * 0.35)
  const fogFar = EARTH_RADIUS * 2.8 + orbit.radius * 3.2
  const litIds = new Set(
    [events[activeIndex]?.id, travel ? events[travel.toIndex]?.id : null].filter(
      Boolean,
    ) as string[],
  )

  return (
    <>
      <color attach="background" args={['#05070a']} />
      <fog attach="fog" args={['#05070a', fogNear, fogFar]} />
      <ambientLight intensity={0.42} color="#9bb3c0" />
      <directionalLight position={[12, 16, 8]} intensity={1.3} color="#e7e1d4" />
      <pointLight position={[0, 0, 0]} intensity={1.4} color="#8fd8ea" distance={40} />
      <GlobeCamera events={events} />
      <Starfield />
      <EarthBody />
      <GlobeWorldline events={events} />
      {events.map((event) => (
        <GlobeCrystal key={event.id} event={event} events={events} lit={litIds.has(event.id)} />
      ))}
      <PostFx />
    </>
  )
}

export default function GlobeScene({ events }: { events: LifeEvent[] }) {
  return (
    <Canvas
      className="observatory-canvas"
      dpr={[1, 1.75]}
      camera={{ fov: 42, near: 0.08, far: 220, position: [0, 8, 24] }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <Rig events={events} />
    </Canvas>
  )
}
