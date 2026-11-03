import { describe, expect, it } from 'vitest'
import type { WorkspaceTab } from '../../state/workspaceStore'
import { nextFilesRoot } from './filesRoot'

const PROJECT = 'E:/PersonalRepo'

function terminal(cwd: string | null): WorkspaceTab {
  return {
    kind: 'terminal',
    id: 't',
    title: 't',
    isTitleFromAgent: false,
    cwd,
    createdAt: 1,
    layout: { kind: 'pane', paneId: 'p' },
    panes: { p: { id: 'p', title: 't', cwd, account: null, startCommand: null, agentCommand: null, isAgentRunning: false } },
    focusedPaneId: 'p'
  }
}

function file(path: string): WorkspaceTab {
  return { kind: 'file', id: 'f', title: 'f', path, isModified: false }
}

describe('nextFilesRoot', () => {
  it('follows the folder of the terminal in use', () => {
    expect(nextFilesRoot(PROJECT, PROJECT, terminal('E:/PersonalRepo/o-bros'))).toBe('E:/PersonalRepo/o-bros')
    expect(nextFilesRoot('E:/PersonalRepo/o-bros', PROJECT, terminal(PROJECT))).toBe(PROJECT)
  })

  it('stays put while a file from that folder is open', () => {
    expect(nextFilesRoot('E:/PersonalRepo/o-bros', PROJECT, file('E:/PersonalRepo/o-bros/src/main/index.ts'))).toBe('E:/PersonalRepo/o-bros')
    expect(nextFilesRoot('E:/PersonalRepo/o-bros', PROJECT, file('E:/PersonalRepo/notes.md'))).toBe(PROJECT)
  })

  it('shows the project for a terminal outside it, and when the project changes', () => {
    expect(nextFilesRoot(PROJECT, PROJECT, terminal(null))).toBe(PROJECT)
    expect(nextFilesRoot('E:/PersonalRepo/o-bros', 'E:/Other', undefined)).toBe('E:/Other')
    expect(nextFilesRoot(PROJECT, null, terminal(PROJECT))).toBeNull()
  })
})
