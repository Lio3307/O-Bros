import { create } from 'zustand'
import type { TeamMember } from '../../shared/types'

interface TeamState {
  members: TeamMember[]
  selectedMemberId: string | null
  isInstalled: boolean
  refreshInstalled: () => Promise<void>
  setMembers: (members: TeamMember[]) => void
  select: (memberId: string) => void
}

function keptSelection(members: TeamMember[], selectedMemberId: string | null): string | null {
  if (members.some((member) => member.id === selectedMemberId)) {
    return selectedMemberId
  }
  return members.at(-1)?.id ?? null
}

export const useTeamStore = create<TeamState>()((set, get) => ({
  members: [],
  selectedMemberId: null,
  isInstalled: false,

  refreshInstalled: async () => {
    const isInstalled = await window.api.wot.isInstalled().catch(() => false)
    set({ isInstalled })
  },

  setMembers: (members) => set({ members, selectedMemberId: keptSelection(members, get().selectedMemberId) }),

  select: (selectedMemberId) => set({ selectedMemberId })
}))
