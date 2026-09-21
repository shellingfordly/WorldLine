import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import type { LifeEvent } from '../types'
import {
  getObservatoryState,
  nudgeZoom,
  setOrbit,
  setSelectedId,
  stepEvent,
} from '../store'

export function useSceneControls(events: LifeEvent[]) {
  const { gl } = useThree()

  useEffect(() => {
    const element = gl.domElement
    let dragging = false
    let moved = false
    let lastX = 0
    let lastY = 0

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      dragging = true
      moved = false
      lastX = event.clientX
      lastY = event.clientY
      element.setPointerCapture(event.pointerId)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return
      const dx = event.clientX - lastX
      const dy = event.clientY - lastY
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true
      lastX = event.clientX
      lastY = event.clientY
      const orbit = getObservatoryState().orbit
      setOrbit({
        theta: orbit.theta - dx * 0.005,
        phi: orbit.phi + dy * 0.0038,
      })
    }

    const onPointerUp = (event: PointerEvent) => {
      dragging = false
      if (element.hasPointerCapture(event.pointerId)) {
        element.releasePointerCapture(event.pointerId)
      }
      if (!moved && event.target === element) {
        setSelectedId(null)
      }
    }

    const onWheel = (event: WheelEvent) => {
      const target = event.target as HTMLElement
      if (target.closest('.archive, .boot, button, a, input')) return
      event.preventDefault()
      if (event.ctrlKey || event.metaKey) {
        nudgeZoom(Math.exp(event.deltaY * 0.0018))
        return
      }
      const observatory = getObservatoryState()
      if (observatory.selectedId || observatory.travel) return
      if (event.deltaY === 0) return
      stepEvent(events, event.deltaY > 0 ? 1 : -1)
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedId(null)
      if (event.key === '=' || event.key === '+') {
        event.preventDefault()
        nudgeZoom(0.86)
        return
      }
      if (event.key === '-' || event.key === '_') {
        event.preventDefault()
        nudgeZoom(1.16)
        return
      }
      const observatory = getObservatoryState()
      if (observatory.selectedId || observatory.travel) return
      if (event.key === 'ArrowUp') stepEvent(events, -1)
      if (event.key === 'ArrowDown') stepEvent(events, 1)
    }

    element.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)

    return () => {
      element.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
    }
  }, [gl, events])
}
