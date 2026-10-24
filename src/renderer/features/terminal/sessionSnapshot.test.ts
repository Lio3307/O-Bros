import { describe, expect, it } from 'vitest'
import type { TerminalTab, WorkspaceTab } from '../../state/workspaceStore'
import { parseSession, serializeSession } from './sessionSnapshot'

const terminalTab: TerminalTab = {
  kind: 'terminal',
  id: 'tab-1',
  title: 'api',
  cwd: 'E:/work/api',
  createdAt: 1,
  layout: {
    kind: 'split',
    direction: 'horizontal',
    first: { kind: 'pane', paneId: 'pane-1' },
    second: { kind: 'pane', paneId: 'pane-2' }
  },
  panes: {
    'pane-1': {
      id: 'pane-1',
      title: 'api',
      cwd: 'E:/work/api',
      account: { provider: 'claude', configDir: 'C:/Users/me/.claude' },
      startCommand: 'claude',
      agentCommand: 'claude',
      isAgentRunning: true
    },
    'pane-2': { id: 'pane-2', title: 'Terminal 2', cwd: 'E:/work/api', account: null, startCommand: null, agentCommand: null, isAgentRunning: false }
  },
  focusedPaneId: 'pane-2'
}

const fileTab: WorkspaceTab = { kind: 'file', id: 'tab-2', title: 'a.ts', path: 'E:/work/api/a.ts', isModified: true }

describe('session snapshot', () => {
  it('restores tabs and layout but never restarts a CLI or keeps unsaved marks', () => {
    const raw = serializeSession({ tabs: [terminalTab, fileTab], activeTabId: 'tab-2' })
    const restored = parseSession(raw)

    expect(restored?.activeTabId).toBe('tab-2')
    const restoredTerminal = restored?.tabs[0]
    expect(restoredTerminal?.kind === 'terminal' && restoredTerminal.panes['pane-1'].startCommand).toBeNull()
    expect(restoredTerminal?.kind === 'terminal' && restoredTerminal.panes['pane-1'].agentCommand).toBe('claude')
    expect(restoredTerminal?.kind === 'terminal' && restoredTerminal.panes['pane-1'].isAgentRunning).toBe(false)
    expect(restoredTerminal?.kind === 'terminal' && restoredTerminal.layout).toEqual(terminalTab.layout)
    expect(restored?.tabs[1]).toEqual({ ...fileTab, isModified: false })
  })

  it('returns null for missing or broken data', () => {
    expect(parseSession(null)).toBeNull()
    expect(parseSession('not json')).toBeNull()
    expect(parseSession('{"tabs": 4}')).toBeNull()
  })

  it('skips a terminal tab whose layout points to a missing pane', () => {
    const broken = { ...terminalTab, panes: { 'pane-1': terminalTab.panes['pane-1'] } }
    const restored = parseSession(serializeSession({ tabs: [broken, fileTab], activeTabId: 'tab-1' }))
    expect(restored?.tabs).toHaveLength(1)
    expect(restored?.activeTabId).toBe('tab-2')
  })

  it('keeps the size of a split across a restart', () => {
    const resized: TerminalTab = {
      ...terminalTab,
      layout: { ...(terminalTab.layout as Extract<TerminalTab['layout'], { kind: 'split' }>), ratio: 0.3 }
    }
    const restored = parseSession(serializeSession({ tabs: [resized], activeTabId: 'tab-1' }))
    const layout = restored?.tabs[0].kind === 'terminal' ? restored.tabs[0].layout : null
    expect(layout?.kind === 'split' && layout.ratio).toBe(0.3)
  })

  it('limits a saved split size that is out of range and ignores one that is not a number', () => {
    const raw = JSON.stringify({
      tabs: [{ ...terminalTab, layout: { ...terminalTab.layout, ratio: 5 } }],
      activeTabId: 'tab-1'
    })
    const tooLarge = parseSession(raw)?.tabs[0]
    expect(tooLarge?.kind === 'terminal' && tooLarge.layout.kind === 'split' && tooLarge.layout.ratio).toBe(0.85)

    const notANumber = JSON.stringify({
      tabs: [{ ...terminalTab, layout: { ...terminalTab.layout, ratio: 'wide' } }],
      activeTabId: 'tab-1'
    })
    const ignored = parseSession(notANumber)?.tabs[0]
    expect(ignored?.kind === 'terminal' && ignored.layout.kind === 'split' && ignored.layout.ratio).toBeUndefined()
  })
})
