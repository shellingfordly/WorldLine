import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

export function PostFx() {
  return (
    <EffectComposer>
      <Bloom
        intensity={0.62}
        luminanceThreshold={0.48}
        luminanceSmoothing={0.45}
        mipmapBlur
      />
      <Noise opacity={0.1} premultiply blendFunction={BlendFunction.SOFT_LIGHT} />
      <Vignette eskil={false} offset={0.22} darkness={0.78} />
    </EffectComposer>
  )
}
