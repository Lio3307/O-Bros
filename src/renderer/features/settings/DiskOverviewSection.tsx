import { HardDrive, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatBytes } from '../../../shared/format'
import type { DiskItemKind, DiskReport } from '../../../shared/types'
import { useStorageStore } from '../../state/storageStore'
import { LoadingText } from '../../ui/LoadingText'
import { SettingsSection } from '../../ui/SettingsSection'
import { UsageBar } from '../../ui/UsageBar'

const LOW_SPACE_BYTES = 10 * 1024 * 1024 * 1024
const LOW_SPACE_SHARE = 0.1

const KIND_NOTES: Record<DiskItemKind, string> = {
  conversations: 'Saved by the agent',
  history: 'O-BROS copy of your chats',
  app: 'O-BROS itself',
  updates: 'Installer waiting to install'
}

function isLowOnSpace(report: DiskReport): boolean {
  return report.drive.freeBytes < LOW_SPACE_BYTES || report.drive.freeBytes < report.drive.totalBytes * LOW_SPACE_SHARE
}

function DriveCard({ report }: { report: DiskReport }) {
  const { drive, items } = report
  const usedPercent = drive.totalBytes === 0 ? null : ((drive.totalBytes - drive.freeBytes) / drive.totalBytes) * 100
  const keptBytes = items.reduce((total, item) => total + item.bytes, 0)

  return (
    <div className={isLowOnSpace(report) ? 'disk-card disk-card-low' : 'disk-card'}>
      <div className="disk-card-head">
        <HardDrive size={16} />
        <span className="account-label">{drive.root}</span>
        <span className="muted">
          {formatBytes(drive.freeBytes)} free of {formatBytes(drive.totalBytes)}
        </span>
        <span className="muted disk-card-kept">O-BROS and your agents keep {formatBytes(keptBytes)} here</span>
      </div>
      <UsageBar percentUsed={usedPercent} />
      {isLowOnSpace(report) && (
        <p className="disk-card-warning">
          <TriangleAlert size={14} /> This drive is almost full. You can move agent conversations or the universal history to
          another drive below, or delete old conversations.
        </p>
      )}
      <div className="disk-items">
        {items.map((item) => (
          <div key={item.kind + item.path} className="disk-item" title={item.path}>
            <span className="disk-item-label">{item.label}</span>
            <span className="muted disk-item-note">{KIND_NOTES[item.kind]}</span>
            <span className="disk-item-size">{formatBytes(item.bytes)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DiskOverviewSection() {
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

  return (
    <SettingsSection
      title="Your disks"
      description="How much space is free on each drive, and what O-BROS and your agents keep there. Hover a line to see its folder."
    >
      {reports === null && <p className="panel-empty"><LoadingText text="Measuring your drives…" /></p>}
      {reports !== null && reports.length === 0 && <p className="muted">Nothing to show yet.</p>}
      {reports !== null && reports.map((report) => <DriveCard key={report.drive.root} report={report} />)}
    </SettingsSection>
  )
}
