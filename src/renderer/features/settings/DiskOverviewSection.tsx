import { HardDrive, TriangleAlert } from 'lucide-react'
import { formatBytes } from '../../../shared/format'
import type { DiskItemKind, DiskReport } from '../../../shared/types'
import { LoadingText } from '../../ui/LoadingText'
import { SettingsSection } from '../../ui/SettingsSection'
import { UsageBar } from '../../ui/UsageBar'
import { isLowOnSpace, keptBytesOf } from './useDiskReports'

const KIND_NOTES: Record<DiskItemKind, string> = {
  conversations: 'Saved by the agent',
  history: 'O-BROS copy of your chats',
  app: 'O-BROS itself',
  updates: 'Installer waiting to install'
}

function DriveCard({ report }: { report: DiskReport }) {
  const { drive, items } = report
  const usedPercent = drive.totalBytes === 0 ? null : ((drive.totalBytes - drive.freeBytes) / drive.totalBytes) * 100
  const isLow = isLowOnSpace(report)

  return (
    <div className={isLow ? 'disk-card disk-card-low' : 'disk-card'}>
      <div className="disk-card-head">
        <HardDrive size={16} />
        <span className="account-label">{drive.root}</span>
        <span className="disk-card-free">
          <strong>{formatBytes(drive.freeBytes)}</strong> free of {formatBytes(drive.totalBytes)}
        </span>
        <span className="muted disk-card-kept">O-BROS and agents: {formatBytes(keptBytesOf(report))}</span>
      </div>
      <UsageBar percentUsed={usedPercent} />
      {isLow && (
        <p className="disk-card-warning">
          <TriangleAlert size={14} /> Almost full. Move conversations to another drive or delete old ones below.
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

export function DiskOverviewSection({ reports }: { reports: DiskReport[] | null }) {
  return (
    <SettingsSection title="Your disks" description="Free space on each drive, and what O-BROS and your agents keep there. Hover a line to see its folder.">
      {reports === null && <p className="panel-empty"><LoadingText text="Measuring your drives…" /></p>}
      {reports !== null && reports.length === 0 && <p className="muted">Nothing to show yet.</p>}
      {reports !== null && reports.map((report) => <DriveCard key={report.drive.root} report={report} />)}
    </SettingsSection>
  )
}
