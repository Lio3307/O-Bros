import { create } from 'zustand'

const DEFAULT_FONT_SIZE = 13
const MIN_FONT_SIZE = 8
const MAX_FONT_SIZE = 28
const STORAGE_KEY = 'o-bros.terminalFontSize'

interface TerminalFontState {
  fontSize: number
  increase: () => void
  decrease: () => void
  reset: () => void
}

function clampFontSize(size: number): number {
  return Math.min(Math.max(size, MIN_FONT_SIZE), MAX_FONT_SIZE)
}

function loadSavedFontSize(): number {
  const saved = Number(localStorage.getItem(STORAGE_KEY))
  return saved > 0 ? clampFontSize(saved) : DEFAULT_FONT_SIZE
}

export const useTerminalFontStore = create<TerminalFontState>()((set, get) => {
  function changeTo(size: number): void {
    const fontSize = clampFontSize(size)
    localStorage.setItem(STORAGE_KEY, String(fontSize))
    set({ fontSize })
  }

  return {
    fontSize: loadSavedFontSize(),
    increase: () => changeTo(get().fontSize + 1),
    decrease: () => changeTo(get().fontSize - 1),
    reset: () => changeTo(DEFAULT_FONT_SIZE)
  }
})
