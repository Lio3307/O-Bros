import { app } from 'electron'
import { cpus } from 'node:os'
import { sumUsage } from '../../../shared/processUsage'
import type { ProcessUsage, ResourceSnapshot, TerminalResource } from '../../../shared/types'
import { listRunningTerminals } from '../ptyManager'
import { collectProcessTree, readProcessTable, type ProcessEntry } from './processTable'

const BYTES_PER_KILOBYTE = 1024
const FULL_PERCENT = 100

interface CpuSample {
  cpuTimeMs: number
  takenAt: number
}

const previousCpuSamples = new Map<string, CpuSample>()

function readAppUsage(cpuCount: number): ProcessUsage {
  const processes = app.getAppMetrics().map((metrics) => ({
    cpuPercent: metrics.cpu.percentCPUUsage / cpuCount,
    workingSetBytes: metrics.memory.workingSetSize * BYTES_PER_KILOBYTE,
    privateBytes: (metrics.memory.privateBytes ?? metrics.memory.workingSetSize) * BYTES_PER_KILOBYTE
  }))
  return sumUsage(processes)
}

function cpuPercentFromTimes(paneId: string, tree: ProcessEntry[], cpuCount: number, now: number): number {
  const totalCpuTimeMs = tree.reduce((sum, entry) => sum + (entry.cpuTimeMs ?? 0), 0)
  const previous = previousCpuSamples.get(paneId)
  previousCpuSamples.set(paneId, { cpuTimeMs: totalCpuTimeMs, takenAt: now })

  if (previous === undefined || now <= previous.takenAt) {
    return 0
  }
  const usedMs = Math.max(totalCpuTimeMs - previous.cpuTimeMs, 0)
  return (usedMs / ((now - previous.takenAt) * cpuCount)) * FULL_PERCENT
}

function measureTerminal(paneId: string, pid: number, table: ProcessEntry[], cpuCount: number, now: number): TerminalResource {
  const tree = collectProcessTree(table, pid)
  const hasCpuTimes = tree.some((entry) => entry.cpuTimeMs !== null)
  const cpuPercent = hasCpuTimes
    ? cpuPercentFromTimes(paneId, tree, cpuCount, now)
    : tree.reduce((sum, entry) => sum + (entry.cpuPercent ?? 0), 0) / cpuCount

  return {
    paneId,
    cpuPercent,
    workingSetBytes: tree.reduce((sum, entry) => sum + entry.workingSetBytes, 0),
    privateBytes: tree.reduce((sum, entry) => sum + entry.privateBytes, 0)
  }
}

export function readAppUsageNow(): ProcessUsage {
  return readAppUsage(cpus().length)
}

export async function readResourceSnapshot(): Promise<ResourceSnapshot> {
  const cpuCount = cpus().length
  const now = Date.now()
  const runningTerminals = listRunningTerminals()
  const table = runningTerminals.length > 0 ? await readProcessTable() : []

  const terminals = runningTerminals.map(({ id, pid }) => measureTerminal(id, pid, table, cpuCount, now))

  const runningIds = new Set(runningTerminals.map((terminal) => terminal.id))
  for (const trackedId of previousCpuSamples.keys()) {
    if (!runningIds.has(trackedId)) {
      previousCpuSamples.delete(trackedId)
    }
  }

  const appUsage = readAppUsage(cpuCount)
  return { total: sumUsage([appUsage, ...terminals]), app: appUsage, terminals }
}
