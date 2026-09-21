export type LifeEvent = {
  id: string
  title: string
  date: string
  year: number
  place: string
  lat: number
  lng: number
  images: string[]
  tags: string[]
  body: string
}

export type ParsedEvent = {
  id: string
  title: string
  date: string
  year: number
  place: string
  lat: number
  lng: number
  imageNames: string[]
  tags: string[]
  body: string
}

export type Vec3 = {
  x: number
  y: number
  z: number
}
