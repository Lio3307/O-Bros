import { basename } from 'node:path'
import type { SessionMessage } from '../../../shared/types'
import {
  MAX_HEADER_LINES,
  MAX_TITLE_LENGTH,
  TRANSCRIPT_EXTENSION,
  type TranscriptFormat,
  type TranscriptHeader
} from './transcriptFormat'
import { readMessagesFrom, readTranscriptLines } from './transcriptLines'
import { extractText, isReadableUserText, type ContentBlock } from './transcriptText'

interface ClaudeLine {
  type?: string
  cwd?: string
  message?: { content?: string | ContentBlock[] }
}

const TEXT_BLOCK_TYPES = ['text']
const IGNORED_USER_PREFIXES = ['<']

async function readHeader(filePath: string): Promise<TranscriptHeader> {
  const sessionId = basename(filePath, TRANSCRIPT_EXTENSION)
  let projectPath: string | null = null

  for await (const line of readTranscriptLines<ClaudeLine>(filePath, MAX_HEADER_LINES)) {
    projectPath = projectPath ?? line.cwd ?? null
    if (line.type === 'user') {
      const text = extractText(line.message?.content, TEXT_BLOCK_TYPES).trim()
      if (isReadableUserText(text, IGNORED_USER_PREFIXES)) {
        return { sessionId, title: text.slice(0, MAX_TITLE_LENGTH), projectPath }
      }
    }
  }

  return { sessionId, title: 'Untitled session', projectPath }
}

function messageOf(line: ClaudeLine): SessionMessage | null {
  if (line.type !== 'user' && line.type !== 'assistant') {
    return null
  }
  const text = extractText(line.message?.content, TEXT_BLOCK_TYPES).trim()
  return text.length > 0 ? { role: line.type, text } : null
}

function readMessagesFromByte(filePath: string, startByte: number) {
  return readMessagesFrom(filePath, startByte, messageOf)
}

async function readMessages(filePath: string): Promise<SessionMessage[]> {
  return (await readMessagesFromByte(filePath, 0)).messages
}

export const claudeFormat: TranscriptFormat = {
  provider: 'claude',
  transcriptsFolderName: 'projects',
  folderDepthToTranscripts: 1,
  readHeader,
  readMessages,
  readMessagesFrom: readMessagesFromByte
}
