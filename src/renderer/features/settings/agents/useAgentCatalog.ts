import { useEffect, useState } from 'react'
import type { AcpAgent } from '../../../../shared/acpRegistry'
import { useInstalledCommandsStore } from '../../../state/installedCommandsStore'

export interface AgentCatalog {
  commands: string[] | null
  registry: AcpAgent[]
  scan: () => Promise<void>
}

export function useAgentCatalog(): AgentCatalog {
  const commands = useInstalledCommandsStore((state) => state.commands)
  const loadCommands = useInstalledCommandsStore((state) => state.load)
  const [registry, setRegistry] = useState<AcpAgent[]>([])

  async function scan(): Promise<void> {
    const registryLoad = window.api.agents
      .registry()
      .then(setRegistry)
      .catch(() => setRegistry([]))
    await Promise.all([loadCommands(), registryLoad])
  }

  useEffect(() => {
    void scan()
  }, [])
  return { commands, registry, scan }
}
