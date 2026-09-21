import { describe, expect, it } from 'vitest'
import {
  EARTH_RADIUS,
  cameraFollow,
  framedWorldlineLook,
  framingLead,
  projectGlobe,
  sampleGlobeAlong,
  slerpOnSphere,
  upcomingWorldlineFocus,
  visibleSurfaceHalfAngle,
} from './projectors'

describe('projectGlobe', () => {
  it('keeps all years on the same spherical shell', () => {
    const early = projectGlobe({ lat: 39.9, lng: 116.4, year: 2008 })
    const late = projectGlobe({ lat: 39.9, lng: 116.4, year: 2024 })
    const earlyR = Math.hypot(early.x, early.y, early.z)
    const lateR = Math.hypot(late.x, late.y, late.z)
    expect(earlyR).toBeGreaterThan(EARTH_RADIUS)
    expect(lateR).toBeCloseTo(earlyR, 8)
  })

  it('places Beijing in the northern hemisphere', () => {
    const beijing = projectGlobe({ lat: 39.9, lng: 116.4, year: 2000 })
    const sydney = projectGlobe({ lat: -33.9, lng: 151.2, year: 2000 })
    expect(beijing.y).toBeGreaterThan(0)
    expect(sydney.y).toBeLessThan(0)
  })
})

describe('slerpOnSphere', () => {
  it('stays on the sphere between two cities', () => {
    const beijing = projectGlobe({ lat: 39.9, lng: 116.4, year: 2008 })
    const london = projectGlobe({ lat: 51.5, lng: -0.1, year: 2016 })
    const radius = Math.hypot(beijing.x, beijing.y, beijing.z)
    const mid = slerpOnSphere(beijing, london, 0.5, radius)
    expect(Math.hypot(mid.x, mid.y, mid.z)).toBeCloseTo(radius, 6)
  })

  it('crosses antipodes without producing NaN', () => {
    const east = { x: 1, y: 0, z: 0 }
    const west = { x: -1, y: 0, z: 0 }
    const mid = slerpOnSphere(east, west, 0.5, 2)
    expect(Number.isFinite(mid.x)).toBe(true)
    expect(Number.isFinite(mid.y)).toBe(true)
    expect(Number.isFinite(mid.z)).toBe(true)
    expect(Math.hypot(mid.x, mid.y, mid.z)).toBeCloseTo(2, 6)
    const end = slerpOnSphere(east, west, 1, 2)
    expect(end.x).toBeCloseTo(-2, 5)
    expect(end.y).toBeCloseTo(0, 5)
    expect(end.z).toBeCloseTo(0, 5)
  })
})

describe('sampleGlobeAlong', () => {
  it('travels a great-circle instead of a chord through Earth', () => {
    const events = [
      {
        id: 'a',
        title: 'A',
        place: 'Beijing',
        date: '2008-08-08',
        year: 2008,
        lat: 39.9,
        lng: 116.4,
        images: [],
        tags: [],
        body: '',
      },
      {
        id: 'b',
        title: 'B',
        place: 'London',
        date: '2016-06-01',
        year: 2016,
        lat: 51.5,
        lng: -0.1,
        images: [],
        tags: [],
        body: '',
      },
    ]
    const shell = projectGlobe(events[0])
    const radius = Math.hypot(shell.x, shell.y, shell.z)
    const mid = sampleGlobeAlong(events, 2012)
    expect(Math.hypot(mid.x, mid.y, mid.z)).toBeCloseTo(radius, 5)
    expect(Math.hypot(mid.x, mid.y, mid.z)).toBeGreaterThan(EARTH_RADIUS)
  })
})

describe('upcomingWorldlineFocus', () => {
  const events = [
    {
      id: 'a',
      title: 'A',
      place: 'Beijing',
      date: '2008-08-08',
      year: 2008,
      lat: 39.9,
      lng: 116.4,
      images: [],
      tags: [],
      body: '',
    },
    {
      id: 'b',
      title: 'B',
      place: 'London',
      date: '2016-06-01',
      year: 2016,
      lat: 51.5,
      lng: -0.1,
      images: [],
      tags: [],
      body: '',
    },
  ]

  it('sits between the cursor and the next event', () => {
    const here = sampleGlobeAlong(events, 2008)
    const dest = projectGlobe(events[1])
    const focus = upcomingWorldlineFocus(events, 2008, 0.25)
    const radius = Math.hypot(here.x, here.y, here.z)
    expect(Math.hypot(focus.x, focus.y, focus.z)).toBeCloseTo(radius, 5)
    const toHere = Math.hypot(focus.x - here.x, focus.y - here.y, focus.z - here.z)
    const toDest = Math.hypot(focus.x - dest.x, focus.y - dest.y, focus.z - dest.z)
    expect(toHere).toBeLessThan(toDest)
    expect(toHere).toBeGreaterThan(0)
  })

  it('stays on the last event after the archive ends', () => {
    const last = projectGlobe(events[1])
    const focus = upcomingWorldlineFocus(events, 2020, 0.25)
    expect(focus.x).toBeCloseTo(last.x, 5)
    expect(focus.y).toBeCloseTo(last.y, 5)
    expect(focus.z).toBeCloseTo(last.z, 5)
  })
})

describe('framedWorldlineLook', () => {
  const events = [
    {
      id: 'a',
      title: 'A',
      place: 'Mexico City',
      date: '2017-03-12',
      year: 2017.194,
      lat: 19.43,
      lng: -99.13,
      images: [],
      tags: [],
      body: '',
    },
    {
      id: 'b',
      title: 'B',
      place: 'New York',
      date: '2017-09-23',
      year: 2017.726,
      lat: 40.71,
      lng: -74.01,
      images: [],
      tags: [],
      body: '',
    },
    {
      id: 'c',
      title: 'C',
      place: 'Singapore',
      date: '2021-11-11',
      year: 2021.86,
      lat: 1.29,
      lng: 103.85,
      images: [],
      tags: [],
      body: '',
    },
  ]

  it('keeps a short hop framed between the cursor and the next event', () => {
    const here = sampleGlobeAlong(events, 2017.194)
    const dest = projectGlobe(events[1])
    const look = framedWorldlineLook(events, 2017.194)
    const toHere = Math.hypot(look.x - here.x, look.y - here.y, look.z - here.z)
    const toDest = Math.hypot(look.x - dest.x, look.y - dest.y, look.z - dest.z)
    expect(toHere).toBeGreaterThan(0)
    expect(toHere).toBeLessThan(toDest)
  })

  it('stays on the cursor when the next hop is nearly antipodal', () => {
    const here = sampleGlobeAlong(events, 2017.726)
    const look = framedWorldlineLook(events, 2017.726)
    expect(look.x).toBeCloseTo(here.x, 4)
    expect(look.y).toBeCloseTo(here.y, 4)
    expect(look.z).toBeCloseTo(here.z, 4)
  })
})

describe('framingLead', () => {
  it('keeps a short look-ahead when the hop fits on screen', () => {
    expect(framingLead(0.2, 16, false)).toBeCloseTo(0.16, 2)
    expect(framingLead(0.2, 16, true)).toBeCloseTo(0.32, 2)
  })

  it('pulls the look target back onto the subject when zoomed in', () => {
    const hop = 0.9
    const radius = 1.8
    const half = visibleSurfaceHalfAngle(radius)
    expect(framingLead(hop, radius, false) * hop).toBeLessThan(half * 0.07)
    expect(framingLead(hop, radius, true) * hop).toBeLessThan(half * 0.15)
  })

  it('does not look ahead when there is no hop', () => {
    expect(framingLead(0, 4, true)).toBe(0)
  })
})

describe('cameraFollow', () => {
  it('sticks harder while flying close to the surface', () => {
    const wide = cameraFollow(visibleSurfaceHalfAngle(16), true, 0.2)
    const close = cameraFollow(visibleSurfaceHalfAngle(1.8), true, 0.2)
    expect(close).toBeGreaterThan(wide * 4)
  })
})
