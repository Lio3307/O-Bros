export type AgentLogoStyle = 'color' | 'mono'

export interface AgentLogo {
  dataUrl: string
  style: AgentLogoStyle
}

export interface AgentLogoEntry {
  file: string
  style: AgentLogoStyle
}

const LOGO_EXTENSION = '.svg'
const FORBIDDEN_FILE_PARTS = ['/', '\\', '..']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSafeFileName(file: string): boolean {
  return file.endsWith(LOGO_EXTENSION) && !FORBIDDEN_FILE_PARTS.some((part) => file.includes(part))
}

export function parseAgentLogoIndex(raw: unknown): Record<string, AgentLogoEntry> {
  if (!isRecord(raw) || !isRecord(raw.logos)) {
    return {}
  }
  const entries: Record<string, AgentLogoEntry> = {}
  for (const [program, value] of Object.entries(raw.logos)) {
    if (!isRecord(value) || typeof value.file !== 'string' || !isSafeFileName(value.file)) {
      continue
    }
    entries[program.toLowerCase()] = { file: value.file, style: value.style === 'color' ? 'color' : 'mono' }
  }
  return entries
}
