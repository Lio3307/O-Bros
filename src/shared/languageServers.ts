import { isRecord } from './isRecord'
export interface LanguageServerDefinition {
  id: string
  title: string
  languages: string[]
  command: string
  args: string[]
  projectLocal: boolean
  install: string
  initializationOptions: Record<string, unknown> | null
}

export type LanguageServerSource = 'project' | 'path' | 'custom'

export interface LanguageServerStatus extends LanguageServerDefinition {
  source: LanguageServerSource | null
  resolvedPath: string | null
}

export interface LanguageServerChoice {
  isEnabled: boolean
  customCommand: string | null
}

export type LanguageServerChoices = Record<string, LanguageServerChoice>

export interface LanguageServerStartRequest {
  filePath: string
  languageId: string
  choices: LanguageServerChoices
}

export interface LanguageServerSession {
  sessionId: string
  serverId: string
  serverTitle: string
  rootUri: string
  initializationOptions: Record<string, unknown> | null
}

export interface RunningLanguageServer {
  sessionId: string
  serverTitle: string
  rootPath: string
  openFiles: number
}

export const DEFAULT_CHOICE: LanguageServerChoice = { isEnabled: true, customCommand: null }

const LANGUAGE_ID_BY_EXTENSION: Record<string, string> = {
  tsx: 'typescriptreact',
  jsx: 'javascriptreact',
  c: 'c',
  h: 'c'
}

function isTextList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

export function parseLanguageServers(raw: unknown): LanguageServerDefinition[] {
  if (!isRecord(raw) || !Array.isArray(raw.servers)) {
    return []
  }
  return raw.servers.flatMap((entry): LanguageServerDefinition[] => {
    if (
      !isRecord(entry) ||
      typeof entry.id !== 'string' ||
      typeof entry.title !== 'string' ||
      typeof entry.command !== 'string' ||
      entry.command.trim() === '' ||
      !isTextList(entry.languages) ||
      !isTextList(entry.args)
    ) {
      return []
    }
    return [
      {
        id: entry.id,
        title: entry.title,
        languages: entry.languages,
        command: entry.command,
        args: entry.args,
        projectLocal: entry.projectLocal === true,
        install: typeof entry.install === 'string' ? entry.install : '',
        initializationOptions: isRecord(entry.initializationOptions) ? entry.initializationOptions : null
      }
    ]
  })
}

export function choiceFor(choices: LanguageServerChoices, serverId: string): LanguageServerChoice {
  return choices[serverId] ?? DEFAULT_CHOICE
}

export function lspLanguageIdOf(filePath: string, languageId: string): string {
  const dot = filePath.lastIndexOf('.')
  const extension = dot < 0 ? '' : filePath.slice(dot + 1).toLowerCase()
  return LANGUAGE_ID_BY_EXTENSION[extension] ?? languageId
}

export function splitCommandLine(text: string): string[] {
  const parts: string[] = []
  let current = ''
  let quote: string | null = null
  let hasPart = false
  for (const character of text.trim()) {
    if (quote !== null) {
      if (character === quote) {
        quote = null
      } else {
        current += character
      }
      continue
    }
    if (character === '"' || character === "'") {
      quote = character
      hasPart = true
      continue
    }
    if (character === ' ' || character === '\t') {
      if (hasPart) {
        parts.push(current)
      }
      current = ''
      hasPart = false
      continue
    }
    current += character
    hasPart = true
  }
  if (hasPart) {
    parts.push(current)
  }
  return parts
}

export function pickServerFor(languageId: string, statuses: LanguageServerStatus[], choices: LanguageServerChoices): LanguageServerStatus | null {
  return (
    statuses.find(
      (status) => status.languages.includes(languageId) && choiceFor(choices, status.id).isEnabled && status.source !== null
    ) ?? null
  )
}
