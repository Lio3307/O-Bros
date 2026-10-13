import { rm } from 'node:fs/promises'
import { shell } from 'electron'
import { isOlderThanDays } from '../../../shared/sessionStorage'
import type { ProviderId, RemoveSessionsResult } from '../../../shared/types'
import { findSourceOf, listSourceFiles, readSessionSources } from './sessionSources'

async function discardFile(filePath: string, permanently: boolean): Promise<void> {
  if (permanently) {
    await rm(filePath, { force: true })
    return
  }
  await shell.trashItem(filePath)
}

export async function removeSessions(filePaths: string[], permanently: boolean): Promise<number> {
  const sources = await readSessionSources()
  filePaths.forEach((filePath) => findSourceOf(sources, filePath))

  for (const filePath of filePaths) {
    await discardFile(filePath, permanently)
  }
  return filePaths.length
}

export async function removeSessionsOlderThan(
  provider: ProviderId,
  days: number | null,
  permanently: boolean
): Promise<RemoveSessionsResult> {
  const sources = (await readSessionSources()).filter((source) => source.format.provider === provider)
  const now = Date.now()
  const files = (await listSourceFiles(sources)).filter((file) => isOlderThanDays(file, days, now))

  for (const file of files) {
    await discardFile(file.filePath, permanently)
  }
  return { removedCount: files.length, freedBytes: files.reduce((total, file) => total + file.sizeBytes, 0) }
}
