import { describe, expect, it } from 'vitest'
import { notificationKeyOf } from './agentNotifications'

describe('notificationKeyOf', () => {
  it('gives one key per turn, so a redraw after a tab switch cannot notify again', () => {
    expect(notificationKeyOf('done', 100)).toBe(notificationKeyOf('done', 100))
    expect(notificationKeyOf('done', 100)).not.toBe(notificationKeyOf('done', 200))
    expect(notificationKeyOf('asking', 100)).not.toBe(notificationKeyOf('done', 100))
  })

  it('never notifies while the agent works, starts or has not worked yet', () => {
    expect(notificationKeyOf('working', 100)).toBeNull()
    expect(notificationKeyOf('starting', 100)).toBeNull()
    expect(notificationKeyOf('ready', 100)).toBeNull()
  })
})
