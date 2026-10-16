import { create } from 'zustand'
import { readAgentGitPolicy, type AgentGitPolicy } from '../../shared/agentGitPolicy'

export const SCROLLBACK_CHOICES = [1000, 2000, 5000, 10000]

const DEFAULT_SCROLLBACK = 2000
const SCROLLBACK_KEY = 'o-bros.terminalScrollback'
const NOTIFY_KEY = 'o-bros.notifyWhenFinished'
const AGENT_GIT_KEY = 'o-bros.agentGitPolicy'
const GPU_KEY = 'o-bros.terminalGpuRendering'

interface TerminalSettingsState {
  scrollback: number
  notifyWhenFinished: boolean
  agentGitPolicy: AgentGitPolicy
  useGpuRendering: boolean
  setScrollback: (lines: number) => void
  setNotifyWhenFinished: (isEnabled: boolean) => void
  setAgentGitPolicy: (policy: AgentGitPolicy) => void
  setUseGpuRendering: (isEnabled: boolean) => void
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    return
  }
}

function loadScrollback(): number {
  const saved = Number(readStorage(SCROLLBACK_KEY))
  return SCROLLBACK_CHOICES.includes(saved) ? saved : DEFAULT_SCROLLBACK
}

export const useTerminalSettingsStore = create<TerminalSettingsState>()((set) => ({
  scrollback: loadScrollback(),
  notifyWhenFinished: readStorage(NOTIFY_KEY) !== 'false',
  agentGitPolicy: readAgentGitPolicy(readStorage(AGENT_GIT_KEY)),
  useGpuRendering: readStorage(GPU_KEY) === 'true',

  setScrollback: (scrollback) => {
    writeStorage(SCROLLBACK_KEY, String(scrollback))
    set({ scrollback })
  },

  setNotifyWhenFinished: (notifyWhenFinished) => {
    writeStorage(NOTIFY_KEY, String(notifyWhenFinished))
    set({ notifyWhenFinished })
  },

  setAgentGitPolicy: (agentGitPolicy) => {
    writeStorage(AGENT_GIT_KEY, agentGitPolicy)
    set({ agentGitPolicy })
  },

  setUseGpuRendering: (useGpuRendering) => {
    writeStorage(GPU_KEY, String(useGpuRendering))
    set({ useGpuRendering })
  }
}))
