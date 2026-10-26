import { create } from 'zustand'
import type { AgentStatus } from '../../shared/agentStatus'

interface AgentStatusState {
  statuses: Record<string, AgentStatus>
  setStatuses: (statuses: Record<string, AgentStatus>) => void
}

export const useAgentStatusStore = create<AgentStatusState>()((set) => ({
  statuses: {},
  setStatuses: (statuses) => set({ statuses })
}))
