import { create } from 'zustand'
import type { CommitIdentity } from '../../shared/commitIdentity'
import { isRecord } from '../../shared/isRecord'
import { readStored, readStoredJson, writeStored } from './browserStorage'

const IDENTITY_KEY = 'o-bros.agentCommitIdentity'
const CO_AUTHORS_KEY = 'o-bros.allowAgentCoAuthors'

interface AgentCommitState {
  identity: CommitIdentity
  allowAgentCoAuthors: boolean
  setIdentity: (identity: CommitIdentity) => void
  setAllowAgentCoAuthors: (isAllowed: boolean) => void
}

function loadIdentity(): CommitIdentity {
  const parsed = readStoredJson(IDENTITY_KEY)
  const record = isRecord(parsed) ? parsed : {}
  return {
    name: typeof record.name === 'string' ? record.name : '',
    email: typeof record.email === 'string' ? record.email : ''
  }
}

export const useAgentCommitStore = create<AgentCommitState>()((set) => ({
  identity: loadIdentity(),
  allowAgentCoAuthors: readStored(CO_AUTHORS_KEY) === 'true',

  setIdentity: (identity) => {
    writeStored(IDENTITY_KEY, JSON.stringify(identity))
    set({ identity })
  },

  setAllowAgentCoAuthors: (allowAgentCoAuthors) => {
    writeStored(CO_AUTHORS_KEY, String(allowAgentCoAuthors))
    set({ allowAgentCoAuthors })
  }
}))
