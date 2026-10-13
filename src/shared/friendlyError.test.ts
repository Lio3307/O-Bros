import { describe, expect, it } from 'vitest'
import { friendlyErrorMessage } from './friendlyError'

describe('friendlyErrorMessage', () => {
  it('translates a system error code hidden inside an IPC message', () => {
    const error = new Error("Error invoking remote method 'fs:create': Error: EEXIST: file already exists, open 'C:\\a'")
    expect(friendlyErrorMessage(error)).toBe('A file or folder with that name already exists.')
  })

  it('translates the app own messages', () => {
    const error = new Error('Path is outside the opened project folders: C:\\x')
    expect(friendlyErrorMessage(error)).toBe('That location is outside your project folders.')
  })

  it('never shows an unknown raw message', () => {
    const error = new Error('SQLITE_CORRUPT at 0xDEADBEEF')
    expect(friendlyErrorMessage(error, 'Could not save the file.')).toBe('Could not save the file.')
  })

  it('uses the generic fallback for non-errors', () => {
    expect(friendlyErrorMessage(42)).toBe('Something went wrong. Please try again.')
  })
})
