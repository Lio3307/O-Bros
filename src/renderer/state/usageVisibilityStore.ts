import { create } from 'zustand'
import { readStoredJson, writeStoredJson } from './browserStorage'

const STORAGE_KEY = 'o-bros.hiddenUsageProviders'

interface UsageVisibilityState {
  hiddenSources: string[]
  toggle: (source: string) => void
}

function loadHiddenSources(): string[] {
  const parsed = readStoredJson(STORAGE_KEY)
  return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
}

function saveHiddenSources(hiddenSources: string[]): void {
  writeStoredJson(STORAGE_KEY, hiddenSources)
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
