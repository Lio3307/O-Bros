import { access, rm, stat } from 'node:fs/promises'
import { shell } from 'electron'
import { describeRemovalFailure } from '../../../shared/sessionRemovalResult'
import { isOlderThanDays } from '../../../shared/sessionStorage'
import type { ProviderId, RemoveSessionsResult } from '../../../shared/types'
import { writeLog } from '../logging/logFile'
import { findSourceOf, listSourceFiles, readSessionSources } from './sessionSources'

interface FileToRemove {
  filePath: string
  sizeBytes: number
}

async function stillExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function discardFile(filePath: string, permanently: boolean): Promise<void> {
  if (permanently) {
    await rm(filePath, { force: true })
  } else {
    await shell.trashItem(filePath)
  }
  if (await stillExists(filePath)) {
    throw Object.assign(new Error('The file is still there after deleting it.'), { code: 'STILL_THERE' })
  }
}

function errorCodeOf(error: unknown): string {
  const code = (error as NodeJS.ErrnoException | undefined)?.code
  return typeof code === 'string' ? code : error instanceof Error ? error.message : 'unknown'
}

async function discardAll(files: FileToRemove[], permanently: boolean): Promise<RemoveSessionsResult> {
  let removedCount = 0
  let freedBytes = 0
  const failureCodes: string[] = []
  for (const file of files) {
    try {
      await discardFile(file.filePath, permanently)
      removedCount += 1
      freedBytes += file.sizeBytes
    } catch (error) {
      failureCodes.push(errorCodeOf(error))
      writeLog('warning', `Could not delete a session file (${errorCodeOf(error)}): ${file.filePath}`)
    }
  }
  return {
    removedCount,
    freedBytes,
    failedCount: failureCodes.length,
    failureReason: failureCodes.length === 0 ? null : describeRemovalFailure(failureCodes)
  }
}

async function sizeOf(filePath: string): Promise<number> {
  try {
    return (await stat(filePath)).size
  } catch {
    return 0
  }
}

export async function removeSessions(filePaths: string[], permanently: boolean): Promise<RemoveSessionsResult> {
  const sources = await readSessionSources()
  filePaths.forEach((filePath) => findSourceOf(sources, filePath))
  const files = await Promise.all(filePaths.map(async (filePath) => ({ filePath, sizeBytes: await sizeOf(filePath) })))
  return discardAll(files, permanently)
}

export async function removeSessionsOlderThan(
  provider: ProviderId,
  days: number | null,
  permanently: boolean
): Promise<RemoveSessionsResult> {
  const sources = (await readSessionSources()).filter((source) => source.format.provider === provider)
  const now = Date.now()
  const files = (await listSourceFiles(sources)).filter((file) => isOlderThanDays(file, days, now))
  return discardAll(files, permanently)
}
