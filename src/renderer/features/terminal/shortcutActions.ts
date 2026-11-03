import type { ShortcutAction } from '../../../shared/shortcuts'
import { tabsInActiveProject } from '../../state/activeProjectTabs'
import { useLayoutStore, type Section } from '../../state/layoutStore'
import { openTerminal } from '../../state/openTerminal'
import { requestClosePane } from '../../state/requestCloseTab'
import { useWorkspaceStore } from '../../state/workspaceStore'
import { paneInDirection, type PaneDirection, type SplitDirection } from './paneTree'
import { itemBeside } from './tabOrder'

export const REPEATING_ACTIONS: ShortcutAction[] = ['nextTab', 'previousTab', 'focusPaneLeft', 'focusPaneRight', 'focusPaneUp', 'focusPaneDown']

function focusedTerminal() {
  const { tabs, activeTabId } = useWorkspaceStore.getState()
  const tab = tabs.find((candidate) => candidate.id === activeTabId)
  return tab !== undefined && tab.kind === 'terminal' ? tab : null
}

function split(direction: SplitDirection): void {
  const tab = focusedTerminal()
  if (tab !== null) {
    useWorkspaceStore.getState().splitPane(tab.id, tab.focusedPaneId, direction)
  }
}

function stepTab(step: 1 | -1): void {
  const { activeTabId, activateTab } = useWorkspaceStore.getState()
  const next = itemBeside(
    tabsInActiveProject().map((tab) => tab.id),
    activeTabId,
    step
  )
  if (next !== null) {
    activateTab(next)
  }
}

function focusPane(direction: PaneDirection): boolean {
  const tab = focusedTerminal()
  const next = tab === null ? null : paneInDirection(tab.layout, tab.focusedPaneId, direction)
  if (tab === null || next === null) {
    return false
  }
  useWorkspaceStore.getState().focusPane(tab.id, next)
  return true
}

function showSection(section: Section): void {
  useLayoutStore.getState().openSection(section)
}

function toggleFilesPanel(): void {
  const layout = useLayoutStore.getState()
  if (layout.section !== 'projects') {
    layout.showSection('projects')
    if (layout.isFilesPanelOpen) {
      return
    }
  }
  layout.toggleFilesPanel()
}

export const SHORTCUT_ACTIONS: Record<ShortcutAction, () => boolean | void> = {
  newTerminal: () => void openTerminal(null),
  splitRight: () => split('horizontal'),
  splitDown: () => split('vertical'),
  closePane: () => {
    const tab = focusedTerminal()
    if (tab !== null) {
      void requestClosePane(tab.id, tab.focusedPaneId)
    }
  },
  nextTab: () => stepTab(1),
  previousTab: () => stepTab(-1),
  focusPaneLeft: () => focusPane('left'),
  focusPaneRight: () => focusPane('right'),
  focusPaneUp: () => focusPane('up'),
  focusPaneDown: () => focusPane('down'),
  showTerminals: () => useLayoutStore.getState().setTerminalListVisible(true),
  showProjects: () => showSection('projects'),
  showHistory: () => showSection('history'),
  showChanges: () => showSection('changes'),
  showActivity: () => showSection('activity'),
  showSettings: () => showSection('settings'),
  toggleSidebar: () => useLayoutStore.getState().toggleSidebarVisibility(),
  toggleFilesPanel,
  openCommandPalette: () => useLayoutStore.getState().openCommandPalette()
}
