import type { TranscriptFile, TranscriptHeader } from './transcriptFormat'

interface CachedHeader {
  modifiedAt: number
  sizeBytes: number
  header: TranscriptHeader
}

const headersByPath = new Map<string, CachedHeader>()

export async function readHeaderOf(file: TranscriptFile, readHeader: (filePath: string) => Promise<TranscriptHeader>): Promise<TranscriptHeader> {
  const cached = headersByPath.get(file.filePath)
  if (cached !== undefined && cached.modifiedAt === file.modifiedAt && cached.sizeBytes === file.sizeBytes) {
    return cached.header
  }
  const header = await readHeader(file.filePath)
  headersByPath.set(file.filePath, { modifiedAt: file.modifiedAt, sizeBytes: file.sizeBytes, header })
  return header
}

export function forgetHeadersExcept(files: TranscriptFile[]): void {
  const kept = new Set(files.map((file) => file.filePath))
  for (const filePath of headersByPath.keys()) {
    if (!kept.has(filePath)) {
      headersByPath.delete(filePath)
    }
  }
}
