import { create } from 'zustand'
import { closestProject } from '../../shared/closestProject'
import { isPathInside, lastPathSegment, parentPath } from '../../shared/paths'
import type { AccountRef } from '../../shared/types'
import { forgetEditorState } from '../features/editor/editorSessions'
import { useRecentFilesStore } from './recentFilesStore'
import { useProjectsStore } from './projectsStore'
import {
  listPaneIds,
  removePaneFromLayout,
  setSplitRatio,
  splitPaneInLayout,
  type PaneLayout,
  type SplitDirection,
  type SplitPath
} from '../features/terminal/paneTree'
import { belongsToProject, neighbourTabId, tabLocation } from '../features/terminal/projectTabs'
import { moveItem } from '../features/terminal/tabOrder'

export interface TerminalPaneInfo {
  id: string
  title: string
  cwd: string | null
  account: AccountRef | null
  startCommand: string | null
  agentCommand: string | null
  isAgentRunning: boolean
}

export interface PaneAgent {
  command: string
  label: string
}

export interface TerminalTab {
  kind: 'terminal'
  id: string
  title: string
  isTitleFromAgent: boolean
  cwd: string | null
  createdAt: number
  layout: PaneLayout
  panes: Record<string, TerminalPaneInfo>
  focusedPaneId: string
}

export interface FileTab {
  kind: 'file'
  id: string
  title: string
  path: string
  isModified: boolean
}

export type WorkspaceTab = TerminalTab | FileTab

export interface NewTerminalOptions {
  cwd: string | null
  account: AccountRef | null
  startCommand?: string
  title?: string
}

interface WorkspaceState {
  tabs: WorkspaceTab[]
  activeTabId: string | null
  openTerminalTab: (options: NewTerminalOptions) => void
  openFileTab: (filePath: string) => void
  activateTab: (tabId: string) => void
  closeTab: (tabId: string) => void
  closeOtherTabs: (tabId: string) => void
  closeFileTabsInside: (path: string) => void
  moveTab: (draggedTabId: string, targetTabId: string) => void
  restoreTabs: (tabs: WorkspaceTab[], activeTabId: string | null) => void
  renameTab: (tabId: string, title: string) => void
  splitPane: (tabId: string, paneId: string, direction: SplitDirection) => void
  closePane: (tabId: string, paneId: string) => void
  resizeSplit: (tabId: string, path: SplitPath, ratio: number) => void
  renamePane: (tabId: string, paneId: string, title: string) => void
  focusPane: (tabId: string, paneId: string) => void
  setPaneAgent: (paneId: string, agent: PaneAgent | null) => void
  setFileModified: (tabId: string, isModified: boolean) => void
}

function newId(): string {
  return crypto.randomUUID()
}

function terminalTitleFor(cwd: string | null, existingCount: number): string {
  return cwd === null ? (existingCount === 0 ? 'Home' : `Home ${existingCount + 1}`) : lastPathSegment(cwd)
}

function hasDefaultTitle(tab: TerminalTab): boolean {
  return tab.cwd === null ? tab.title.startsWith('Home') : tab.title === lastPathSegment(tab.cwd)
}

function buildTerminalTab(options: NewTerminalOptions, existingTerminalCount: number): TerminalTab {
  const paneId = newId()
  const title = options.title ?? terminalTitleFor(options.cwd, existingTerminalCount)
  return {
    kind: 'terminal',
    id: newId(),
    title,
    isTitleFromAgent: false,
    cwd: options.cwd,
    createdAt: Date.now(),
    layout: { kind: 'pane', paneId },
    panes: {
      [paneId]: {
        id: paneId,
        title,
        cwd: options.cwd,
        account: options.account,
        startCommand: options.startCommand ?? null,
        agentCommand: options.startCommand ?? null,
        isAgentRunning: options.startCommand !== undefined
      }
    },
    focusedPaneId: paneId
  }
}

export function isTerminalTab(tab: WorkspaceTab): tab is TerminalTab {
  return tab.kind === 'terminal'
}

function withoutPane(panes: Record<string, TerminalPaneInfo>, paneId: string): Record<string, TerminalPaneInfo> {
  const remainingPanes = { ...panes }
  delete remainingPanes[paneId]
  return remainingPanes
}

function mapTerminalTab(tabs: WorkspaceTab[], tabId: string, update: (tab: TerminalTab) => TerminalTab): WorkspaceTab[] {
  return tabs.map((tab) => (tab.kind === 'terminal' && tab.id === tabId ? update(tab) : tab))
}

function showProjectOf(tab: WorkspaceTab): void {
  const projects = useProjectsStore.getState()
  const location = tabLocation(tab)
  if (location === null || belongsToProject(tab, projects.activeProjectPath)) {
    return
  }
  const fallbackPath = tab.kind === 'file' ? parentPath(location) : location
  projects.selectProject(closestProject(location, projects.roots)?.path ?? fallbackPath)
}

export const useWorkspaceStore = create<WorkspaceState>()((set, get) => ({
  tabs: [],
  activeTabId: null,

  openTerminalTab: (options) => {
    const terminalCount = get().tabs.filter((tab) => tab.kind === 'terminal').length
    const tab = buildTerminalTab(options, terminalCount)
    set({ tabs: [...get().tabs, tab], activeTabId: tab.id })
    showProjectOf(tab)
  },

  openFileTab: (filePath) => {
    useRecentFilesStore.getState().record(filePath)
    const existing = get().tabs.find((tab) => tab.kind === 'file' && tab.path === filePath)
    if (existing !== undefined) {
      get().activateTab(existing.id)
      return
    }
    const tab: FileTab = { kind: 'file', id: newId(), title: lastPathSegment(filePath), path: filePath, isModified: false }
    set({ tabs: [...get().tabs, tab], activeTabId: tab.id })
    showProjectOf(tab)
  },

  activateTab: (tabId) => {
    const tab = get().tabs.find((candidate) => candidate.id === tabId)
    set({ activeTabId: tabId })
    if (tab !== undefined) {
      showProjectOf(tab)
    }
  },

  closeTab: (tabId) => {
    const { tabs, activeTabId } = get()
    const closedIndex = tabs.findIndex((tab) => tab.id === tabId)
    const closedTab = tabs[closedIndex]
    if (closedTab === undefined) {
      return
    }
    if (closedTab.kind === 'file') {
      forgetEditorState(closedTab.path)
    }
    const remaining = tabs.filter((tab) => tab.id !== tabId)
    set({
      tabs: remaining,
      activeTabId:
        activeTabId === tabId
          ? neighbourTabId(remaining, closedIndex, useProjectsStore.getState().activeProjectPath)
          : activeTabId
    })
  },

  closeOtherTabs: (tabId) => {
    const { tabs } = get()
    const projectPath = useProjectsStore.getState().activeProjectPath
    const closing = tabs.filter((tab) => tab.id !== tabId && belongsToProject(tab, projectPath))
    for (const tab of closing) {
      if (tab.kind === 'file') {
        forgetEditorState(tab.path)
      }
    }
    set({ tabs: tabs.filter((tab) => !closing.includes(tab)), activeTabId: tabId })
  },

  closeFileTabsInside: (path) => {
    const affectedTabs = get().tabs.filter((tab) => tab.kind === 'file' && isPathInside(tab.path, path))
    affectedTabs.forEach((tab) => get().closeTab(tab.id))
  },

  moveTab: (draggedTabId, targetTabId) => {
    const { tabs } = get()
    const fromIndex = tabs.findIndex((tab) => tab.id === draggedTabId)
    const toIndex = tabs.findIndex((tab) => tab.id === targetTabId)
    if (fromIndex >= 0 && toIndex >= 0) {
      set({ tabs: moveItem(tabs, fromIndex, toIndex) })
    }
  },

  restoreTabs: (tabs, activeTabId) => set({ tabs, activeTabId }),

  renameTab: (tabId, title) => {
    set({ tabs: get().tabs.map((tab) => (tab.id !== tabId ? tab : isTerminalTab(tab) ? { ...tab, title, isTitleFromAgent: false } : { ...tab, title })) })
  },

  splitPane: (tabId, paneId, direction) => {
    const newPaneId = newId()
    set({
      tabs: mapTerminalTab(get().tabs, tabId, (tab) => {
        const source = tab.panes[paneId]
        const newPane: TerminalPaneInfo = {
          id: newPaneId,
          title: `Terminal ${listPaneIds(tab.layout).length + 1}`,
          cwd: source.cwd,
          account: source.account,
          startCommand: null,
          agentCommand: null,
          isAgentRunning: false
        }
        return {
          ...tab,
          layout: splitPaneInLayout(tab.layout, paneId, direction, newPaneId),
          panes: { ...tab.panes, [newPaneId]: newPane },
          focusedPaneId: newPaneId
        }
      })
    })
  },

  closePane: (tabId, paneId) => {
    const tab = get().tabs.find((candidate) => candidate.kind === 'terminal' && candidate.id === tabId)
    if (tab === undefined || tab.kind !== 'terminal') {
      return
    }
    const remainingLayout = removePaneFromLayout(tab.layout, paneId)
    if (remainingLayout === null) {
      get().closeTab(tabId)
      return
    }
    const remainingPanes = withoutPane(tab.panes, paneId)
    const nextFocusedPaneId = tab.focusedPaneId === paneId ? listPaneIds(remainingLayout)[0] : tab.focusedPaneId
    set({
      tabs: mapTerminalTab(get().tabs, tabId, (current) => ({
        ...current,
        layout: remainingLayout,
        panes: remainingPanes,
        focusedPaneId: nextFocusedPaneId
      }))
    })
  },

  resizeSplit: (tabId, path, ratio) => {
    set({
      tabs: mapTerminalTab(get().tabs, tabId, (tab) => ({ ...tab, layout: setSplitRatio(tab.layout, path, ratio) }))
    })
  },

  renamePane: (tabId, paneId, title) => {
    set({
      tabs: mapTerminalTab(get().tabs, tabId, (tab) => ({
        ...tab,
        panes: { ...tab.panes, [paneId]: { ...tab.panes[paneId], title } }
      }))
    })
  },

  setPaneAgent: (paneId, agent) => {
    const tab = get().tabs.find((candidate): candidate is TerminalTab => isTerminalTab(candidate) && paneId in candidate.panes)
    if (tab === undefined) {
      return
    }
    const pane = tab.panes[paneId]
    const isRunning = agent !== null
    const agentCommand = agent?.command ?? pane.agentCommand
    if (pane.isAgentRunning === isRunning && pane.agentCommand === agentCommand) {
      return
    }
    const takesAgentName = agent !== null && (hasDefaultTitle(tab) || tab.isTitleFromAgent)
    set({
      tabs: mapTerminalTab(get().tabs, tab.id, (current) => ({
        ...current,
        title: takesAgentName ? agent.label : current.title,
        isTitleFromAgent: takesAgentName || current.isTitleFromAgent,
        panes: { ...current.panes, [paneId]: { ...current.panes[paneId], agentCommand, isAgentRunning: isRunning } }
      }))
    })
  },

  focusPane: (tabId, paneId) => {
    set({ tabs: mapTerminalTab(get().tabs, tabId, (tab) => ({ ...tab, focusedPaneId: paneId })) })
  },

  setFileModified: (tabId, isModified) => {
    set({
      tabs: get().tabs.map((tab) => (tab.kind === 'file' && tab.id === tabId ? { ...tab, isModified } : tab))
    })
  }
}))
