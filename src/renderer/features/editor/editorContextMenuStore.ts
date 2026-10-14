import { create } from 'zustand'
import type { PopupMenuItem } from '../../ui/PopupMenu'

interface OpenContextMenu {
  x: number
  y: number
  items: PopupMenuItem[]
}

interface EditorContextMenuState {
  menu: OpenContextMenu | null
  open: (menu: OpenContextMenu) => void
  close: () => void
}

export const useEditorContextMenuStore = create<EditorContextMenuState>()((set) => ({
  menu: null,
  open: (menu) => set({ menu }),
  close: () => set({ menu: null })
}))
