import { describe, expect, it } from 'vitest'
import type { TerminalPaneInfo, WorkspaceTab } from '../../state/workspaceStore'
import { terminalListItems } from './terminalListItems'

function pane(id: string, title: string, cwd: string | null, agentCommand: string | null = null): TerminalPaneInfo {
  return { id, title, cwd, account: null, startCommand: null, agentCommand, isAgentRunning: agentCommand !== null }
}

const TABS: WorkspaceTab[] = [
  {
    kind: 'terminal',
    id: 'split',
    title: 'api',
    isTitleFromAgent: false,
    cwd: 'E:/work/api',
    createdAt: 1,
    layout: { kind: 'split', direction: 'horizontal', first: { kind: 'pane', paneId: 'a' }, second: { kind: 'pane', paneId: 'b' } },
    panes: { a: pane('a', 'Codex', 'E:/work/api', 'codex'), b: pane('b', 'Terminal 2', 'E:/work/api') },
    focusedPaneId: 'b'
  },
  { kind: 'file', id: 'file', title: 'notes.md', path: 'E:/work/notes.md', isModified: false },
  {
    kind: 'terminal',
    id: 'home',
    title: 'Home',
    isTitleFromAgent: false,
    cwd: null,
    createdAt: 2,
    layout: { kind: 'pane', paneId: 'c' },
    panes: { c: pane('c', 'Home', null) },
    focusedPaneId: 'c'
  }
]

describe('terminalListItems', () => {
  it('lists every terminal pane of every tab, names split panes and marks the one in use', () => {
    expect(terminalListItems(TABS, 'split', '')).toEqual([
      { paneId: 'a', title: 'api · Codex', place: 'api · pane 1 of 2', agentCommand: 'codex', isCurrent: false },
      { paneId: 'b', title: 'api · Terminal 2', place: 'api · pane 2 of 2', agentCommand: null, isCurrent: true },
      { paneId: 'c', title: 'Home', place: 'Home', agentCommand: null, isCurrent: false }
    ])
  })

  it('does not repeat the tab name for a pane named like its tab', () => {
    const [split] = TABS
    if (split.kind !== 'terminal') {
      throw new Error('the first tab is a terminal')
    }
    const named = { ...split, panes: { ...split.panes, a: { ...split.panes.a, title: 'api' } } }
    expect(terminalListItems([named], null, '')[0].title).toBe('api')
  })

  it('finds terminals by name, folder or agent', () => {
    expect(terminalListItems(TABS, null, 'codex').map((item) => item.paneId)).toEqual(['a'])
    expect(terminalListItems(TABS, null, ' home ').map((item) => item.paneId)).toEqual(['c'])
  })
})
