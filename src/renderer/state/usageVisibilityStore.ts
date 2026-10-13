import { create } from 'zustand'
import type { ProviderId } from '../../shared/types'

const STORAGE_KEY = 'o-bros.hiddenUsageProviders'

interface UsageVisibilityState {
  hiddenProviders: ProviderId[]
  toggle: (provider: ProviderId) => void
}

function loadHiddenProviders(): ProviderId[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((id): id is ProviderId => id === 'claude' || id === 'codex') : []
  } catch {
    return []
  }
}

function saveHiddenProviders(hiddenProviders: ProviderId[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hiddenProviders))
  } catch {
    return
  }
}

export const useUsageVisibilityStore = create<UsageVisibilityState>()((set, get) => ({
  hiddenProviders: loadHiddenProviders(),

  toggle: (provider) => {
    const { hiddenProviders } = get()
    const next = hiddenProviders.includes(provider)
      ? hiddenProviders.filter((hidden) => hidden !== provider)
      : [...hiddenProviders, provider]
    saveHiddenProviders(next)
    set({ hiddenProviders: next })
  }
}))
