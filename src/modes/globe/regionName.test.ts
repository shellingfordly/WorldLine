import { describe, expect, it } from 'vitest'
import { DEFAULT_RADIUS, globeMarkerScale } from '../../store'
import { EARTH_RADIUS } from '../../lib/projectors'
import { shortRegionName } from './GlobeMap'

describe('shortRegionName', () => {
  it('strips common Chinese admin suffixes', () => {
    expect(shortRegionName('北京市')).toBe('北京')
    expect(shortRegionName('河北省')).toBe('河北')
    expect(shortRegionName('内蒙古自治区')).toBe('内蒙古')
    expect(shortRegionName('新疆维吾尔自治区')).toBe('新疆')
    expect(shortRegionName('广西壮族自治区')).toBe('广西')
    expect(shortRegionName('宁夏回族自治区')).toBe('宁夏')
    expect(shortRegionName('香港特别行政区')).toBe('香港')
    expect(shortRegionName('加利福尼亚州')).toBe('加利福尼亚')
    expect(shortRegionName('马哈拉施特拉邦')).toBe('马哈拉施特拉')
  })
})

describe('globeMarkerScale', () => {
  it('keeps apparent marker size stable as the camera moves in', () => {
    expect(globeMarkerScale(DEFAULT_RADIUS)).toBe(1)
    expect(globeMarkerScale(1.45)).toBeCloseTo(
      (EARTH_RADIUS + 1.45) / (EARTH_RADIUS + DEFAULT_RADIUS),
    )
    expect(globeMarkerScale(32)).toBe(1.12)
  })
})
