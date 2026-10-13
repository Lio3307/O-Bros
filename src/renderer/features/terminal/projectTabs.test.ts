import { describe, expect, it } from 'vitest'
import type { FileTab, TerminalTab, WorkspaceTab } from '../../state/workspaceStore'
import { belongsToProject, neighbourTabId, settledActiveTabId, tabsOfProject } from './projectTabs'

const FOLDER_A = 'E:\\Repo\\a'
const FOLDER_B = 'E:\\Repo\\b'

function terminalTab(id: string, cwd: string | null): TerminalTab {
  return {
    kind: 'terminal',
    id,
    title: id,
    cwd,
    createdAt: 0,
    layout: { kind: 'pane', paneId: `${id}-pane` },
    panes: {},
    focusedPaneId: `${id}-pane`
  }
}

function fileTab(id: string, path: string): FileTab {
  return { kind: 'file', id, title: id, path, isModified: false }
}

const tabs: WorkspaceTab[] = [
  terminalTab('a1', FOLDER_A),
  terminalTab('b1', FOLDER_B),
  fileTab('a-file', `${FOLDER_A}\\src\\index.ts`),
  terminalTab('b2', FOLDER_B),
  terminalTab('loose', null)
]

describe('belongsToProject', () => {
  it('matches terminals and files by the folder they live in', () => {
    expect(belongsToProject(tabs[0], FOLDER_A)).toBe(true)
    expect(belongsToProject(tabs[0], FOLDER_B)).toBe(false)
    expect(belongsToProject(tabs[2], FOLDER_A)).toBe(true)
    expect(belongsToProject(tabs[2], FOLDER_B)).toBe(false)
  })

  it('shows everything when no project is selected', () => {
    expect(tabsOfProject(tabs, null)).toHaveLength(tabs.length)
  })

  it('keeps terminals without a folder visible in every project', () => {
    expect(belongsToProject(tabs[4], FOLDER_A)).toBe(true)
    expect(belongsToProject(tabs[4], FOLDER_B)).toBe(true)
  })

  it('does not treat a sibling with the same name prefix as inside', () => {
    expect(belongsToProject(terminalTab('x', 'E:\\Repo\\a-old'), FOLDER_A)).toBe(false)
  })
})

describe('tabsOfProject', () => {
  it('returns only the tabs of the selected folder, in order', () => {
    expect(tabsOfProject(tabs, FOLDER_B).map((tab) => tab.id)).toEqual(['b1', 'b2', 'loose'])
  })
})

describe('neighbourTabId', () => {
  it('prefers the next tab of the same project over a tab of another project', () => {
    const remaining = tabs.filter((tab) => tab.id !== 'b1')
    expect(neighbourTabId(remaining, 1, FOLDER_B)).toBe('b2')
  })

  it('falls back to the previous tab of the project', () => {
    const remaining = tabs.filter((tab) => tab.id !== 'b2')
    expect(neighbourTabId(remaining, 3, FOLDER_B)).toBe('loose')
  })

  it('returns null when the project has no tab left', () => {
    const remaining = [terminalTab('b1', FOLDER_B)]
    expect(neighbourTabId(remaining, 0, FOLDER_A)).toBeNull()
  })
})

describe('settledActiveTabId', () => {
  it('keeps the active tab when it belongs to the project', () => {
    expect(settledActiveTabId(tabs, 'a1', FOLDER_A, 'a-file')).toBe('a1')
  })

  it('uses the remembered tab when the active one belongs to another project', () => {
    expect(settledActiveTabId(tabs, 'a1', FOLDER_B, 'b2')).toBe('b2')
  })

  it('uses the first tab of the project when nothing is remembered', () => {
    expect(settledActiveTabId(tabs, 'a1', FOLDER_B, null)).toBe('b1')
  })

  it('returns null when the project has no tabs', () => {
    expect(settledActiveTabId([terminalTab('a1', FOLDER_A)], 'a1', FOLDER_B, null)).toBeNull()
  })
})
