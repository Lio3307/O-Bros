import { useEffect, useState } from 'react'
import type { DiskReport } from '../../../shared/types'
import { useStorageStore } from '../../state/storageStore'

const LOW_SPACE_BYTES = 10 * 1024 * 1024 * 1024
const LOW_SPACE_SHARE = 0.1

export function isLowOnSpace(report: DiskReport): boolean {
  return report.drive.freeBytes < LOW_SPACE_BYTES || report.drive.freeBytes < report.drive.totalBytes * LOW_SPACE_SHARE
}

export function keptBytesOf(report: DiskReport): number {
  return report.items.reduce((total, item) => total + item.bytes, 0)
}

export function useDiskReports(): DiskReport[] | null {
  const [reports, setReports] = useState<DiskReport[] | null>(null)
  const measuredAt = useStorageStore((state) => state.measuredAt)

  useEffect(() => {
    let isCurrent = true
    window.api.storage
      .disks()
      .then((found) => isCurrent && setReports(found))
      .catch(() => isCurrent && setReports([]))
    return () => {
      isCurrent = false
    }
  }, [measuredAt])

  return reports
}
