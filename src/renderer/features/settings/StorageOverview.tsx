import { TriangleAlert } from 'lucide-react'
import { formatBytes } from '../../../shared/format'
import type { DiskReport } from '../../../shared/types'
import { useResourcesStore } from '../../state/resourcesStore'
import { useStorageStore } from '../../state/storageStore'
import { Button } from '../../ui/Button'
import { StatTile } from '../../ui/StatTile'
import { UsageBar } from '../../ui/UsageBar'
import { isLowOnSpace, keptBytesOf } from './useDiskReports'

const WAITING = '…'

function freeShare(report: DiskReport): number {
  return report.drive.totalBytes === 0 ? 1 : report.drive.freeBytes / report.drive.totalBytes
}

function FullestDriveTile({ reports }: { reports: DiskReport[] | null }) {
  const fullest = reports === null || reports.length === 0 ? null : reports.reduce((least, report) => (freeShare(report) < freeShare(least) ? report : least))
  if (fullest === null) {
    return <StatTile value={WAITING} label="Free disk space" />
  }
  const { drive } = fullest
  return (
    <StatTile value={formatBytes(drive.freeBytes)} label={`Free on ${drive.root} of ${formatBytes(drive.totalBytes)}`}>
      <UsageBar percentUsed={(1 - freeShare(fullest)) * 100} />
      {isLowOnSpace(fullest) && (
        <span className="stat-tile-warning">
          <TriangleAlert size={12} /> Almost full
        </span>
      )}
    </StatTile>
  )
}

export function StorageOverview({ reports }: { reports: DiskReport[] | null }) {
  const report = useStorageStore((state) => state.report)
  const clearSafeItems = useStorageStore((state) => state.clearSafeItems)
  const memoryBytes = useResourcesStore((state) => state.snapshot?.app.privateBytes ?? null)
  const keptBytes = reports === null ? null : reports.reduce((total, disk) => total + keptBytesOf(disk), 0)
  const safeBytes = report === null ? null : report.appCacheBytes + report.leftoverTempBytes + report.teamTaskFileBytes

  return (
    <div className={reports !== null && reports.some(isLowOnSpace) ? 'monitor-tiles storage-tiles storage-tiles-low' : 'monitor-tiles storage-tiles'}>
      <FullestDriveTile reports={reports} />
      <StatTile value={keptBytes === null ? WAITING : formatBytes(keptBytes)} label="Kept by O-BROS and your agents" />
      <StatTile value={safeBytes === null ? WAITING : formatBytes(safeBytes)} label="Safe to free now">
        <Button variant="outline" className="stat-tile-action" disabled={safeBytes === null || safeBytes === 0} onClick={() => clearSafeItems()}>
          Free it
        </Button>
      </StatTile>
      <StatTile value={memoryBytes === null ? WAITING : formatBytes(memoryBytes)} label="Memory used by O-BROS (agents in its terminals not counted)" />
    </div>
  )
}
