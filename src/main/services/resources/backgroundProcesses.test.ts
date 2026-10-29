import { describe, expect, it } from 'vitest'
import { describeRunningPrograms, listBackgroundProcesses } from './backgroundProcesses'
import type { ProcessEntry } from './processTable'

function entry(pid: number, name: string, commandLine = name, parentPid = 0): ProcessEntry {
  return { pid, parentPid, workingSetBytes: 0, privateBytes: 0, cpuTimeMs: null, cpuPercent: null, startedAt: null, name, commandLine }
}

describe('listBackgroundProcesses', () => {
  it('ignores the shell itself and console helpers', () => {
    const tree = [entry(10, 'powershell.exe'), entry(11, 'conhost.exe'), entry(12, 'node.exe', 'node server.js')]
    expect(listBackgroundProcesses(tree, 10).map((item) => item.pid)).toEqual([12])
  })

  it('is empty when only the shell is left', () => {
    expect(listBackgroundProcesses([entry(10, 'bash')], 10)).toEqual([])
  })
})

describe('describeRunningPrograms', () => {
  it('names what the shell runs and the programs it started, once each', () => {
    const processes = [
      entry(20, 'claude.exe', 'C:\\bin\\claude.exe', 10),
      entry(21, 'cmd.exe', 'cmd /d /s /c "npx @playwright/mcp@latest"', 20),
      entry(22, 'node.exe', 'node npx-cli.js @playwright/mcp@latest', 21),
      entry(23, 'Pencil.exe', 'Pencil', 20),
      entry(24, 'node.exe', 'node', 20)
    ]
    expect(describeRunningPrograms(processes, 10)).toEqual({ program: 'claude', helpers: ['@playwright/mcp', 'Pencil'] })
  })

  it('has no program name when the shell only runs a bare runtime', () => {
    expect(describeRunningPrograms([entry(20, 'node.exe', 'node', 10)], 10)).toEqual({ program: null, helpers: [] })
  })
})
