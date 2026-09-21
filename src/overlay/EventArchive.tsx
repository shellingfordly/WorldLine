import Markdown from 'react-markdown'
import type { LifeEvent } from '../types'
import { setSelectedId, focusEvent, useObservatory } from '../store'

export function EventArchive({ events }: { events: LifeEvent[] }) {
  const { selectedId } = useObservatory()
  const event = events.find((item) => item.id === selectedId)
  if (!event) return null

  const index = events.findIndex((item) => item.id === event.id)
  const prev = events[index - 1]
  const next = events[index + 1]

  return (
    <aside className="archive">
      <div className="archive__veil" onClick={() => setSelectedId(null)} />
      <article className="archive__panel">
        <header>
          <p className="archive__meta">
            EVENT {String(index + 1).padStart(2, '0')} / {String(events.length).padStart(2, '0')}
          </p>
          <button type="button" className="archive__close" onClick={() => setSelectedId(null)}>
            关闭静止系 ESC
          </button>
          <h2>{event.title}</h2>
          <p className="archive__coords">
            t = {event.date} · {event.place}
            <br />
            {Math.abs(event.lat).toFixed(3)}°{event.lat >= 0 ? 'N' : 'S'}{' '}
            {Math.abs(event.lng).toFixed(3)}°{event.lng >= 0 ? 'E' : 'W'}
          </p>
        </header>

        {event.images[0] && (
          <figure className="archive__plate">
            <img
              className="archive__plate-visual"
              src={event.images[0]}
              alt={event.title}
            />
            <figcaption>OBSERVATION PLATE</figcaption>
          </figure>
        )}

        <div className="archive__body">
          <Markdown>{event.body}</Markdown>
        </div>

        {event.tags.length > 0 && (
          <ul className="archive__tags">
            {event.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        )}

        <nav className="archive__nav">
          <button
            type="button"
            disabled={!prev}
            onClick={() => prev && focusEvent(events, prev.id)}
          >
            上一事件
          </button>
          <button
            type="button"
            disabled={!next}
            onClick={() => next && focusEvent(events, next.id)}
          >
            下一事件
          </button>
        </nav>
      </article>
    </aside>
  )
}
