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
  cpuPercent: number
  workingSetBytes: number
  terminals: TerminalRow[]
}

const UNGROUPED_NAME = 'Terminals'

function workspaceNameFor(cwd: string | null, roots: ProjectRoot[]): string {
  if (cwd === null) {
    return UNGROUPED_NAME
  }
  const root = roots.find((candidate) => isPathInside(cwd, candidate.path))
  return root === undefined ? lastPathSegment(cwd) : root.name
}

export function groupTerminalsByWorkspace(
  tabs: TerminalTab[],
  roots: ProjectRoot[],
  resources: TerminalResource[]
): WorkspaceGroup[] {
  const resourceByPaneId = new Map(resources.map((resource) => [resource.paneId, resource]))
  const groupsByName = new Map<string, WorkspaceGroup>()

  for (const tab of tabs) {
    const name = workspaceNameFor(tab.cwd, roots)
    const group = groupsByName.get(name) ?? { name, cpuPercent: 0, workingSetBytes: 0, terminals: [] }

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

    groupsByName.set(name, group)
  }

  return Array.from(groupsByName.values())
    .filter((group) => group.terminals.length > 0)
    .sort((first, second) => second.workingSetBytes - first.workingSetBytes)
}
