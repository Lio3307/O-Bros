import { create } from 'zustand'
import type { AcpAgent } from '../../shared/acpRegistry'
import { programOf } from '../../shared/agentLaunchers'
import type { AgentLogo } from '../../shared/agentLogos'

interface AgentCatalogState {
  registry: AcpAgent[]
  logoByProgram: Record<string, AgentLogo | null>
  load: () => Promise<void>
  loadLogo: (command: string) => Promise<void>
}

const requestedPrograms = new Set<string>()

export function programKeyOf(command: string): string {
  return programOf(command).toLowerCase()
}

export const useAgentCatalogStore = create<AgentCatalogState>()((set) => ({
  registry: [],
  logoByProgram: {},

  load: async () => {
    try {
      set({ registry: await window.api.agents.registry() })
    } catch {
      return
    }
  },

  loadLogo: async (command) => {
    const program = programKeyOf(command)
    if (program === '' || requestedPrograms.has(program)) {
      return
    }
    requestedPrograms.add(program)
    const logo = await window.api.agents.logo(program).catch(() => null)
    if (logo === null) {
      requestedPrograms.delete(program)
    }
    set((state) => ({ logoByProgram: { ...state.logoByProgram, [program]: logo } }))
  }
}))
