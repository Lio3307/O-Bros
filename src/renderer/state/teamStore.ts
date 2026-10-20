import { create } from 'zustand'
import type { TeamMember } from '../../shared/types'

interface TeamState {
  members: TeamMember[]
  shownMemberId: string | null
  isInstalled: boolean
  refreshInstalled: () => Promise<void>
  setMembers: (members: TeamMember[]) => void
  showMember: (memberId: string) => void
  hideMember: () => void
}

function keptShownMember(members: TeamMember[], shownMemberId: string | null): string | null {
  return members.some((member) => member.id === shownMemberId) ? shownMemberId : null
}

export const useTeamStore = create<TeamState>()((set, get) => ({
  members: [],
  shownMemberId: null,
  isInstalled: false,

  refreshInstalled: async () => {
    const isInstalled = await window.api.wot.isInstalled().catch(() => false)
    set({ isInstalled })
  },

  setMembers: (members) => set({ members, shownMemberId: keptShownMember(members, get().shownMemberId) }),

  showMember: (shownMemberId) => set({ shownMemberId }),

  hideMember: () => set({ shownMemberId: null })
}))

export function membersOfTab(members: TeamMember[], paneIds: string[]): TeamMember[] {
  return members.filter((member) => paneIds.includes(member.summonedByPaneId))
}

export function memberToOpenFirst(members: TeamMember[]): TeamMember | null {
  return members.find((member) => member.state === 'waiting') ?? members.at(-1) ?? null
}
