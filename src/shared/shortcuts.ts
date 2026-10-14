export type ShortcutAction = 'splitRight' | 'splitDown' | 'closePane' | 'newTerminal' | 'openPrompts' | 'openCommandPalette'

export interface Shortcut {
  mod: boolean
  shift: boolean
  alt: boolean
  key: string
}

export interface KeyEventLike {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  altKey: boolean
}

export type ShortcutMap = Record<ShortcutAction, Shortcut>

export const SHORTCUT_ACTIONS: ShortcutAction[] = ['splitRight', 'splitDown', 'closePane', 'newTerminal', 'openPrompts', 'openCommandPalette']

export const SHORTCUT_LABELS: Record<ShortcutAction, { title: string; description: string }> = {
  splitRight: { title: 'Split right', description: 'Splits the focused terminal into two side by side.' },
  splitDown: { title: 'Split down', description: 'Splits the focused terminal into two, one above the other.' },
  closePane: { title: 'Close pane', description: 'Closes the focused terminal pane.' },
  newTerminal: { title: 'New terminal', description: 'Opens a plain terminal in the selected folder.' },
  openPrompts: { title: 'Prompts', description: 'Opens the prompt list to send a saved prompt to the terminal.' },
  openCommandPalette: { title: 'Command palette', description: 'Opens the list of every command, to search and run.' }
}

export const DEFAULT_SHORTCUTS: ShortcutMap = {
  splitRight: { mod: true, shift: true, alt: false, key: 'd' },
  splitDown: { mod: true, shift: true, alt: false, key: 'e' },
  closePane: { mod: true, shift: true, alt: false, key: 'w' },
  newTerminal: { mod: true, shift: true, alt: false, key: 't' },
  openPrompts: { mod: true, shift: true, alt: false, key: 'l' },
  openCommandPalette: { mod: true, shift: true, alt: false, key: 'p' }
}

const RESERVED_SHORTCUTS: Shortcut[] = ['p', 'f', 's', 'c', 'v', 'x', 'a', 'z', 'y'].map((key) => ({
  mod: true,
  shift: false,
  alt: false,
  key
}))

const MODIFIER_KEYS = ['control', 'shift', 'alt', 'meta', 'altgraph', 'os']

const KEY_NAMES: Record<string, string> = {
  arrowleft: 'Left',
  arrowright: 'Right',
  arrowup: 'Up',
  arrowdown: 'Down',
  ' ': 'Space',
  '\\': '\\'
}

export function isModifierKey(key: string): boolean {
  return MODIFIER_KEYS.includes(key.toLowerCase())
}

export function shortcutFromEvent(event: KeyEventLike): Shortcut | null {
  if (isModifierKey(event.key)) {
    return null
  }
  return {
    mod: event.ctrlKey || event.metaKey,
    shift: event.shiftKey,
    alt: event.altKey,
    key: event.key.toLowerCase()
  }
}

export function sameShortcut(first: Shortcut, second: Shortcut): boolean {
  return first.mod === second.mod && first.shift === second.shift && first.alt === second.alt && first.key === second.key
}

export function hasCommandModifier(shortcut: Shortcut): boolean {
  return shortcut.mod || shortcut.alt
}

export function findShortcutAction(shortcuts: ShortcutMap, event: KeyEventLike): ShortcutAction | null {
  const pressed = shortcutFromEvent(event)
  if (pressed === null) {
    return null
  }
  return SHORTCUT_ACTIONS.find((action) => sameShortcut(shortcuts[action], pressed)) ?? null
}

export type ShortcutProblem = 'needs-modifier' | 'reserved' | { usedBy: ShortcutAction }

export function findShortcutProblem(
  shortcuts: ShortcutMap,
  action: ShortcutAction,
  candidate: Shortcut
): ShortcutProblem | null {
  if (!hasCommandModifier(candidate)) {
    return 'needs-modifier'
  }
  if (RESERVED_SHORTCUTS.some((reserved) => sameShortcut(reserved, candidate))) {
    return 'reserved'
  }
  const usedBy = SHORTCUT_ACTIONS.find(
    (other) => other !== action && sameShortcut(shortcuts[other], candidate)
  )
  return usedBy === undefined ? null : { usedBy }
}

export function formatShortcut(shortcut: Shortcut, isMac: boolean): string {
  const parts: string[] = []
  if (shortcut.mod) {
    parts.push(isMac ? 'Cmd' : 'Ctrl')
  }
  if (shortcut.alt) {
    parts.push(isMac ? 'Option' : 'Alt')
  }
  if (shortcut.shift) {
    parts.push('Shift')
  }
  const named = KEY_NAMES[shortcut.key]
  parts.push(named ?? (shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key))
  return parts.join('+')
}

function isShortcut(value: unknown): value is Shortcut {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.mod === 'boolean' &&
    typeof candidate.shift === 'boolean' &&
    typeof candidate.alt === 'boolean' &&
    typeof candidate.key === 'string' &&
    candidate.key !== ''
  )
}

export function parseShortcuts(raw: string | null): ShortcutMap {
  const shortcuts: ShortcutMap = { ...DEFAULT_SHORTCUTS }
  if (raw === null) {
    return shortcuts
  }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) {
      return shortcuts
    }
    const saved = parsed as Record<string, unknown>
    for (const action of SHORTCUT_ACTIONS) {
      const candidate = saved[action]
      if (isShortcut(candidate) && hasCommandModifier(candidate)) {
        shortcuts[action] = candidate
      }
    }
    return shortcuts
  } catch {
    return shortcuts
  }
}
