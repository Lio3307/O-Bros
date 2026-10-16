import { programOf, type AgentLauncher } from '../../../shared/agentLaunchers'
import { agentHintsFrom, type AgentHints } from '../../../shared/agentTraces'
import { loadAcpRegistry } from '../agents/acpRegistryClient'
import { askInterface } from './rendererBridge'

const RUNTIME_PROGRAMS = ['node', 'npx', 'bun', 'bunx', 'deno', 'python', 'python3', 'py', 'uv', 'uvx', 'powershell', 'pwsh', 'bash', 'sh', 'zsh', 'cmd', 'wsl']

export interface AgentCatalog {
  programs: string[]
  hints: AgentHints
}

async function savedLaunchers(): Promise<AgentLauncher[]> {
  try {
    return await askInterface<AgentLauncher[]>({ kind: 'listLaunchers' })
  } catch {
    return []
  }
}

export async function loadAgentCatalog(): Promise<AgentCatalog> {
  const [launchers, registryAgents] = await Promise.all([savedLaunchers(), loadAcpRegistry()])
  const programs = [
    ...launchers.map((launcher) => programOf(launcher.command)),
    ...registryAgents.flatMap((agent) => agent.commands)
  ]
    .map((program) => program.toLowerCase())
    .filter((program) => program !== '' && !RUNTIME_PROGRAMS.includes(program))
  const names = [
    ...launchers.map((launcher) => launcher.name),
    ...registryAgents.map((agent) => agent.name),
    ...programs
  ]
  return { programs: Array.from(new Set(programs)), hints: agentHintsFrom(names) }
}
