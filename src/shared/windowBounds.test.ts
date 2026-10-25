import { describe, expect, it } from 'vitest'
import { DEFAULT_WINDOW_STATE, parseWindowState, startingBounds } from './windowBounds'

const MAIN_SCREEN = { x: 0, y: 0, width: 1920, height: 1040 }
const MINIMUM = { width: 900, height: 560 }
const FALLBACK = { width: 1440, height: 900 }

describe('parseWindowState', () => {
  it('reads a saved state and ignores broken data', () => {
    expect(parseWindowState({ bounds: { x: 10, y: 20, width: 1000, height: 700 }, isMaximized: true, isFullScreen: false })).toEqual({
      bounds: { x: 10, y: 20, width: 1000, height: 700 },
      isMaximized: true,
      isFullScreen: false
    })
    expect(parseWindowState({ bounds: { x: 'left' }, isMaximized: 'yes' })).toEqual(DEFAULT_WINDOW_STATE)
    expect(parseWindowState(null)).toEqual(DEFAULT_WINDOW_STATE)
  })
})

describe('startingBounds', () => {
  it('opens where it was closed when that place is still on a screen', () => {
    const state = { ...DEFAULT_WINDOW_STATE, bounds: { x: 100, y: 50, width: 1200, height: 800 } }
    expect(startingBounds(state, [MAIN_SCREEN], MINIMUM, FALLBACK)).toEqual({ x: 100, y: 50, width: 1200, height: 800 })
  })

  it('uses the default size when the saved place is on a screen that is gone', () => {
    const onUnpluggedMonitor = { ...DEFAULT_WINDOW_STATE, bounds: { x: 2500, y: 100, width: 1200, height: 800 } }
    expect(startingBounds(onUnpluggedMonitor, [MAIN_SCREEN], MINIMUM, FALLBACK)).toEqual(FALLBACK)
    expect(startingBounds(DEFAULT_WINDOW_STATE, [MAIN_SCREEN], MINIMUM, FALLBACK)).toEqual(FALLBACK)
  })

  it('never opens smaller than the minimum size', () => {
    const tiny = { ...DEFAULT_WINDOW_STATE, bounds: { x: 0, y: 0, width: 300, height: 200 } }
    expect(startingBounds(tiny, [MAIN_SCREEN], MINIMUM, FALLBACK)).toEqual({ x: 0, y: 0, width: 900, height: 560 })
  })
})
