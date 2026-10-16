import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { programOf } from '../../../shared/agentLaunchers'
import { parseAgentLogoIndex, type AgentLogo, type AgentLogoEntry } from '../../../shared/agentLogos'
import { loadAcpRegistry } from './acpRegistryClient'
import { loadAgentIcon } from './agentIcons'

const LOGO_FOLDER = join(__dirname, '../../resources/agents/logos')
const INDEX_PATH = join(LOGO_FOLDER, 'index.json')
const CURRENT_COLOR = 'currentColor'
const INTERFACE_TEXT_COLOR = '#EDEDED'

let indexLoad: Promise<Record<string, AgentLogoEntry>> | null = null
const logoLoads = new Map<string, Promise<AgentLogo | null>>()

function loadIndex(): Promise<Record<string, AgentLogoEntry>> {
  if (indexLoad === null) {
    indexLoad = readFile(INDEX_PATH, 'utf8')
      .then((text) => parseAgentLogoIndex(JSON.parse(text)))
      .catch(() => ({}))
  }
  return indexLoad
}

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`
}

async function bundledLogo(entry: AgentLogoEntry): Promise<AgentLogo | null> {
  try {
    const svg = await readFile(join(LOGO_FOLDER, entry.file), 'utf8')
    const shown = entry.style === 'color' ? svg.split(CURRENT_COLOR).join(INTERFACE_TEXT_COLOR) : svg
    return { dataUrl: svgDataUrl(shown), style: entry.style }
  } catch {
    return null
  }
}

async function registryLogo(program: string): Promise<AgentLogo | null> {
  const agent = (await loadAcpRegistry()).find((candidate) => candidate.commands.includes(program))
  if (agent === undefined) {
    return null
  }
  const icon = await loadAgentIcon(agent.id)
  return icon === null ? null : { dataUrl: icon, style: 'mono' }
}

async function resolveLogo(program: string): Promise<AgentLogo | null> {
  const entry = (await loadIndex())[program]
  const bundled = entry === undefined ? null : await bundledLogo(entry)
  return bundled ?? registryLogo(program)
}

export function loadAgentLogo(command: string): Promise<AgentLogo | null> {
  const program = programOf(command).toLowerCase()
  const existing = logoLoads.get(program)
  if (existing !== undefined) {
    return existing
  }
  const load = resolveLogo(program).then((logo) => {
    if (logo === null) {
      logoLoads.delete(program)
    }
    return logo
  })
  logoLoads.set(program, load)
  return load
}
