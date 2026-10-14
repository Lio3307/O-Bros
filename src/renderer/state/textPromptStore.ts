import { create } from 'zustand'

export interface TextPromptOptions {
  title: string
  message?: string
  placeholder?: string
  initialValue?: string
  confirmLabel: string
  isMultiline?: boolean
  allowEmpty?: boolean
}

interface TextPromptState {
  options: TextPromptOptions | null
  answer: (value: string | null) => void
  ask: (options: TextPromptOptions) => Promise<string | null>
}

let resolveCurrent: ((value: string | null) => void) | null = null

export const useTextPromptStore = create<TextPromptState>()((set) => ({
  options: null,

  answer: (value) => {
    resolveCurrent?.(value)
    resolveCurrent = null
    set({ options: null })
  },

  ask: (options) => {
    resolveCurrent?.(null)
    return new Promise<string | null>((resolve) => {
      resolveCurrent = resolve
      set({ options })
    })
  }
}))

export function askForText(options: TextPromptOptions): Promise<string | null> {
  return useTextPromptStore.getState().ask(options)
}
