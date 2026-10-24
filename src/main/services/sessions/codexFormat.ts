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

interface CodexLine {
  type?: string
  payload?: {
    id?: string
    cwd?: string
    type?: string
    role?: string
    content?: string | ContentBlock[]
  }
}

const TEXT_BLOCK_TYPES = ['input_text', 'output_text']
const IGNORED_USER_PREFIXES = ['<', '# AGENTS.md']

function readableMessage(line: CodexLine): SessionMessage | null {
  const payload = line.payload
  const isConversationMessage = line.type === 'response_item' && payload?.type === 'message'
  if (!isConversationMessage || (payload.role !== 'user' && payload.role !== 'assistant')) {
    return null
  }
  const text = extractText(payload.content, TEXT_BLOCK_TYPES).trim()
  if (payload.role === 'user' && !isReadableUserText(text, IGNORED_USER_PREFIXES)) {
    return null
  }
  return text.length > 0 ? { role: payload.role, text } : null
}

async function readHeader(filePath: string): Promise<TranscriptHeader> {
  let sessionId = basename(filePath, TRANSCRIPT_EXTENSION)
  let projectPath: string | null = null

  for await (const line of readTranscriptLines<CodexLine>(filePath, MAX_HEADER_LINES)) {
    if (line.type === 'session_meta') {
      sessionId = line.payload?.id ?? sessionId
      projectPath = line.payload?.cwd ?? null
    }
    const message = readableMessage(line)
    if (message?.role === 'user') {
      return { sessionId, title: message.text.slice(0, MAX_TITLE_LENGTH), projectPath }
    }
  }

  return { sessionId, title: 'Untitled session', projectPath }
}

function readMessagesFromByte(filePath: string, startByte: number) {
  return readMessagesFrom(filePath, startByte, readableMessage)
}

async function readMessages(filePath: string): Promise<SessionMessage[]> {
  return (await readMessagesFromByte(filePath, 0)).messages
}

export const codexFormat: TranscriptFormat = {
  provider: 'codex',
  transcriptsFolderName: 'sessions',
  folderDepthToTranscripts: 3,
  readHeader,
  readMessages,
  readMessagesFrom: readMessagesFromByte
}
