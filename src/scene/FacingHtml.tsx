import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useState, type CSSProperties, type ReactNode } from 'react'
import * as THREE from 'three'

const _world = new THREE.Vector3()
const _toCamera = new THREE.Vector3()

export function FacingHtml({
  children,
  position,
  center,
  style,
  threshold = 0.16,
}: {
  children: ReactNode
  position?: [number, number, number]
  center?: boolean
  style?: CSSProperties
  threshold?: number
}) {
  const group = useRef<THREE.Group>(null)
  const [facing, setFacing] = useState(true)

  useFrame(({ camera }) => {
    const node = group.current
    if (!node) return
    node.getWorldPosition(_world)
    _toCamera.copy(camera.position).sub(_world).normalize()
    const next = _world.normalize().dot(_toCamera) > threshold
    if (next !== facing) setFacing(next)
  })

  return (
    <group ref={group} position={position}>
      {facing ? (
        <Html center={center} style={{ pointerEvents: 'none', ...style }}>
          {children}
        </Html>
      ) : null}
    </group>
  )
}
