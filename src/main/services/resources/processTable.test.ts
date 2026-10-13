import { describe, expect, it } from 'vitest'
import { collectProcessTree, type ProcessEntry } from './processTable'

function entry(pid: number, parentPid: number): ProcessEntry {
  return { pid, parentPid, workingSetBytes: 0, privateBytes: 0, cpuTimeMs: null, cpuPercent: null, name: '', commandLine: '' }
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

  it('survives a process that lists itself as its parent', () => {
    const selfParent = [entry(5, 5)]
    expect(collectProcessTree(selfParent, 5).map((item) => item.pid)).toEqual([5])
  })
})
