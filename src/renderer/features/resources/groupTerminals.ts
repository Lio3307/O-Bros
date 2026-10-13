import { closestProject } from '../../../shared/closestProject'
import { isPathInside, lastPathSegment } from '../../../shared/paths'
import type { ProjectRoot, TerminalResource } from '../../../shared/types'
import type { TerminalTab } from '../../state/workspaceStore'
import { listPaneIds } from '../terminal/paneTree'

export interface TerminalRow {
  paneId: string
  title: string
  cpuPercent: number
  workingSetBytes: number
}

export interface WorkspaceGroup {
  name: string
  path: string | null
  isSelectedProject: boolean
  cpuPercent: number
  workingSetBytes: number
  terminals: TerminalRow[]
}

const UNGROUPED_NAME = 'Terminals'

interface GroupIdentity {
  name: string
  path: string | null
}

function groupIdentityFor(cwd: string | null, roots: ProjectRoot[]): GroupIdentity {
  if (cwd === null) {
    return { name: UNGROUPED_NAME, path: null }
  }
  const project = closestProject(cwd, roots)
  return project === null ? { name: lastPathSegment(cwd), path: cwd } : project
}

function isSelected(groupPath: string | null, selectedProjectPath: string | null): boolean {
  if (groupPath === null || selectedProjectPath === null) {
    return false
  }
  return isPathInside(groupPath, selectedProjectPath)
}

export function groupTerminalsByWorkspace(
  tabs: TerminalTab[],
  roots: ProjectRoot[],
  resources: TerminalResource[],
  selectedProjectPath: string | null = null
): WorkspaceGroup[] {
  const resourceByPaneId = new Map(resources.map((resource) => [resource.paneId, resource]))
  const groupsByName = new Map<string, WorkspaceGroup>()

  for (const tab of tabs) {
    const identity = groupIdentityFor(tab.cwd, roots)
    const group = groupsByName.get(identity.name) ?? {
      ...identity,
      isSelectedProject: isSelected(identity.path, selectedProjectPath),
      cpuPercent: 0,
      workingSetBytes: 0,
      terminals: []
    }

    for (const paneId of listPaneIds(tab.layout)) {
      const resource = resourceByPaneId.get(paneId)
      if (resource === undefined) {
        continue
      }
      group.terminals.push({
        paneId,
        title: tab.panes[paneId].title,
        cpuPercent: resource.cpuPercent,
        workingSetBytes: resource.workingSetBytes
      })
      group.cpuPercent += resource.cpuPercent
      group.workingSetBytes += resource.workingSetBytes
    }

    groupsByName.set(identity.name, group)
  }

  return Array.from(groupsByName.values())
    .filter((group) => group.terminals.length > 0)
    .sort((first, second) => second.workingSetBytes - first.workingSetBytes)
}
