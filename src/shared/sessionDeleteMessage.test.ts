import { describe, expect, it } from 'vitest'
import { describeSessionDelete } from './sessionDeleteMessage'

describe('describeSessionDelete', () => {
  it('explains that trashed sessions can be restored and space is freed later', () => {
    const message = describeSessionDelete(3, 2048, false)

    expect(message.title).toBe('Delete 3 sessions?')
    expect(message.message).toContain('once the Recycle Bin or Trash is emptied')
    expect(message.confirmLabel).toBe('Move to Recycle Bin')
  })

  it('warns that a permanent delete cannot be undone', () => {
    const message = describeSessionDelete(1, 1024, true)

    expect(message.title).toBe('Delete 1 session?')
    expect(message.message).toContain('cannot be undone')
    expect(message.confirmLabel).toBe('Delete permanently')
  })
})
