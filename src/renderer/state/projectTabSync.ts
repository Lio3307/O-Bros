import { settledActiveTabId } from '../features/terminal/projectTabs'
import { useProjectsStore } from './projectsStore'
import { useWorkspaceStore } from './workspaceStore'

const lastActiveTabByProject = new Map<string | null, string>()

function settleActiveTab(): void {
  const { tabs, activeTabId } = useWorkspaceStore.getState()
  const projectPath = useProjectsStore.getState().activeProjectPath
  const settled = settledActiveTabId(tabs, activeTabId, projectPath, lastActiveTabByProject.get(projectPath) ?? null)

  if (settled !== null) {
    lastActiveTabByProject.set(projectPath, settled)
  }
  if (settled !== activeTabId) {
    useWorkspaceStore.setState({ activeTabId: settled })
  }
}

export function startProjectTabSync(): () => void {
  settleActiveTab()
  const stopWorkspace = useWorkspaceStore.subscribe(settleActiveTab)
  const stopProjects = useProjectsStore.subscribe(settleActiveTab)
  return () => {
    stopWorkspace()
    stopProjects()
  }
}
