import { create } from 'zustand'
import { choiceFor, type LanguageServerChoice, type LanguageServerChoices } from '../../shared/languageServers'

export const LANGUAGE_SERVERS_STORAGE_KEY = 'o-bros.languageServers'

interface LanguageServerState {
  choices: LanguageServerChoices
  setEnabled: (serverId: string, isEnabled: boolean) => void
  setCustomCommand: (serverId: string, command: string) => void
}

function isChoice(value: unknown): value is LanguageServerChoice {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const choice = value as Record<string, unknown>
  return typeof choice.isEnabled === 'boolean' && (choice.customCommand === null || typeof choice.customCommand === 'string')
}

export function readLanguageServerChoices(raw: unknown): LanguageServerChoices {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return {}
  }
  return Object.fromEntries(Object.entries(raw).filter((entry): entry is [string, LanguageServerChoice] => isChoice(entry[1])))
}

function loadChoices(): LanguageServerChoices {
  try {
    return readLanguageServerChoices(JSON.parse(localStorage.getItem(LANGUAGE_SERVERS_STORAGE_KEY) ?? 'null'))
  } catch {
    return {}
  }
}

export const useLanguageServerStore = create<LanguageServerState>()((set, get) => {
  function change(serverId: string, changes: Partial<LanguageServerChoice>): void {
    const choices = { ...get().choices, [serverId]: { ...choiceFor(get().choices, serverId), ...changes } }
    set({ choices })
    try {
      localStorage.setItem(LANGUAGE_SERVERS_STORAGE_KEY, JSON.stringify(choices))
    } catch {
      return
    }
  }

  return {
    choices: loadChoices(),
    setEnabled: (serverId, isEnabled) => change(serverId, { isEnabled }),
    setCustomCommand: (serverId, command) => change(serverId, { customCommand: command.trim() === '' ? null : command.trim() })
  }
})
