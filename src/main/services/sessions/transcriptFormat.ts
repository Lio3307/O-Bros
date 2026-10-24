import type { ProviderId, SessionMessage } from '../../../shared/types'
import type { ReadMessages } from './transcriptLines'

export const TRANSCRIPT_EXTENSION = '.jsonl'
export const MAX_TITLE_LENGTH = 80
export const MAX_HEADER_LINES = 500

export interface TranscriptFile {
  filePath: string
  sizeBytes: number
  modifiedAt: number
}

export interface TranscriptHeader {
  sessionId: string
  title: string
  projectPath: string | null
}

export interface TranscriptFormat {
  provider: ProviderId
  transcriptsFolderName: string
  folderDepthToTranscripts: number
  readHeader: (filePath: string) => Promise<TranscriptHeader>
  readMessages: (filePath: string) => Promise<SessionMessage[]>
  readMessagesFrom: (filePath: string, startByte: number) => Promise<ReadMessages>
}
