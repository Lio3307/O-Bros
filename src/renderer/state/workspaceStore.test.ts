import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listDividers, listPaneIds } from '../features/terminal/paneTree'

vi.stubGlobal('localStorage', {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined
})

const { isTerminalTab, useWorkspaceStore } = await import('./workspaceStore')

function openTab(): string {
  useWorkspaceStore.getState().openTerminalTab({ cwd: 'E:/work/api', account: null })
  return useWorkspaceStore.getState().activeTabId as string
}

function terminalTabOf(tabId: string) {
  const tab = useWorkspaceStore.getState().tabs.find((candidate) => candidate.id === tabId)
  if (tab === undefined || !isTerminalTab(tab)) {
    throw new Error('terminal tab not found')
  }
  return tab
}

beforeEach(() => {
  useWorkspaceStore.getState().restoreTabs([], null)
})

describe('splitPane', () => {
  it('keeps the original pane and adds a focused pane in the same folder', () => {
    const tabId = openTab()
    const [originalPaneId] = listPaneIds(terminalTabOf(tabId).layout)

    useWorkspaceStore.getState().splitPane(tabId, originalPaneId, 'horizontal')

    const tab = terminalTabOf(tabId)
    const paneIds = listPaneIds(tab.layout)
    expect(paneIds).toHaveLength(2)
    expect(paneIds[0]).toBe(originalPaneId)
    expect(tab.focusedPaneId).toBe(paneIds[1])
    expect(tab.panes[paneIds[1]].cwd).toBe('E:/work/api')
    expect(tab.panes[paneIds[1]].startCommand).toBeNull()
  })
})

describe('closePane', () => {
  it('keeps the other panes with the same ids so their terminals are not restarted', () => {
    const tabId = openTab()
    const [first] = listPaneIds(terminalTabOf(tabId).layout)
    useWorkspaceStore.getState().splitPane(tabId, first, 'horizontal')
    const [, second] = listPaneIds(terminalTabOf(tabId).layout)
    useWorkspaceStore.getState().splitPane(tabId, second, 'vertical')
    const [, , third] = listPaneIds(terminalTabOf(tabId).layout)

    useWorkspaceStore.getState().closePane(tabId, third)

    const tab = terminalTabOf(tabId)
    expect(listPaneIds(tab.layout)).toEqual([first, second])
    expect(Object.keys(tab.panes).sort()).toEqual([first, second].sort())
  })

  it('moves focus to a remaining pane when the focused pane is closed', () => {
    const tabId = openTab()
    const [first] = listPaneIds(terminalTabOf(tabId).layout)
    useWorkspaceStore.getState().splitPane(tabId, first, 'horizontal')
    const focused = terminalTabOf(tabId).focusedPaneId

    useWorkspaceStore.getState().closePane(tabId, focused)

    expect(terminalTabOf(tabId).focusedPaneId).toBe(first)
  })

  it('closes the tab when its last pane is closed', () => {
    const tabId = openTab()
    const [only] = listPaneIds(terminalTabOf(tabId).layout)

    useWorkspaceStore.getState().closePane(tabId, only)

    expect(useWorkspaceStore.getState().tabs.some((tab) => tab.id === tabId)).toBe(false)
  })
})

describe('resizeSplit', () => {
  it('stores the new ratio on the split without changing which panes exist', () => {
    const tabId = openTab()
    const [first] = listPaneIds(terminalTabOf(tabId).layout)
    useWorkspaceStore.getState().splitPane(tabId, first, 'horizontal')
    const before = listPaneIds(terminalTabOf(tabId).layout)

    useWorkspaceStore.getState().resizeSplit(tabId, [], 0.3)

    const tab = terminalTabOf(tabId)
    expect(listDividers(tab.layout)[0].ratio).toBe(0.3)
    expect(listPaneIds(tab.layout)).toEqual(before)
  })
})

describe('setPaneAgent', () => {
  it('shows the agent that started in a plain terminal and names the tab after it', () => {
    const tabId = openTab()
    const [paneId] = listPaneIds(terminalTabOf(tabId).layout)

    useWorkspaceStore.getState().setPaneAgent(paneId, { command: 'codex', label: 'Codex' })

    const tab = terminalTabOf(tabId)
    expect(tab.title).toBe('Codex')
    expect(tab.panes[paneId].agentCommand).toBe('codex')
    expect(tab.panes[paneId].isAgentRunning).toBe(true)
  })

  it('remembers the agent after it stops and keeps a name the user chose', () => {
    const tabId = openTab()
    const [paneId] = listPaneIds(terminalTabOf(tabId).layout)
    useWorkspaceStore.getState().renameTab(tabId, 'review')

    useWorkspaceStore.getState().setPaneAgent(paneId, { command: 'gemini', label: 'Gemini' })
    useWorkspaceStore.getState().setPaneAgent(paneId, null)

    const tab = terminalTabOf(tabId)
    expect(tab.title).toBe('review')
    expect(tab.panes[paneId].agentCommand).toBe('gemini')
    expect(tab.panes[paneId].isAgentRunning).toBe(false)
  })

  it('renames the tab again when another agent starts where an agent named it, but not after the user renamed it', () => {
    const tabId = openTab()
    const [paneId] = listPaneIds(terminalTabOf(tabId).layout)
    useWorkspaceStore.getState().setPaneAgent(paneId, { command: 'claude', label: 'Claude' })
    useWorkspaceStore.getState().setPaneAgent(paneId, null)
    useWorkspaceStore.getState().setPaneAgent(paneId, { command: 'codex', label: 'Codex' })
    expect(terminalTabOf(tabId).title).toBe('Codex')

    useWorkspaceStore.getState().renameTab(tabId, 'review')
    useWorkspaceStore.getState().setPaneAgent(paneId, null)
    useWorkspaceStore.getState().setPaneAgent(paneId, { command: 'gemini', label: 'Gemini' })
    expect(terminalTabOf(tabId).title).toBe('review')
  })
})
