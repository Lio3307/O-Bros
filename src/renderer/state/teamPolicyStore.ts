import { create } from 'zustand'
import { normalizeTeamPolicy, type TeamPolicy } from '../../shared/teamPolicy'
import { readStoredJson, writeStoredJson } from './browserStorage'

const STORAGE_KEY = 'o-bros.teamPolicy'

interface TeamPolicyState {
  policy: TeamPolicy
  setPolicy: (changes: Partial<TeamPolicy>) => void
  sendToApp: () => void
}

function loadPolicy(): TeamPolicy {
  return normalizeTeamPolicy(readStoredJson(STORAGE_KEY))
}

function savePolicy(policy: TeamPolicy): void {
  writeStoredJson(STORAGE_KEY, policy)
}

export const useTeamPolicyStore = create<TeamPolicyState>()((set, get) => ({
  policy: loadPolicy(),

  setPolicy: (changes) => {
    const policy = { ...get().policy, ...changes }
    savePolicy(policy)
    set({ policy })
    get().sendToApp()
  },

  sendToApp: () => {
    void window.api.wot.setPolicy(get().policy).catch(() => undefined)
  }
}))
