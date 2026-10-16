import { app } from 'electron'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseAcpRegistry, parseCommandAliases, type AcpAgent, type CommandAliases } from '../../../shared/acpRegistry'
import { writeLog } from '../logging/logFile'

const REGISTRY_URL = 'https://cdn.agentclientprotocol.com/registry/v1/latest/registry.json'
const MEMORY_CACHE_MS = 60 * 60 * 1000
const TIMEOUT_MS = 8000
const AGENTS_DATA_FOLDER = join(__dirname, '../../resources/agents')
const SNAPSHOT_PATH = join(AGENTS_DATA_FOLDER, 'acp-registry-snapshot.json')
const ALIASES_PATH = join(AGENTS_DATA_FOLDER, 'cli-commands.json')
const CACHE_FILE_NAME = 'acp-registry.json'

let memoryCache: { loadedAt: number; agents: AcpAgent[] } | null = null
let aliasesLoad: Promise<CommandAliases> | null = null
let inFlight: Promise<AcpAgent[]> | null = null

function cacheFilePath(): string {
  return join(app.getPath('userData'), CACHE_FILE_NAME)
}

async function readJson(filePath: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'))
  } catch {
    return null
  }
}

function loadAliases(): Promise<CommandAliases> {
  if (aliasesLoad === null) {
    aliasesLoad = readJson(ALIASES_PATH).then(parseCommandAliases)
  }
  return aliasesLoad
}

async function fetchRegistry(): Promise<unknown> {
  const response = await fetch(REGISTRY_URL, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!response.ok) {
    throw new Error(`The registry answered ${response.status}`)
  }
  const raw: unknown = await response.json()
  await writeFile(cacheFilePath(), JSON.stringify(raw)).catch(() => undefined)
  return raw
}

async function offlineRegistry(aliases: CommandAliases): Promise<AcpAgent[]> {
  const cached = parseAcpRegistry(await readJson(cacheFilePath()), aliases)
  return cached.length > 0 ? cached : parseAcpRegistry(await readJson(SNAPSHOT_PATH), aliases)
}

async function refreshRegistry(): Promise<AcpAgent[]> {
  const aliases = await loadAliases()
  try {
    const agents = parseAcpRegistry(await fetchRegistry(), aliases)
    if (agents.length > 0) {
      return agents
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown'
    writeLog('warning', `Could not load the ACP agent registry, using the saved copy: ${reason}`)
  }
  return memoryCache?.agents ?? offlineRegistry(aliases)
}

export function loadAcpRegistry(): Promise<AcpAgent[]> {
  if (memoryCache !== null && Date.now() - memoryCache.loadedAt < MEMORY_CACHE_MS) {
    return Promise.resolve(memoryCache.agents)
  }
  if (inFlight === null) {
    inFlight = refreshRegistry()
      .then((agents) => {
        memoryCache = { loadedAt: Date.now(), agents }
        return agents
      })
      .finally(() => {
        inFlight = null
      })
  }
  return inFlight
}
