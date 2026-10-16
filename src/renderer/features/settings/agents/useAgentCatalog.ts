import { useEffect } from 'react'
import type { AcpAgent } from '../../../../shared/acpRegistry'
import { useAgentCatalogStore } from '../../../state/agentCatalogStore'
import { useInstalledCommandsStore } from '../../../state/installedCommandsStore'

export interface AgentCatalog {
  commands: string[] | null
  registry: AcpAgent[]
  scan: () => Promise<void>
}

export function useAgentCatalog(): AgentCatalog {
  const commands = useInstalledCommandsStore((state) => state.commands)
  const loadCommands = useInstalledCommandsStore((state) => state.load)
  const registry = useAgentCatalogStore((state) => state.registry)
  const loadRegistry = useAgentCatalogStore((state) => state.load)

  async function scan(): Promise<void> {
    await Promise.all([loadCommands(), loadRegistry()])
  }

  useEffect(() => {
    void scan()
  }, [])
  return { commands, registry, scan }
}
