import { useMemo } from 'react'
import { tabsOfProject } from '../features/terminal/projectTabs'
import { useProjectsStore } from './projectsStore'
import { useWorkspaceStore, type WorkspaceTab } from './workspaceStore'

export function tabsInActiveProject(): WorkspaceTab[] {
  return tabsOfProject(useWorkspaceStore.getState().tabs, useProjectsStore.getState().activeProjectPath)
}

export function useActiveProjectTabs(): WorkspaceTab[] {
  const tabs = useWorkspaceStore((state) => state.tabs)
  const activeProjectPath = useProjectsStore((state) => state.activeProjectPath)
  return useMemo(() => tabsOfProject(tabs, activeProjectPath), [tabs, activeProjectPath])
}
