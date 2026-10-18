import { create } from 'zustand'

const STORAGE_KEY = 'o-bros.hiddenUsageProviders'

interface UsageVisibilityState {
  hiddenSources: string[]
  toggle: (source: string) => void
}

function loadHiddenSources(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

function saveHiddenSources(hiddenSources: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hiddenSources))
  } catch {
    return
  }
}

export const useUsageVisibilityStore = create<UsageVisibilityState>()((set, get) => ({
  hiddenSources: loadHiddenSources(),

  toggle: (source) => {
    const { hiddenSources } = get()
    const next = hiddenSources.includes(source)
      ? hiddenSources.filter((hidden) => hidden !== source)
      : [...hiddenSources, source]
    saveHiddenSources(next)
    set({ hiddenSources: next })
  }
}))
