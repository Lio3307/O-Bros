import { create } from 'zustand'
import {
  DEFAULT_AGENT_LAUNCHERS,
  parseAgentLaunchers,
  parseShownIds,
  toggleShownId,
  type AgentLauncher
} from '../../shared/agentLaunchers'

const LAUNCHERS_KEY = 'o-bros.agentLaunchers'
const SHOWN_KEY = 'o-bros.shownAgents'

interface AgentLaunchersState {
  launchers: AgentLauncher[]
  shownIds: string[]
  add: (name: string, command: string) => void
  update: (id: string, changes: Partial<Omit<AgentLauncher, 'id'>>) => void
  remove: (id: string) => void
  toggleShown: (id: string) => void
  reset: () => void
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    return
  }
}

export const useAgentLaunchersStore = create<AgentLaunchersState>()((set, get) => {
  const savedLaunchers = parseAgentLaunchers(readStorage(LAUNCHERS_KEY)) ?? DEFAULT_AGENT_LAUNCHERS

  function replace(launchers: AgentLauncher[], shownIds: string[]): void {
    writeStorage(LAUNCHERS_KEY, launchers)
    writeStorage(SHOWN_KEY, shownIds)
    set({ launchers, shownIds })
  }

  return {
    launchers: savedLaunchers,
    shownIds: parseShownIds(readStorage(SHOWN_KEY), savedLaunchers),

    add: (name, command) => {
      replace([...get().launchers, { id: crypto.randomUUID(), name, command }], get().shownIds)
    },

    update: (id, changes) => {
      const launchers = get().launchers.map((launcher) => (launcher.id === id ? { ...launcher, ...changes } : launcher))
      replace(launchers, get().shownIds)
    },

    remove: (id) => {
      replace(
        get().launchers.filter((launcher) => launcher.id !== id),
        get().shownIds.filter((shownId) => shownId !== id)
      )
    },

    toggleShown: (id) => replace(get().launchers, toggleShownId(get().shownIds, id)),

    reset: () => replace(DEFAULT_AGENT_LAUNCHERS, [])
  }
})
