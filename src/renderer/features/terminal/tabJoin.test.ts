import { describe, expect, it } from 'vitest'
import type { TerminalPaneInfo, TerminalTab } from '../../state/workspaceStore'
import { listPaneIds } from './paneTree'
import { joinTerminalTabs, splitOffPane } from './tabJoin'

function pane(id: string, title: string): TerminalPaneInfo {
  return { id, title, cwd: 'E:/repo', account: null, startCommand: null, agentCommand: null, isAgentRunning: false }
}

function singleTab(id: string, paneId: string, title: string): TerminalTab {
  return {
    kind: 'terminal',
    id,
    title,
    isTitleFromAgent: true,
    cwd: 'E:/repo',
    createdAt: 1,
    layout: { kind: 'pane', paneId },
    panes: { [paneId]: pane(paneId, 'repo') },
    focusedPaneId: paneId
  }
}

describe('joinTerminalTabs', () => {
  const codex = singleTab('codex-tab', 'codex-pane', 'Codex')
  const claude = singleTab('claude-tab', 'claude-pane', 'Claude')

  it('puts the dropped tab on the side it was dropped, keeps the other tab and focuses the dropped pane', () => {
    const joined = joinTerminalTabs(codex, claude, { first: 'codex-tab', second: 'claude-tab', direction: 'vertical', ratio: 0.5 })

    expect(joined.id).toBe('codex-tab')
    expect(joined.layout).toEqual({
      kind: 'split',
      direction: 'vertical',
      ratio: 0.5,
      first: { kind: 'pane', paneId: 'codex-pane' },
      second: { kind: 'pane', paneId: 'claude-pane' }
    })
    expect(joined.focusedPaneId).toBe('claude-pane')
  })

  it('names each pane after the tab it came from, so the two can be told apart', () => {
    const joined = joinTerminalTabs(codex, claude, { first: 'claude-tab', second: 'codex-tab', direction: 'horizontal', ratio: 0.5 })

    expect(listPaneIds(joined.layout)).toEqual(['claude-pane', 'codex-pane'])
    expect(joined.panes['codex-pane'].title).toBe('Codex')
    expect(joined.panes['claude-pane'].title).toBe('Claude')
  })
})

describe('splitOffPane', () => {
  const joined = joinTerminalTabs(singleTab('a', 'pa', 'Codex'), singleTab('b', 'pb', 'Claude'), { first: 'a', second: 'b', direction: 'horizontal', ratio: 0.5 })

  it('moves a pane into a tab of its own and leaves the rest', () => {
    const result = splitOffPane(joined, 'pb', 'new-tab', 2)

    expect(result?.remaining.layout).toEqual({ kind: 'pane', paneId: 'pa' })
    expect(Object.keys(result?.remaining.panes ?? {})).toEqual(['pa'])
    expect(result?.remaining.focusedPaneId).toBe('pa')
    expect(result?.tab).toMatchObject({ id: 'new-tab', title: 'Claude', layout: { kind: 'pane', paneId: 'pb' }, focusedPaneId: 'pb' })
  })

  it('does nothing for the only pane of a tab', () => {
    expect(splitOffPane(singleTab('a', 'pa', 'Codex'), 'pa', 'new-tab', 2)).toBeNull()
  })
})
