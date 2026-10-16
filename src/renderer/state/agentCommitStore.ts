import { create } from 'zustand'
import type { CommitIdentity } from '../../shared/commitIdentity'

const IDENTITY_KEY = 'o-bros.agentCommitIdentity'
const CO_AUTHORS_KEY = 'o-bros.allowAgentCoAuthors'

interface AgentCommitState {
  identity: CommitIdentity
  allowAgentCoAuthors: boolean
  setIdentity: (identity: CommitIdentity) => void
  setAllowAgentCoAuthors: (isAllowed: boolean) => void
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

function loadIdentity(): CommitIdentity {
  try {
    const parsed: unknown = JSON.parse(readStorage(IDENTITY_KEY) ?? '{}')
    const record = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {}
    return {
      name: typeof record.name === 'string' ? record.name : '',
      email: typeof record.email === 'string' ? record.email : ''
    }
  } catch {
    return { name: '', email: '' }
  }
}

export const useAgentCommitStore = create<AgentCommitState>()((set) => ({
  identity: loadIdentity(),
  allowAgentCoAuthors: readStorage(CO_AUTHORS_KEY) === 'true',

  setIdentity: (identity) => {
    writeStorage(IDENTITY_KEY, JSON.stringify(identity))
    set({ identity })
  },

  setAllowAgentCoAuthors: (allowAgentCoAuthors) => {
    writeStorage(CO_AUTHORS_KEY, String(allowAgentCoAuthors))
    set({ allowAgentCoAuthors })
  }
}))
