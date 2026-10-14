import { create } from 'zustand'
import { DEFAULT_PROMPTS, parsePrompts, type Prompt } from '../../shared/prompts'

const STORAGE_KEY = 'o-bros.prompts'

interface PromptsState {
  prompts: Prompt[]
  add: () => void
  update: (id: string, patch: Partial<Pick<Prompt, 'title' | 'text'>>) => void
  remove: (id: string) => void
  reset: () => void
}

function readSaved(): Prompt[] {
  try {
    return parsePrompts(localStorage.getItem(STORAGE_KEY)) ?? DEFAULT_PROMPTS
  } catch {
    return DEFAULT_PROMPTS
  }
}

function save(prompts: Prompt[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts))
  } catch {
    return
  }
}

export const usePromptsStore = create<PromptsState>()((set, get) => {
  function commit(prompts: Prompt[]): void {
    save(prompts)
    set({ prompts })
  }

  return {
    prompts: readSaved(),

    add: () => commit([...get().prompts, { id: crypto.randomUUID(), title: '', text: '' }]),

    update: (id, patch) =>
      commit(get().prompts.map((prompt) => (prompt.id === id ? { ...prompt, ...patch } : prompt))),

    remove: (id) => commit(get().prompts.filter((prompt) => prompt.id !== id)),

    reset: () => commit(DEFAULT_PROMPTS)
  }
})
