import { describe, expect, it } from 'vitest'
import { withAppUsage } from './processUsage'

const MB = 1024 * 1024

describe('withAppUsage', () => {
  it('replaces the app usage and adds it to the terminals again', () => {
    const terminal = { paneId: 'a', cpuPercent: 2, workingSetBytes: 100 * MB, privateBytes: 80 * MB }
    const oldApp = { cpuPercent: 1, workingSetBytes: 300 * MB, privateBytes: 200 * MB }
    const snapshot = { app: oldApp, terminals: [terminal], total: { cpuPercent: 3, workingSetBytes: 400 * MB, privateBytes: 280 * MB } }
    const freshApp = { cpuPercent: 4, workingSetBytes: 350 * MB, privateBytes: 250 * MB }

    expect(withAppUsage(snapshot, freshApp).total).toEqual({ cpuPercent: 6, workingSetBytes: 450 * MB, privateBytes: 330 * MB })
  })
})
