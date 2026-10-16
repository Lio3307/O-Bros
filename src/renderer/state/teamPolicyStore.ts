import { create } from 'zustand'
import { normalizeTeamPolicy, type TeamPolicy } from '../../shared/teamPolicy'

const STORAGE_KEY = 'o-bros.teamPolicy'

interface TeamPolicyState {
  policy: TeamPolicy
  setPolicy: (changes: Partial<TeamPolicy>) => void
  sendToApp: () => void
}

function loadPolicy(): TeamPolicy {
  try {
    return normalizeTeamPolicy(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'))
  } catch {
    return normalizeTeamPolicy(null)
  }
}

function savePolicy(policy: TeamPolicy): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(policy))
  } catch {
    return
  }
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
