import { events } from './content/loadEvents'
import { BootSequence } from './overlay/BootSequence'
import { EventArchive } from './overlay/EventArchive'
import { Hud } from './overlay/Hud'
import GlobeScene from './modes/globe/GlobeScene'
import { bootTimeline } from './store'
import './index.css'

bootTimeline(events)

export default function App() {
  return (
    <div className="app">
      <GlobeScene events={events} />
      <Hud events={events} />
      <EventArchive events={events} />
      <BootSequence />
    </div>
  )
}
