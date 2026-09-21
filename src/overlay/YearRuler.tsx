import { useEffect, useMemo, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { LifeEvent } from '../types'
import {
  rulerMonthMarks,
  rulerTrackHeight,
  rulerTrackOffset,
  rulerYears,
  type TimeSpan,
} from '../lib/spacetime'
import { stepToYear } from '../store'

type YearRulerProps = {
  events: LifeEvent[]
  year: number
  span: TimeSpan
  traveling: boolean
}

export function YearRuler({ events, year, span, traveling }: YearRulerProps) {
  const scroller = useRef<HTMLDivElement>(null)
  const pad = useRef(0)
  const dragging = useRef(false)
  const moved = useRef(false)
  const lastY = useRef(0)
  const yearRef = useRef(year)
  yearRef.current = year

  const years = useMemo(() => rulerYears(span), [span])
  const months = useMemo(() => rulerMonthMarks(span), [span])
  const trackHeight = rulerTrackHeight(span)
  const needleTop = rulerTrackOffset(year, span)

  function syncScroll(target: number, smooth: boolean) {
    const node = scroller.current
    if (!node) return
    const top = Math.max(
      0,
      pad.current + rulerTrackOffset(target, span) - node.clientHeight * 0.5,
    )
    if (smooth && Math.abs(node.scrollTop - top) > 1) {
      node.scrollTo({ top, behavior: 'smooth' })
    } else {
      node.scrollTop = top
    }
  }

  useEffect(() => {
    const node = scroller.current
    if (!node) return

    const measure = () => {
      pad.current = node.clientHeight * 0.5
      syncScroll(yearRef.current, false)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [span.start, span.end])

  useEffect(() => {
    if (dragging.current) return
    syncScroll(year, !traveling)
  }, [year, traveling, span.start, span.end])

  useEffect(() => {
    const node = scroller.current
    if (!node) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      event.stopPropagation()
      node.scrollTop += event.deltaY
    }
    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  }, [])

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    dragging.current = true
    moved.current = false
    lastY.current = event.clientY
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    const node = scroller.current
    if (!node) return
    const dy = event.clientY - lastY.current
    if (Math.abs(dy) > 4) moved.current = true
    lastY.current = event.clientY
    node.scrollTop -= dy
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragged = moved.current
    dragging.current = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (dragged) return
    const hit = document.elementFromPoint(event.clientX, event.clientY)
    const button = hit instanceof Element ? hit.closest('button') : null
    if (!button || !event.currentTarget.contains(button)) return
    const slice = Number(button.textContent)
    if (Number.isFinite(slice)) stepToYear(events, slice)
  }

  return (
    <aside className="year-ruler">
      <div
        ref={scroller}
        className="year-ruler__scroller"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="year-ruler__pad" style={{ height: '50%' }} aria-hidden="true" />
        <div className="year-ruler__track" style={{ height: trackHeight }}>
          {months.map((mark) => (
            <span
              key={`${mark.year}-${mark.month}`}
              className={
                mark.month === 1 ? 'year-ruler__tick is-jan' : 'year-ruler__tick'
              }
              style={{ top: rulerTrackOffset(mark.t, span) }}
              aria-hidden="true"
            />
          ))}
          {years.map((slice) => {
            const distance = Math.abs(slice - year)
            const focus =
              distance < 0.55 ? 'is-active' : distance < 1.6 ? 'is-near' : ''
            return (
              <button
                key={slice}
                type="button"
                className={focus}
                style={{ top: rulerTrackOffset(slice, span) }}
                onClick={() => stepToYear(events, slice)}
              >
                {slice}
              </button>
            )
          })}
          <div className="year-ruler__needle" style={{ top: needleTop }} />
        </div>
        <div className="year-ruler__pad" style={{ height: '50%' }} aria-hidden="true" />
      </div>
    </aside>
  )
}
