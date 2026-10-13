import { describe, expect, it } from 'vitest'
import { describeBackgroundCommands, listBackgroundProcesses } from './backgroundProcesses'
import type { ProcessEntry } from './processTable'

function entry(pid: number, name: string, commandLine = name): ProcessEntry {
  return { pid, parentPid: 0, workingSetBytes: 0, privateBytes: 0, cpuTimeMs: null, cpuPercent: null, name, commandLine }
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

describe('describeBackgroundCommands', () => {
  it('lists each command once', () => {
    const processes = [entry(1, 'node.exe', 'node a.js'), entry(2, 'node.exe', 'node a.js'), entry(3, 'git.exe')]
    expect(describeBackgroundCommands(processes)).toEqual(['node a.js', 'git.exe'])
  })

  it('shortens very long command lines', () => {
    const [command] = describeBackgroundCommands([entry(1, 'node.exe', 'x'.repeat(300))])
    expect(command.length).toBeLessThan(100)
  })
})
