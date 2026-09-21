import { describe, expect, it } from 'vitest'
import { globeSurface } from './projectors'
import {
  regionInView,
  visibleSurfaceAngle,
} from './visibleRegions.ts'

describe('visibleSurfaceAngle', () => {
  it('narrows as the camera moves closer', () => {
    const far = visibleSurfaceAngle(16)
    const near = visibleSurfaceAngle(2)
    expect(near).toBeLessThan(far)
    expect(near).toBeGreaterThan(0.25)
    expect(far).toBeLessThan(1.6)
  })
})

describe('regionInView', () => {
  const mexico = { lat: 19.4, lng: -99.1 }
  const beijing = { lat: 39.9, lng: 116.4 }
  const cameraOverMexico = globeSurface(19.4, -99.1, 8)

  it('keeps regions under the camera', () => {
    expect(regionInView(mexico, cameraOverMexico, 4)).toBe(true)
  })

  it('drops regions on the far side of the globe', () => {
    expect(regionInView(beijing, cameraOverMexico, 4)).toBe(false)
  })
})
