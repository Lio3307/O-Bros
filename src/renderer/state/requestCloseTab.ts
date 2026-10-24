import { tabsInActiveProject } from './activeProjectTabs'
import { askToConfirm } from './confirmStore'
import { describeRunningAgents, runningAgentsIn, type RunningAgent } from './runningAgentPanes'
import { isTerminalTab, useWorkspaceStore, type WorkspaceTab } from './workspaceStore'

interface ClosingCheck {
  title: string
  confirmLabel: string
  unsavedTitles: string[]
  agents: RunningAgent[]
}

function unsavedTitlesOf(tabs: WorkspaceTab[]): string[] {
  return tabs.filter((tab) => tab.kind === 'file' && tab.isModified).map((tab) => tab.title)
}

function runningAgentsOf(tabs: WorkspaceTab[]): RunningAgent[] {
  return runningAgentsIn(tabs.filter(isTerminalTab).flatMap((tab) => Object.values(tab.panes)))
}

async function confirmClosing(check: ClosingCheck): Promise<boolean> {
  if (check.unsavedTitles.length === 0 && check.agents.length === 0) {
    return true
  }
  const unsaved = check.unsavedTitles.length === 0 ? '' : `Unsaved changes in ${check.unsavedTitles.join(', ')} will be lost.`
  return askToConfirm({
    title: check.title,
    message: [describeRunningAgents(check.agents), unsaved].filter((part) => part !== '').join(' '),
    confirmLabel: check.confirmLabel
  })
}

export async function requestCloseTab(tabId: string): Promise<void> {
  const tab = useWorkspaceStore.getState().tabs.find((candidate) => candidate.id === tabId)
  if (tab === undefined) {
    return
  }
  const agents = runningAgentsOf([tab])
  const isConfirmed = await confirmClosing({
    title: agents.length > 0 ? `Close "${tab.title}" while its agent runs?` : 'Close without saving?',
    confirmLabel: agents.length > 0 ? 'Close terminal' : 'Close anyway',
    unsavedTitles: unsavedTitlesOf([tab]),
    agents
  })
  if (isConfirmed) {
    useWorkspaceStore.getState().closeTab(tabId)
  }
}

export async function requestCloseOtherTabs(tabId: string): Promise<void> {
  const closing = tabsInActiveProject().filter((tab) => tab.id !== tabId)
  const isConfirmed = await confirmClosing({
    title: 'Close the other tabs?',
    confirmLabel: 'Close tabs',
    unsavedTitles: unsavedTitlesOf(closing),
    agents: runningAgentsOf(closing)
  })
  if (isConfirmed) {
    useWorkspaceStore.getState().closeOtherTabs(tabId)
  }
}

export async function requestClosePane(tabId: string, paneId: string): Promise<void> {
  const tab = useWorkspaceStore.getState().tabs.find((candidate) => candidate.id === tabId)
  const pane = tab !== undefined && isTerminalTab(tab) ? tab.panes[paneId] : undefined
  if (pane === undefined) {
    return
  }
  const isConfirmed = await confirmClosing({
    title: `Close "${pane.title}" while its agent runs?`,
    confirmLabel: 'Close pane',
    unsavedTitles: [],
    agents: runningAgentsIn([pane])
  })
  if (isConfirmed) {
    useWorkspaceStore.getState().closePane(tabId, paneId)
  }
}
