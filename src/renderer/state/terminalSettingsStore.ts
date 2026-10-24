import { create } from 'zustand'
import { readAgentGitPolicy, type AgentGitPolicy } from '../../shared/agentGitPolicy'
import { readStored, writeStored } from './browserStorage'

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

function loadScrollback(): number {
  const saved = Number(readStored(SCROLLBACK_KEY))
  return SCROLLBACK_CHOICES.includes(saved) ? saved : DEFAULT_SCROLLBACK
}

export const useTerminalSettingsStore = create<TerminalSettingsState>()((set) => ({
  scrollback: loadScrollback(),
  notifyWhenFinished: readStored(NOTIFY_KEY) !== 'false',
  agentGitPolicy: readAgentGitPolicy(readStored(AGENT_GIT_KEY)),
  useGpuRendering: readStored(GPU_KEY) !== 'false',

  setScrollback: (scrollback) => {
    writeStored(SCROLLBACK_KEY, String(scrollback))
    set({ scrollback })
  },

  setNotifyWhenFinished: (notifyWhenFinished) => {
    writeStored(NOTIFY_KEY, String(notifyWhenFinished))
    set({ notifyWhenFinished })
  },

  setAgentGitPolicy: (agentGitPolicy) => {
    writeStored(AGENT_GIT_KEY, agentGitPolicy)
    set({ agentGitPolicy })
  },

  setUseGpuRendering: (useGpuRendering) => {
    writeStored(GPU_KEY, String(useGpuRendering))
    set({ useGpuRendering })
  }
}))
