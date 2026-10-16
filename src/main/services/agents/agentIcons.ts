import { app } from 'electron'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { loadAcpRegistry } from './acpRegistryClient'

const ICON_HOST = 'cdn.agentclientprotocol.com'
const ICON_FOLDER_NAME = 'agent-icons'
const MAX_ICON_BYTES = 64 * 1024
const TIMEOUT_MS = 8000
const SVG_MARK = '<svg'

const iconLoads = new Map<string, Promise<string | null>>()

function safeFileName(agentId: string): string {
  const allowed = agentId
    .toLowerCase()
    .split('')
    .filter((character) => (character >= 'a' && character <= 'z') || (character >= '0' && character <= '9') || character === '-' || character === '_')
    .join('')
  return `${allowed || 'agent'}.svg`
}

function isTrustedIconUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && parsed.hostname === ICON_HOST
  } catch {
    return false
  }
}

function toDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`
}

async function downloadIcon(url: string): Promise<string | null> {
  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!response.ok) {
    return null
  }
  const svg = await response.text()
  return svg.length <= MAX_ICON_BYTES && svg.includes(SVG_MARK) ? svg : null
}

async function readOrDownloadIcon(agentId: string): Promise<string | null> {
  const agent = (await loadAcpRegistry()).find((candidate) => candidate.id === agentId)
  if (agent === undefined || agent.iconUrl === null || !isTrustedIconUrl(agent.iconUrl)) {
    return null
  }
  const folder = join(app.getPath('userData'), ICON_FOLDER_NAME)
  const filePath = join(folder, safeFileName(agentId))
  const saved = await readFile(filePath, 'utf8').catch(() => null)
  if (saved !== null && saved.includes(SVG_MARK)) {
    return toDataUrl(saved)
  }
  const downloaded = await downloadIcon(agent.iconUrl).catch(() => null)
  if (downloaded === null) {
    return null
  }
  await mkdir(folder, { recursive: true })
  await writeFile(filePath, downloaded).catch(() => undefined)
  return toDataUrl(downloaded)
}

export function loadAgentIcon(agentId: string): Promise<string | null> {
  const existing = iconLoads.get(agentId)
  if (existing !== undefined) {
    return existing
  }
  const load = readOrDownloadIcon(agentId).then((icon) => {
    if (icon === null) {
      iconLoads.delete(agentId)
    }
    return icon
  })
  iconLoads.set(agentId, load)
  return load
}
