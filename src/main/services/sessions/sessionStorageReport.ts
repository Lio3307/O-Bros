import { summarizeSessionFiles } from '../../../shared/sessionStorage'
import type { ProviderId, SessionStorageReport } from '../../../shared/types'
import { listSourceFiles, readSessionSources } from './sessionSources'

const PROVIDERS: ProviderId[] = ['claude', 'codex']

export async function readSessionStorageReports(): Promise<SessionStorageReport[]> {
  const sources = await readSessionSources()
  const files = await listSourceFiles(sources)
  const now = Date.now()

  return PROVIDERS.map((provider) => ({
    provider,
    ...summarizeSessionFiles(
      files.filter((file) => file.source.format.provider === provider),
      now
    )
  }))
}
