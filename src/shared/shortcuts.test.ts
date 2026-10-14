import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SHORTCUTS,
  findShortcutAction,
  findShortcutProblem,
  formatShortcut,
  parseShortcuts,
  shortcutFromEvent,
  type KeyEventLike
} from './shortcuts'

function keyEvent(patch: Partial<KeyEventLike>): KeyEventLike {
  return { key: 'a', ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, ...patch }
}

describe('shortcutFromEvent', () => {
  it('ignores a modifier key pressed on its own', () => {
    expect(shortcutFromEvent(keyEvent({ key: 'Shift', shiftKey: true }))).toBeNull()
  })

  it('treats Ctrl and Cmd the same and lowercases the key', () => {
    expect(shortcutFromEvent(keyEvent({ key: 'D', ctrlKey: true, shiftKey: true }))).toEqual({
      mod: true,
      shift: true,
      alt: false,
      key: 'd'
    })
    expect(shortcutFromEvent(keyEvent({ key: 'D', metaKey: true, shiftKey: true }))?.mod).toBe(true)
  })
})

describe('findShortcutAction', () => {
  it('finds the action for the default split shortcut', () => {
    const event = keyEvent({ key: 'D', ctrlKey: true, shiftKey: true })
    expect(findShortcutAction(DEFAULT_SHORTCUTS, event)).toBe('splitRight')
  })

  it('returns null for a key that is not bound', () => {
    expect(findShortcutAction(DEFAULT_SHORTCUTS, keyEvent({ key: 'q', ctrlKey: true }))).toBeNull()
  })
})

describe('findShortcutProblem', () => {
  const candidate = { mod: true, shift: true, alt: false, key: 'k' }

  it('accepts a free shortcut', () => {
    expect(findShortcutProblem(DEFAULT_SHORTCUTS, 'splitRight', candidate)).toBeNull()
  })

  it('rejects a shortcut with no Ctrl, Cmd or Alt', () => {
    expect(findShortcutProblem(DEFAULT_SHORTCUTS, 'splitRight', { ...candidate, mod: false })).toBe('needs-modifier')
  })

  it('rejects the shortcuts the app and the system already use', () => {
    expect(findShortcutProblem(DEFAULT_SHORTCUTS, 'splitRight', { mod: true, shift: false, alt: false, key: 'p' })).toBe(
      'reserved'
    )
  })

  it('names the action that already uses the shortcut', () => {
    expect(findShortcutProblem(DEFAULT_SHORTCUTS, 'splitRight', DEFAULT_SHORTCUTS.splitDown)).toEqual({
      usedBy: 'splitDown'
    })
  })

  it('allows keeping the shortcut an action already has', () => {
    expect(findShortcutProblem(DEFAULT_SHORTCUTS, 'splitRight', DEFAULT_SHORTCUTS.splitRight)).toBeNull()
  })
})

describe('formatShortcut', () => {
  it('writes Ctrl on Windows and Cmd on a Mac', () => {
    expect(formatShortcut(DEFAULT_SHORTCUTS.splitRight, false)).toBe('Ctrl+Shift+D')
    expect(formatShortcut(DEFAULT_SHORTCUTS.splitRight, true)).toBe('Cmd+Shift+D')
  })

  it('names arrow keys', () => {
    expect(formatShortcut({ mod: false, shift: false, alt: true, key: 'arrowright' }, false)).toBe('Alt+Right')
  })
})

describe('parseShortcuts', () => {
  it('returns the defaults when nothing is saved or the data is broken', () => {
    expect(parseShortcuts(null)).toEqual(DEFAULT_SHORTCUTS)
    expect(parseShortcuts('not json')).toEqual(DEFAULT_SHORTCUTS)
  })

  it('uses a saved shortcut and keeps defaults for the rest', () => {
    const saved = JSON.stringify({ splitRight: { mod: true, shift: false, alt: true, key: 'r' } })
    const parsed = parseShortcuts(saved)
    expect(parsed.splitRight.key).toBe('r')
    expect(parsed.splitDown).toEqual(DEFAULT_SHORTCUTS.splitDown)
  })

  it('ignores a saved shortcut that has no Ctrl, Cmd or Alt', () => {
    const saved = JSON.stringify({ splitRight: { mod: false, shift: true, alt: false, key: 'r' } })
    expect(parseShortcuts(saved).splitRight).toEqual(DEFAULT_SHORTCUTS.splitRight)
  })
})
