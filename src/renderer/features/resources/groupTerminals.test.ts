import { describe, expect, it } from 'vitest'
import type { ProjectRoot, TerminalResource } from '../../../shared/types'
import type { TerminalTab } from '../../state/workspaceStore'
import { groupTerminalsByWorkspace } from './groupTerminals'

const MB = 1024 * 1024

function terminalTab(id: string, cwd: string | null, paneIds: string[]): TerminalTab {
  const panes = Object.fromEntries(
    paneIds.map((paneId) => [paneId, { id: paneId, title: `Terminal ${paneId}`, cwd, account: null, startCommand: null }])
  )
  const layout = paneIds
    .slice(1)
    .reduce(
      (current, paneId) => ({
        kind: 'split' as const,
        direction: 'horizontal' as const,
        first: current,
        second: { kind: 'pane' as const, paneId }
      }),
      { kind: 'pane' as const, paneId: paneIds[0] } as TerminalTab['layout']
    )
  return { kind: 'terminal', id, title: id, cwd, createdAt: 0, layout, panes, focusedPaneId: paneIds[0] }
}

const roots: ProjectRoot[] = [{ name: 'PersonalRepo', path: 'E:\\PersonalRepo', branch: null, folders: [] }]

function resource(paneId: string, workingSetMb: number, cpuPercent: number): TerminalResource {
  return { paneId, cpuPercent, workingSetBytes: workingSetMb * MB, privateBytes: workingSetMb * MB }
}

describe('groupTerminalsByWorkspace', () => {
  it('groups terminals under the project root that contains their folder', () => {
    const tabs = [terminalTab('a', 'E:\\PersonalRepo\\o-bros', ['1', '2'])]
    const groups = groupTerminalsByWorkspace(tabs, roots, [resource('1', 100, 5), resource('2', 50, 3)])

    expect(groups).toHaveLength(1)
    expect(groups[0].name).toBe('PersonalRepo')
    expect(groups[0].memoryBytes).toBe(150 * MB)
    expect(groups[0].cpuPercent).toBe(8)
    expect(groups[0].terminals.map((row) => row.paneId)).toEqual(['1', '2'])
  })

  it('separates folders of the same root and marks the selected project', () => {
    const rootsWithFolders: ProjectRoot[] = [
      {
        name: 'PersonalRepo',
        path: 'E:\\PersonalRepo',
        branch: null,
        folders: [
          { name: 'o-bros', path: 'E:\\PersonalRepo\\o-bros', branch: null },
          { name: 'site', path: 'E:\\PersonalRepo\\site', branch: null }
        ]
      }
    ]
    const tabs = [terminalTab('a', 'E:\\PersonalRepo\\o-bros', ['1']), terminalTab('b', 'E:\\PersonalRepo\\site', ['2'])]
    const groups = groupTerminalsByWorkspace(
      tabs,
      rootsWithFolders,
      [resource('1', 20, 1), resource('2', 10, 1)],
      'E:\\PersonalRepo\\site'
    )

    expect(groups.map((group) => [group.name, group.isSelectedProject])).toEqual([
      ['o-bros', false],
      ['site', true]
    ])
  })

  it('falls back to the folder name for terminals outside every root', () => {
    const tabs = [terminalTab('a', 'D:\\Scratch', ['1'])]
    const groups = groupTerminalsByWorkspace(tabs, roots, [resource('1', 10, 1)])
    expect(groups[0].name).toBe('Scratch')
  })

  it('puts terminals without a folder under "Terminals"', () => {
    const tabs = [terminalTab('a', null, ['1'])]
    expect(groupTerminalsByWorkspace(tabs, roots, [resource('1', 10, 1)])[0].name).toBe('Terminals')
  })

  it('skips terminals that have no measurement yet and sorts by memory', () => {
    const tabs = [terminalTab('a', 'D:\\Small', ['1']), terminalTab('b', 'D:\\Big', ['2', '3'])]
    const groups = groupTerminalsByWorkspace(tabs, roots, [resource('1', 10, 1), resource('2', 500, 1)])
    expect(groups.map((group) => group.name)).toEqual(['Big', 'Small'])
    expect(groups[0].terminals).toHaveLength(1)
  })
})
