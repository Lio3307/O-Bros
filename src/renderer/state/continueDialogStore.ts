import { create } from 'zustand'
import type { ProviderId } from '../../shared/types'

export interface ContinueRequest {
  sessionFilePath: string
  sessionId: string | null
  title: string
  folder: string | null
  provider: ProviderId
}

interface ContinueDialogState {
  request: ContinueRequest | null
  open: (request: ContinueRequest) => void
  close: () => void
}

export const useContinueDialogStore = create<ContinueDialogState>()((set) => ({
  request: null,
  open: (request) => set({ request }),
  close: () => set({ request: null })
}))
