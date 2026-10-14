import { parseAcpRegistry } from '../../../shared/acpRegistry'
import type { AcpAgent } from '../../../shared/acpRegistry'
import { writeLog } from '../logging/logFile'

const REGISTRY_URL = 'https://cdn.agentclientprotocol.com/registry/v1/latest/registry.json'
const CACHE_MS = 60 * 60 * 1000
const TIMEOUT_MS = 8000

let cache: { loadedAt: number; agents: AcpAgent[] } | null = null

export async function loadAcpRegistry(): Promise<AcpAgent[]> {
  if (cache !== null && Date.now() - cache.loadedAt < CACHE_MS) {
    return cache.agents
  }
  try {
    const response = await fetch(REGISTRY_URL, { signal: AbortSignal.timeout(TIMEOUT_MS) })
    if (!response.ok) {
      throw new Error(`The registry answered ${response.status}`)
    }
    const agents = parseAcpRegistry(await response.json())
    cache = { loadedAt: Date.now(), agents }
    return agents
  } catch (error) {
    writeLog('warning', `Could not load the ACP agent registry: ${error instanceof Error ? error.message : 'unknown'}`)
    return cache?.agents ?? []
  }
}
