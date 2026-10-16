import type { ProcessUsage, ResourceSnapshot } from './types'

export function sumUsage(items: ProcessUsage[]): ProcessUsage {
  return items.reduce(
    (total, item) => ({
      cpuPercent: total.cpuPercent + item.cpuPercent,
      workingSetBytes: total.workingSetBytes + item.workingSetBytes,
      privateBytes: total.privateBytes + item.privateBytes
    }),
    { cpuPercent: 0, workingSetBytes: 0, privateBytes: 0 }
  )
}

export function withAppUsage(snapshot: ResourceSnapshot, app: ProcessUsage): ResourceSnapshot {
  return { ...snapshot, app, total: sumUsage([app, ...snapshot.terminals]) }
}
