import type { UpdateStatus } from './types'

export type UpdateNoticeKind = 'available' | 'ready'

export interface UpdateNotice {
  kind: UpdateNoticeKind
  version: string
  message: string
}

export type AnnouncedUpdates = Partial<Record<UpdateNoticeKind, string>>

export function updateNoticeFor(status: UpdateStatus | null, announced: AnnouncedUpdates): UpdateNotice | null {
  if (status === null || status.latestVersion === null) {
    return null
  }
  const version = status.latestVersion
  if (status.state === 'available' && announced.available !== version) {
    return {
      kind: 'available',
      version,
      message: `O-BROS ${version} is available. You have ${status.currentVersion}.`
    }
  }
  if (status.state === 'ready' && announced.ready !== version) {
    return { kind: 'ready', version, message: `O-BROS ${version} is downloaded. Restart to finish the update.` }
  }
  return null
}

export function readAnnouncedUpdates(raw: unknown): AnnouncedUpdates {
  if (typeof raw !== 'object' || raw === null) {
    return {}
  }
  const record = raw as Record<string, unknown>
  return {
    available: typeof record.available === 'string' ? record.available : undefined,
    ready: typeof record.ready === 'string' ? record.ready : undefined
  }
}
