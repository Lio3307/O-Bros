import { describe, expect, it, vi } from 'vitest'

type DataListener = (event: { id: string; chunk: string }) => void
type ExitListener = (event: { id: string; exitCode: number }) => void

async function loadRouter() {
  vi.resetModules()
  const listeners: { data: DataListener[]; exit: ExitListener[] } = { data: [], exit: [] }
  vi.stubGlobal('window', {
    api: {
      pty: {
        onData: (listener: DataListener) => listeners.data.push(listener),
        onExit: (listener: ExitListener) => listeners.exit.push(listener)
      }
    }
  })
  const { routePaneOutput } = await import('./ptyOutputRouter')
  return { routePaneOutput, listeners }
}

describe('routePaneOutput', () => {
  it('uses one listener for any number of panes and sends output to the right pane', async () => {
    const { routePaneOutput, listeners } = await loadRouter()
    const first = { onOutput: vi.fn(), onExit: vi.fn() }
    const second = { onOutput: vi.fn(), onExit: vi.fn() }
    routePaneOutput('a', first)
    routePaneOutput('b', second)

    expect(listeners.data).toHaveLength(1)
    expect(listeners.exit).toHaveLength(1)

    listeners.data[0]({ id: 'b', chunk: 'hello' })
    listeners.exit[0]({ id: 'a', exitCode: 0 })

    expect(second.onOutput).toHaveBeenCalledWith('hello')
    expect(first.onOutput).not.toHaveBeenCalled()
    expect(first.onExit).toHaveBeenCalledTimes(1)
  })

  it('stops delivering to a pane after it is released', async () => {
    const { routePaneOutput, listeners } = await loadRouter()
    const handlers = { onOutput: vi.fn(), onExit: vi.fn() }
    const release = routePaneOutput('a', handlers)
    release()

    listeners.data[0]({ id: 'a', chunk: 'late' })

    expect(handlers.onOutput).not.toHaveBeenCalled()
  })
})
