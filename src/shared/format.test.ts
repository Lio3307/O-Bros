import { describe, expect, it } from 'vitest'
import { formatBytes, formatPercent } from './format'

const MB = 1024 * 1024
const GB = 1024 * MB

describe('formatBytes', () => {
  it('uses MB with one decimal and GB with two', () => {
    expect(formatBytes(914.9 * MB)).toBe('914.9 MB')
    expect(formatBytes(3.45 * GB)).toBe('3.45 GB')
  })

  it('shows plain bytes below one kilobyte', () => {
    expect(formatBytes(512)).toBe('512 B')
  })

  it('never shows a negative size', () => {
    expect(formatBytes(-5)).toBe('0 B')
  })
})

describe('formatPercent', () => {
  it('rounds to one decimal', () => {
    expect(formatPercent(10.94)).toBe('10.9%')
  })
})
