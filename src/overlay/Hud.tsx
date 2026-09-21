import type { LifeEvent } from '../types'
import { formatCoordinateTime, formatYear } from '../lib/spacetime'
import { useObservatory } from '../store'
import { YearRuler } from './YearRuler'

export function Hud({ events }: { events: LifeEvent[] }) {
  const { year, span, selectedId, hoveredId, booted, activeIndex, travel } =
    useObservatory()
  const focus =
    events.find((event) => event.id === selectedId) ??
    events.find((event) => event.id === hoveredId) ??
    events[travel ? travel.toIndex : activeIndex]

  return (
    <div className={`hud ${booted ? 'is-ready' : ''}`}>
      <header className="hud__brand">
        <h1>WORLD LINE</h1>
        <span>PERSONAL SPACETIME ARCHIVE</span>
      </header>

      <section className="hud__readout">
        <dl>
          <div>
            <dt>t</dt>
            <dd>{formatYear(year)}</dd>
          </div>
          <div>
            <dt>date</dt>
            <dd>{focus?.date ?? formatCoordinateTime(year)}</dd>
          </div>
          <div>
            <dt>lng</dt>
            <dd>
              {focus
                ? `${Math.abs(focus.lng).toFixed(3)}°${focus.lng >= 0 ? 'E' : 'W'}`
                : '—'}
            </dd>
          </div>
          <div>
            <dt>lat</dt>
            <dd>
              {focus
                ? `${Math.abs(focus.lat).toFixed(3)}°${focus.lat >= 0 ? 'N' : 'S'}`
                : '—'}
            </dd>
          </div>
        </dl>
        {focus && <p className="hud__place">{focus.place}</p>}
      </section>

      <YearRuler
        events={events}
        year={year}
        span={span}
        traveling={Boolean(travel)}
      />
      <footer className="hud__legend">
        <span>ds² = −c²dt² + dx² + dy²</span>
      </footer>
    </div>
  )
}
