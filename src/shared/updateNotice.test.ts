import { describe, expect, it } from 'vitest'
import type { UpdateStatus } from './types'
import { readAnnouncedUpdates, updateNoticeFor } from './updateNotice'

function status(state: UpdateStatus['state'], latestVersion: string | null): UpdateStatus {
  return { state, currentVersion: '0.1.4', latestVersion, percent: 0, message: null }
}

describe('update notices', () => {
  it('announces a new version once, and again when it is downloaded', () => {
    expect(updateNoticeFor(status('available', '0.1.5'), {})).toMatchObject({
      kind: 'available',
      message: 'O-BROS 0.1.5 is available. You have 0.1.4.'
    })
    expect(updateNoticeFor(status('available', '0.1.5'), { available: '0.1.5' })).toBeNull()
    expect(updateNoticeFor(status('ready', '0.1.5'), { available: '0.1.5' })?.kind).toBe('ready')
    expect(updateNoticeFor(status('ready', '0.1.5'), { available: '0.1.5', ready: '0.1.5' })).toBeNull()
  })

  it('announces a newer version even after an older one was announced', () => {
    expect(updateNoticeFor(status('available', '0.1.6'), { available: '0.1.5' })?.version).toBe('0.1.6')
  })

  it('stays quiet when there is nothing new or the check failed', () => {
    expect(updateNoticeFor(status('upToDate', null), {})).toBeNull()
    expect(updateNoticeFor(status('failed', null), {})).toBeNull()
    expect(updateNoticeFor(null, {})).toBeNull()
  })

  it('reads saved announcements safely', () => {
    expect(readAnnouncedUpdates({ available: '0.1.5', ready: 3 })).toEqual({ available: '0.1.5', ready: undefined })
    expect(readAnnouncedUpdates('broken')).toEqual({})
  })
})
