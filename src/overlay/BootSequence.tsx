import { useEffect, useState } from 'react'
import { setBooted, useObservatory } from '../store'

export function BootSequence() {
  const { span } = useObservatory()
  const [visible, setVisible] = useState(true)
  const [index, setIndex] = useState(0)
  const lines = [
    'INITIALIZING SPACETIME MANIFOLD',
    'CHART · SELECTABLE MANIFOLD',
    'WORLDLINE CALIBRATION',
    `PROPER TIME ${span.start.toFixed(2)} → ${span.end.toFixed(2)}`,
    'WORLDLINE READY',
  ]

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setIndex(1), 380),
      window.setTimeout(() => setIndex(2), 760),
      window.setTimeout(() => setIndex(3), 1140),
      window.setTimeout(() => setIndex(4), 1520),
      window.setTimeout(() => {
        setBooted()
        setVisible(false)
      }, 2280),
    ]
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [])

  if (!visible) return null

  return (
    <div className="boot">
      <div className="boot__frame">
        <p className="boot__kicker">WorldLine</p>
        <ul>
          {lines.slice(0, index + 1).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
