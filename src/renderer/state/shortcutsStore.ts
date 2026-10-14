import { create } from 'zustand'
import {
  DEFAULT_SHORTCUTS,
  formatShortcut,
  parseShortcuts,
  type Shortcut,
  type ShortcutAction,
  type ShortcutMap
} from '../../shared/shortcuts'

const STORAGE_KEY = 'o-bros.shortcuts'

interface ShortcutsState {
  shortcuts: ShortcutMap
  isRecording: boolean
  setShortcut: (action: ShortcutAction, shortcut: Shortcut) => void
  resetShortcut: (action: ShortcutAction) => void
  resetAll: () => void
  setRecording: (isRecording: boolean) => void
}

function readSaved(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function save(shortcuts: ShortcutMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts))
  } catch {
    return
  }
}

export const useShortcutsStore = create<ShortcutsState>()((set, get) => ({
  shortcuts: parseShortcuts(readSaved()),
  isRecording: false,

  setShortcut: (action, shortcut) => {
    const shortcuts = { ...get().shortcuts, [action]: shortcut }
    save(shortcuts)
    set({ shortcuts })
  },

  resetShortcut: (action) => {
    const shortcuts = { ...get().shortcuts, [action]: DEFAULT_SHORTCUTS[action] }
    save(shortcuts)
    set({ shortcuts })
  },

  resetAll: () => {
    save(DEFAULT_SHORTCUTS)
    set({ shortcuts: { ...DEFAULT_SHORTCUTS } })
  },

  setRecording: (isRecording) => set({ isRecording })
}))

export function isMacPlatform(): boolean {
  return navigator.platform.toLowerCase().includes('mac')
}

export function useShortcutLabel(action: ShortcutAction): string {
  const shortcut = useShortcutsStore((state) => state.shortcuts[action])
  return formatShortcut(shortcut, isMacPlatform())
}
