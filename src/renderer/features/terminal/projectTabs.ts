import { isPathInside } from '../../../shared/paths'
import type { WorkspaceTab } from '../../state/workspaceStore'

export function tabLocation(tab: WorkspaceTab): string | null {
  return tab.kind === 'file' ? tab.path : tab.cwd
}

export function belongsToProject(tab: WorkspaceTab, projectPath: string | null): boolean {
  const location = tabLocation(tab)
  if (projectPath === null || location === null) {
    return true
  }
  return isPathInside(location, projectPath)
}

export function tabsOfProject(tabs: WorkspaceTab[], projectPath: string | null): WorkspaceTab[] {
  return tabs.filter((tab) => belongsToProject(tab, projectPath))
}

export function neighbourTabId(remainingTabs: WorkspaceTab[], closedIndex: number, projectPath: string | null): string | null {
  const after = remainingTabs.slice(closedIndex)
  const before = remainingTabs.slice(0, closedIndex).reverse()
  const neighbour = [...after, ...before].find((tab) => belongsToProject(tab, projectPath))
  return neighbour?.id ?? null
}

export function settledActiveTabId(
  tabs: WorkspaceTab[],
  activeTabId: string | null,
  projectPath: string | null,
  preferredTabId: string | null
): string | null {
  const projectTabs = tabsOfProject(tabs, projectPath)
  const isShown = (tabId: string | null): boolean => projectTabs.some((tab) => tab.id === tabId)
  if (isShown(activeTabId)) {
    return activeTabId
  }
  if (isShown(preferredTabId)) {
    return preferredTabId
  }
  return projectTabs[0]?.id ?? null
}
