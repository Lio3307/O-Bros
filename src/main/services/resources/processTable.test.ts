import { describe, expect, it } from 'vitest'
import { collectProcessTree, type ProcessEntry, withoutControlCharacters } from './processTable'

function entry(pid: number, parentPid: number, startedAt: number | null = null): ProcessEntry {
  return { pid, parentPid, workingSetBytes: 0, privateBytes: 0, cpuTimeMs: null, cpuPercent: null, startedAt, name: '', commandLine: '' }
}

describe('collectProcessTree', () => {
  const table = [entry(1, 0), entry(10, 1), entry(11, 10), entry(12, 10), entry(20, 1), entry(30, 99)]

  it('returns the root and every descendant', () => {
    const pids = collectProcessTree(table, 10).map((item) => item.pid).sort((first, second) => first - second)
    expect(pids).toEqual([10, 11, 12])
  })

  it('does not include siblings or unrelated processes', () => {
    const pids = collectProcessTree(table, 20).map((item) => item.pid)
    expect(pids).toEqual([20])
  })

  it('is empty when the root process is gone', () => {
    expect(collectProcessTree(table, 777)).toEqual([])
  })

  it('skips a process whose parent ended and whose number Windows gave to a newer process', () => {
    const reused = [entry(1168, 50, 900), entry(1296, 1168, 100), entry(1884, 1296, 110), entry(2000, 1168, 950)]
    expect(collectProcessTree(reused, 1168).map((item) => item.pid)).toEqual([1168, 2000])
  })

  it('survives a process that lists itself as its parent', () => {
    const selfParent = [entry(5, 5)]
    expect(collectProcessTree(selfParent, 5).map((item) => item.pid)).toEqual([5])
  })
})

describe('withoutControlCharacters', () => {
  it('makes PowerShell JSON with raw control characters in a command line readable', () => {
    const broken = '[{"CommandLine":"tool --name ' + String.fromCharCode(27) + '[0m' + String.fromCharCode(1) + '"}]' + String.fromCharCode(13, 10)
    expect(() => JSON.parse(broken)).toThrow()
    expect(JSON.parse(withoutControlCharacters(broken))).toEqual([{ CommandLine: 'tool --name  [0m ' }])
  })
})
