import { useEffect, useState } from 'react'
import type { AcpAgent } from '../../../../shared/acpRegistry'
import { useInstalledCommandsStore } from '../../../state/installedCommandsStore'

export interface AgentCatalog {
  commands: string[] | null
  registry: AcpAgent[]
  scan: () => void
}

export function useAgentCatalog(): AgentCatalog {
  const commands = useInstalledCommandsStore((state) => state.commands)
  const loadCommands = useInstalledCommandsStore((state) => state.load)
  const [registry, setRegistry] = useState<AcpAgent[]>([])

  function scan(): void {
    void loadCommands()
    window.api.agents
      .registry()
      .then(setRegistry)
      .catch(() => setRegistry([]))
  }

  useEffect(scan, [])
  return { commands, registry, scan }
}
