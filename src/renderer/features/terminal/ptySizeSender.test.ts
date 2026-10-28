import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./agentStatusTracking', () => ({ noteAgentResize: vi.fn() }))

async function loadSender() {
  vi.resetModules()
  const resize = vi.fn()
  vi.stubGlobal('window', { api: { pty: { resize } } })
  const sender = await import('./ptySizeSender')
  return { ...sender, resize }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('sendPtySize', () => {
  it('sends a size at once, skips repeats, and during a drag sends only the last size once it settles', async () => {
    vi.useFakeTimers()
    const { sendPtySize, resize } = await loadSender()
    sendPtySize('a', 80, 24)
    sendPtySize('a', 80, 24)
    expect(resize).toHaveBeenCalledTimes(1)

    sendPtySize('a', 90, 24)
    sendPtySize('a', 100, 30)
    sendPtySize('a', 110, 32)
    expect(resize).toHaveBeenCalledTimes(1)
    vi.runAllTimers()
    expect(resize).toHaveBeenCalledTimes(2)
    expect(resize).toHaveBeenLastCalledWith('a', 110, 32)

    vi.advanceTimersByTime(1000)
    sendPtySize('a', 70, 20)
    expect(resize).toHaveBeenCalledTimes(3)
  })

  it('sends again at once after the pane is forgotten, and a forgotten pane sends nothing late', async () => {
    vi.useFakeTimers()
    const { sendPtySize, forgetPtySize, resize } = await loadSender()
    sendPtySize('a', 80, 24)
    sendPtySize('a', 120, 40)
    forgetPtySize('a')
    vi.runAllTimers()
    expect(resize).toHaveBeenCalledTimes(1)

    sendPtySize('a', 80, 24)
    expect(resize).toHaveBeenCalledTimes(2)
  })
})
