import { create } from 'zustand'

export interface ConfirmOptions {
  title: string
  message: string
  confirmLabel: string
}

interface ConfirmState {
  options: ConfirmOptions | null
  answer: (isConfirmed: boolean) => void
  ask: (options: ConfirmOptions) => Promise<boolean>
}

let resolveCurrent: ((isConfirmed: boolean) => void) | null = null

export const useConfirmStore = create<ConfirmState>()((set) => ({
  options: null,

  answer: (isConfirmed) => {
    resolveCurrent?.(isConfirmed)
    resolveCurrent = null
    set({ options: null })
  },

  ask: (options) => {
    resolveCurrent?.(false)
    return new Promise<boolean>((resolve) => {
      resolveCurrent = resolve
      set({ options })
    })
  }
}))

export function askToConfirm(options: ConfirmOptions): Promise<boolean> {
  return useConfirmStore.getState().ask(options)
}
