import { create } from 'zustand'
import type { EntryKind } from '../../shared/types'

export type FileDialog =
  | { kind: 'create'; entryKind: EntryKind; parentPath: string }
  | { kind: 'rename'; path: string; name: string }
  | { kind: 'delete'; path: string; name: string }

interface FileDialogState {
  dialog: FileDialog | null
  open: (dialog: FileDialog) => void
  close: () => void
}

export const useFileDialogStore = create<FileDialogState>()((set) => ({
  dialog: null,
  open: (dialog) => set({ dialog }),
  close: () => set({ dialog: null })
}))
