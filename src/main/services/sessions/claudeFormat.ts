import { basename } from 'node:path'
import type { SessionMessage } from '../../../shared/types'
import {
  MAX_HEADER_LINES,
  MAX_TITLE_LENGTH,
  TRANSCRIPT_EXTENSION,
  type TranscriptFormat,
  type TranscriptHeader
} from './transcriptFormat'
import { readTranscriptLines } from './transcriptLines'
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

async function readMessages(filePath: string): Promise<SessionMessage[]> {
  const messages: SessionMessage[] = []

  for await (const line of readTranscriptLines<ClaudeLine>(filePath)) {
    if (line.type !== 'user' && line.type !== 'assistant') {
      continue
    }
    const text = extractText(line.message?.content, TEXT_BLOCK_TYPES).trim()
    if (text.length > 0) {
      messages.push({ role: line.type, text })
    }
  }

  return messages
}

export const claudeFormat: TranscriptFormat = {
  provider: 'claude',
  transcriptsFolderName: 'projects',
  folderDepthToTranscripts: 1,
  readHeader,
  readMessages
}
