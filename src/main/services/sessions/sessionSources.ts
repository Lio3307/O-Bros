import { stat } from 'node:fs/promises'
import { join } from 'node:path'
import type { DetectedAccount, ProviderId } from '../../../shared/types'
import { isInsideDirectory } from '../../pathGuard'
import { scanAccounts } from '../accountScanner'
import { readDirectoryIfExists } from '../fileSystem'
import { claudeFormat } from './claudeFormat'
import { codexFormat } from './codexFormat'
import { TRANSCRIPT_EXTENSION, type TranscriptFile, type TranscriptFormat } from './transcriptFormat'

export interface SessionSource {
  format: TranscriptFormat
  account: DetectedAccount
  directory: string
}

export interface SourceFile extends TranscriptFile {
  source: SessionSource
}

const formatByProvider: Record<ProviderId, TranscriptFormat> = {
  claude: claudeFormat,
  codex: codexFormat
}

async function listTranscriptFiles(directoryPath: string, remainingDepth: number): Promise<TranscriptFile[]> {
  const entries = await readDirectoryIfExists(directoryPath)
  const nested = await Promise.all(
    entries.map(async (entry): Promise<TranscriptFile[]> => {
      const entryPath = join(directoryPath, entry.name)
      if (entry.isDirectory()) {
        return remainingDepth > 0 ? listTranscriptFiles(entryPath, remainingDepth - 1) : []
      }
      if (!entry.name.endsWith(TRANSCRIPT_EXTENSION)) {
        return []
      }
      const info = await stat(entryPath)
      return [{ filePath: entryPath, sizeBytes: info.size, modifiedAt: info.mtimeMs }]
    })
  )
  return nested.flat()
}

export function formatOf(provider: ProviderId): TranscriptFormat {
  return formatByProvider[provider]
}

export async function readSessionSources(): Promise<SessionSource[]> {
  const accounts = await scanAccounts()
  return accounts.map((account) => {
    const format = formatByProvider[account.provider]
    return { format, account, directory: join(account.configDir, format.transcriptsFolderName) }
  })
}

export async function listSourceFiles(sources: SessionSource[]): Promise<SourceFile[]> {
  const perSource = await Promise.all(
    sources.map(async (source) => {
      const files = await listTranscriptFiles(source.directory, source.format.folderDepthToTranscripts)
      return files.map((file) => ({ ...file, source }))
    })
  )
  return perSource.flat()
}

export function findSourceOf(sources: SessionSource[], filePath: string): SessionSource {
  const source = sources.find(
    (candidate) => filePath.endsWith(TRANSCRIPT_EXTENSION) && isInsideDirectory(filePath, candidate.directory)
  )
  if (source === undefined) {
    throw new Error(`Not a known session file: ${filePath}`)
  }
  return source
}
