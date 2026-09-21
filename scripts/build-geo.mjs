import { mkdir, readFile, writeFile } from 'node:fs/promises'

const countriesPath = '/tmp/geo-src/countries.geojson'
const provincesPath = '/tmp/geo-src/provinces.geojson'
const admin1Path = '/tmp/geo-src/admin1_10m.geojson'
const outDir = new URL('../src/lib/geo/', import.meta.url)

function distPointSeg(p, a, b) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len2 = dx * dx + dy * dy
  if (len2 < 1e-12) return Math.hypot(p[0] - a[0], p[1] - a[1])
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2
  t = Math.min(1, Math.max(0, t))
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))
}

function simplify(ring, epsilon) {
  if (ring.length < 5) return ring
  const last = ring.length - 1
  let max = 0
  let index = 0
  for (let i = 1; i < last; i += 1) {
    const d = distPointSeg(ring[i], ring[0], ring[last])
    if (d > max) {
      max = d
      index = i
    }
  }
  if (max > epsilon) {
    const left = simplify(ring.slice(0, index + 1), epsilon)
    const right = simplify(ring.slice(index), epsilon)
    return left.slice(0, -1).concat(right)
  }
  return [ring[0], ring[last]]
}

function roundRing(ring) {
  const next = ring.map(([lng, lat]) => [
    Math.round(lng * 100) / 100,
    Math.round(lat * 100) / 100,
  ])
  const unique = []
  for (const point of next) {
    const prev = unique[unique.length - 1]
    if (!prev || prev[0] !== point[0] || prev[1] !== point[1]) unique.push(point)
  }
  if (unique.length >= 2) {
    const first = unique[0]
    const last = unique[unique.length - 1]
    if (first[0] !== last[0] || first[1] !== last[1]) unique.push(first)
  }
  return unique
}

function extractRings(geometry) {
  if (!geometry) return []
  if (geometry.type === 'Polygon') return [geometry.coordinates[0]]
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.map((polygon) => polygon[0])
  return []
}

function compactFeature(name, geometry, epsilon, extra = {}) {
  const rings = extractRings(geometry)
    .map((ring) => simplify(ring, epsilon))
    .map(roundRing)
    .filter((ring) => ring.length >= 4)
    .sort((a, b) => b.length - a.length)
    .slice(0, 6)
  if (rings.length === 0) return null
  return { name, ...extra, rings }
}

const countriesGeo = JSON.parse(await readFile(countriesPath, 'utf8'))
const countries = countriesGeo.features
  .map((feature) =>
    compactFeature(feature.properties.NAME || feature.properties.ADMIN, feature.geometry, 0.42),
  )
  .filter(Boolean)
  .sort((a, b) => a.name.localeCompare(b.name))

const provincesGeo = JSON.parse(await readFile(provincesPath, 'utf8'))
const china = provincesGeo.features
  .filter((feature) => feature.properties.level === 'province')
  .map((feature) =>
    compactFeature(feature.properties.name, feature.geometry, 0.08, {
      id: `CN-${feature.properties.name}`,
      label: true,
    }),
  )
  .filter(Boolean)

const LOCAL_TYPE =
  /County|Borough|District|Municipality|Parish|Commune|Unitary|department|Statistical|Metropolitan City/i
const MUST = new Set(
  'USA CAN MEX BRA ARG CHL PER COL AUS NZL IND IDN JPN KOR THA VNM PAK DEU ESP POL UKR IRN SAU ARE EGY ZAF NGA KEN ETH MAR ISL NOR SWE FIN RUS KAZ MNG AGO SDN'.split(
    ' ',
  ),
)

const admin1Geo = JSON.parse(await readFile(admin1Path, 'utf8'))
const worldByCountry = new Map()
for (const feature of admin1Geo.features) {
  const props = feature.properties ?? {}
  const iso = props.adm0_a3
  if (!iso || iso === 'CHN') continue
  const typeEn = props.type_en ?? ''
  if (LOCAL_TYPE.test(typeEn)) continue
  if (props.gadm_level !== 1) continue
  const rank = props.scalerank ?? 99
  if (!MUST.has(iso) && rank > 4) continue
  const name = props.name_zh || props.name
  if (!name) continue
  const item = compactFeature(name, feature.geometry, 0.12, {
    id: props.iso_3166_2 || props.adm1_code || `${iso}-${name}`,
    label: (props.labelrank ?? 99) <= 4 || iso === 'USA',
  })
  if (!item) continue
  const list = worldByCountry.get(iso) ?? []
  list.push(item)
  worldByCountry.set(iso, list)
}

const world = []
for (const [iso, list] of worldByCountry) {
  if (!MUST.has(iso) && list.length > 50) continue
  world.push(...list)
}

const regions = [...china, ...world]

await mkdir(outDir, { recursive: true })
await writeFile(new URL('countries.json', outDir), `${JSON.stringify({ outlines: countries })}\n`)
await writeFile(new URL('provinces.json', outDir), `${JSON.stringify({ outlines: china })}\n`)
await writeFile(new URL('regions.json', outDir), `${JSON.stringify({ outlines: regions })}\n`)

const countPts = (items) =>
  items.reduce((sum, item) => sum + item.rings.reduce((n, ring) => n + ring.length, 0), 0)
console.log(`countries ${countries.length} / ${countPts(countries)} pts`)
console.log(`china ${china.length} / ${countPts(china)} pts`)
console.log(`regions ${regions.length} / ${countPts(regions)} pts`)
console.log(`labels ${regions.filter((item) => item.label).length}`)
