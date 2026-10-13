import { createReadStream } from 'node:fs'
import { readdir, readFile, stat } from 'node:fs/promises'
import { shell } from 'electron'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import type { DayRange } from '../../shared/time'
import type { SessionMessage, SessionSummary } from '../../shared/types'
import { isInsideDirectory } from '../pathGuard'
import { scanAccounts } from './accountScanner'
import { readDirectoryIfExists } from './fileSystem'

interface ContentBlock {
  type: string
  text?: string
}

interface TranscriptLine {
  type?: string
  cwd?: string
  message?: { content?: string | ContentBlock[] }
}

const TRANSCRIPT_EXTENSION = '.jsonl'
const MAX_LISTED_SESSIONS = 50
const MAX_TITLE_LENGTH = 80
const SYSTEM_TEXT_PREFIX = '<'

function parseTranscriptLine(line: string): TranscriptLine | null {
  try {
    return JSON.parse(line) as TranscriptLine
  } catch (error) {
    if (error instanceof SyntaxError) {
      return null
    }
    throw error
  }
}

function extractText(content: string | ContentBlock[] | undefined): string {
  if (content === undefined) {
    return ''
  }
  if (typeof content === 'string') {
    return content
  }
  return content
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('\n')
}

function isReadableUserText(text: string): boolean {
  return text.length > 0 && !text.startsWith(SYSTEM_TEXT_PREFIX)
}

async function readTitleAndProject(filePath: string): Promise<{ title: string; projectPath: string | null }> {
  const lines = createInterface({ input: createReadStream(filePath, 'utf8') })
  let projectPath: string | null = null

  for await (const rawLine of lines) {
    const line = parseTranscriptLine(rawLine)
    projectPath = projectPath ?? line?.cwd ?? null
    if (line?.type === 'user') {
      const text = extractText(line.message?.content).trim()
      if (isReadableUserText(text)) {
        lines.close()
        return { title: text.slice(0, MAX_TITLE_LENGTH), projectPath }
      }
    }
  }

  return { title: 'Untitled session', projectPath }
}

async function listTranscriptFiles(projectsDirectory: string): Promise<{ filePath: string; modifiedAt: number }[]> {
  const projectFolders = await readDirectoryIfExists(projectsDirectory)
  const files: { filePath: string; modifiedAt: number }[] = []

  for (const folder of projectFolders.filter((entry) => entry.isDirectory())) {
    const folderPath = join(projectsDirectory, folder.name)
    const names = await readdir(folderPath)
    for (const name of names.filter((fileName) => fileName.endsWith(TRANSCRIPT_EXTENSION))) {
      const filePath = join(folderPath, name)
      files.push({ filePath, modifiedAt: (await stat(filePath)).mtimeMs })
    }
  }

  return files
}

async function claudeProjectsDirectories(): Promise<string[]> {
  const accounts = await scanAccounts()
  return accounts
    .filter((account) => account.provider === 'claude')
    .map((account) => join(account.configDir, 'projects'))
}

function isInsideDayRange(timestamp: number, range: DayRange | null): boolean {
  return range === null || (timestamp >= range.start && timestamp < range.end)
}

export async function listClaudeSessions(range: DayRange | null): Promise<SessionSummary[]> {
  const directories = await claudeProjectsDirectories()
  const allFiles = (await Promise.all(directories.map(listTranscriptFiles))).flat()
  const matchingFiles = allFiles.filter((file) => isInsideDayRange(file.modifiedAt, range))
  const newestFiles = matchingFiles.sort((first, second) => second.modifiedAt - first.modifiedAt).slice(0, MAX_LISTED_SESSIONS)

  return Promise.all(
    newestFiles.map(async ({ filePath, modifiedAt }) => ({
      filePath,
      provider: 'claude' as const,
      lastActiveAt: modifiedAt,
      ...(await readTitleAndProject(filePath))
    }))
  )
}

export async function readClaudeSession(filePath: string): Promise<SessionMessage[]> {
  const directories = await claudeProjectsDirectories()
  if (!directories.some((directory) => isInsideDirectory(filePath, directory))) {
    throw new Error(`Not a known session file: ${filePath}`)
  }

  const content = await readFile(filePath, 'utf8')
  const messages: SessionMessage[] = []

  for (const rawLine of content.split('\n')) {
    const line = parseTranscriptLine(rawLine)
    if (line?.type !== 'user' && line?.type !== 'assistant') {
      continue
    }
    const text = extractText(line.message?.content).trim()
    if (text.length > 0) {
      messages.push({ role: line.type, text })
    }
  }

  return messages
}

export async function removeClaudeSessions(filePaths: string[]): Promise<number> {
  const directories = await claudeProjectsDirectories()

  for (const filePath of filePaths) {
    const isKnownTranscript =
      filePath.endsWith(TRANSCRIPT_EXTENSION) && directories.some((directory) => isInsideDirectory(filePath, directory))
    if (!isKnownTranscript) {
      throw new Error(`Not a known session file: ${filePath}`)
    }
  }

  for (const filePath of filePaths) {
    await shell.trashItem(filePath)
  }
  return filePaths.length
}
