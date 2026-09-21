import { Stars } from '@react-three/drei'

export function Starfield() {
  return (
    <Stars
      radius={120}
      depth={60}
      count={2800}
      factor={3.2}
      saturation={0}
      fade
      speed={0.25}
    />
  )
}
