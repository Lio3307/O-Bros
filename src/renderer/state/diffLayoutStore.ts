import { create } from 'zustand'
import { readStored, writeStored } from './browserStorage'

export type DiffLayout = 'unified' | 'split'

const STORAGE_KEY = 'o-bros.diffLayout'

interface DiffLayoutState {
  layout: DiffLayout
  setLayout: (layout: DiffLayout) => void
}

function loadLayout(): DiffLayout {
  return readStored(STORAGE_KEY) === 'split' ? 'split' : 'unified'
}

export const useDiffLayoutStore = create<DiffLayoutState>()((set) => ({
  layout: loadLayout(),
  setLayout: (layout) => {
    writeStored(STORAGE_KEY, layout)
    set({ layout })
  }
}))
