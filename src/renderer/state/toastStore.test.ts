import { afterEach, describe, expect, it, vi } from 'vitest'
import { toast, useToastStore } from './toastStore'

describe('toasts', () => {
  afterEach(() => {
    useToastStore.setState({ toasts: [] })
    vi.useRealTimers()
  })

  it('does not show the same notice twice while it is on screen', () => {
    vi.useFakeTimers()
    const action = { label: 'Update all', run: () => undefined }
    toast.info('The wot skill has an update.', action)
    toast.info('The wot skill has an update.', action)
    toast.info('A different notice.')
    expect(useToastStore.getState().toasts.map((item) => item.message)).toEqual([
      'The wot skill has an update.',
      'A different notice.'
    ])
  })

  it('keeps a notice with a button until it is closed', () => {
    vi.useFakeTimers()
    toast.info('Stays', { label: 'Do it', run: () => undefined })
    toast.success('Goes away')
    vi.advanceTimersByTime(60_000)
    expect(useToastStore.getState().toasts.map((item) => item.message)).toEqual(['Stays'])
  })
})
