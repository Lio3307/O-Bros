import { create } from 'zustand'
import { providerIdForCommand } from '../../shared/agentLaunchers'
import { parseCustomProviders, type CustomProvider, type CustomProviderDraft } from '../../shared/customProviders'
import { useAgentLaunchersStore } from './agentLaunchersStore'

const STORAGE_KEY = 'o-bros.customProviders'

interface CustomProvidersState {
  providers: CustomProvider[]
  keyHints: Record<string, string>
  loadKeyHints: () => Promise<void>
  save: (id: string | null, draft: CustomProviderDraft, newKey: string | null) => Promise<void>
  removeKey: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

function readSaved(): CustomProvider[] {
  try {
    return parseCustomProviders(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'))
  } catch {
    return []
  }
}

function writeSaved(providers: CustomProvider[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(providers))
  } catch {
    return
  }
}

export const useCustomProvidersStore = create<CustomProvidersState>()((set, get) => {
  function replace(providers: CustomProvider[]): void {
    writeSaved(providers)
    set({ providers })
  }

  async function loadKeyHints(): Promise<void> {
    set({ keyHints: await window.api.accounts.providerKeyHints() })
  }

  return {
    providers: readSaved(),
    keyHints: {},
    loadKeyHints,

    save: async (id, draft, newKey) => {
      const providerId = id ?? crypto.randomUUID()
      if (newKey !== null && newKey.trim() !== '') {
        await window.api.accounts.saveProviderKey(providerId, newKey)
      }
      const provider: CustomProvider = { ...draft, id: providerId, name: draft.name.trim(), baseUrl: draft.baseUrl.trim(), modelId: draft.modelId.trim() }
      const exists = get().providers.some((existing) => existing.id === providerId)
      replace(exists ? get().providers.map((existing) => (existing.id === providerId ? provider : existing)) : [...get().providers, provider])
      await loadKeyHints()
    },

    removeKey: async (id) => {
      await window.api.accounts.saveProviderKey(id, null)
      await loadKeyHints()
    },

    remove: async (id) => {
      await window.api.accounts.saveProviderKey(id, null)
      replace(get().providers.filter((provider) => provider.id !== id))
      const launchersStore = useAgentLaunchersStore.getState()
      launchersStore.launchers
        .filter((launcher) => launcher.providerId === id)
        .forEach((launcher) => launchersStore.update(launcher.id, { providerId: null }))
      await loadKeyHints()
    }
  }
})

export function providerForCommand(command: string | null): CustomProvider | null {
  const providerId = providerIdForCommand(useAgentLaunchersStore.getState().launchers, command)
  return useCustomProvidersStore.getState().providers.find((provider) => provider.id === providerId) ?? null
}
