import { create } from 'zustand'

export type DiffLayout = 'unified' | 'split'

const STORAGE_KEY = 'o-bros.diffLayout'

interface DiffLayoutState {
  layout: DiffLayout
  setLayout: (layout: DiffLayout) => void
}

function loadLayout(): DiffLayout {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'split' ? 'split' : 'unified'
  } catch {
    return 'unified'
  }
}

export const useDiffLayoutStore = create<DiffLayoutState>()((set) => ({
  layout: loadLayout(),
  setLayout: (layout) => {
    try {
      localStorage.setItem(STORAGE_KEY, layout)
    } catch {
      return
    } finally {
      set({ layout })
    }
  }
}))
