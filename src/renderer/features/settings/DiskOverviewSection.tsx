import { HardDrive } from 'lucide-react'
import { formatBytes } from '../../../shared/format'
import { storageBlocks, type StorageBlock } from '../../../shared/storageMap'
import type { ConversationFolder, DiskReport } from '../../../shared/types'
import { AgentIcon } from '../../ui/AgentIcon'
import { LoadingText } from '../../ui/LoadingText'
import { Notice } from '../../ui/Notice'
import { SettingsSection } from '../../ui/SettingsSection'
import { UsageBar } from '../../ui/UsageBar'
import { isLowOnSpace, keptBytesOf } from './useDiskReports'
import './storagePage.css'

const LABEL_FROM_SHARE = 0.14
const ICON_FROM_SHARE = 0.025
const TONE_COUNT = 6

interface SpaceMapProps {
  reports: DiskReport[] | null
  folders: ConversationFolder[]
  onOpenFolder: (folderId: string) => void
}

function folderAt(folders: ConversationFolder[], path: string | null): ConversationFolder | undefined {
  return path === null ? undefined : folders.find((folder) => folder.path === path || folder.movedTo === path)
}

function toneOf(index: number): number {
  return Math.min(index, TONE_COUNT - 1)
}

function SpaceBlock({ block, index, folder, onOpen }: { block: StorageBlock; index: number; folder: ConversationFolder | undefined; onOpen: () => void }) {
  const content = (
    <>
      {folder !== undefined && block.share >= ICON_FROM_SHARE && <AgentIcon command={folder.program} size={16} />}
      {block.share >= LABEL_FROM_SHARE && <span className="space-block-label">{block.label}</span>}
    </>
  )
  const style = { flexGrow: block.share }
  const className = `space-block space-block-tone-${toneOf(index)}`
  return folder === undefined ? (
    <div className={className} style={style} title={block.title}>
      {content}
    </div>
  ) : (
    <button type="button" className={`${className} space-block-link`} style={style} title={`${block.title}\nClick to manage`} onClick={onOpen}>
      {content}
    </button>
  )
}

function DriveMap({ report, folders, onOpenFolder }: { report: DiskReport; folders: ConversationFolder[]; onOpenFolder: (folderId: string) => void }) {
  const { drive, items } = report
  const usedPercent = drive.totalBytes === 0 ? null : ((drive.totalBytes - drive.freeBytes) / drive.totalBytes) * 100
  const isLow = isLowOnSpace(report)
  const blocks = storageBlocks(items, formatBytes)

  return (
    <div className={isLow ? 'space-map space-map-low' : 'space-map'}>
      <div className="space-map-head">
        <span className="space-map-free">
          <strong>{formatBytes(drive.freeBytes)}</strong> free
        </span>
        <span className="space-map-drive muted">
          <HardDrive size={14} /> {drive.root} · {formatBytes(drive.totalBytes)} disk
        </span>
      </div>
      <UsageBar percentUsed={usedPercent} tone={isLow ? 'danger' : 'normal'} />
      {isLow && (
        <Notice tone="danger" title="This drive is almost full.">
          Open an agent below to delete old conversations or move them to another drive.
        </Notice>
      )}
      {blocks.length > 0 && (
        <>
          <p className="space-map-kept muted">
            O-BROS and your agents keep <strong>{formatBytes(keptBytesOf(report))}</strong> here
          </p>
          <div className="space-strip">
            {blocks.map((block, index) => {
              const folder = folderAt(folders, block.path)
              return <SpaceBlock key={block.key} block={block} index={index} folder={folder} onOpen={() => folder !== undefined && onOpenFolder(folder.id)} />
            })}
          </div>
          <ul className="space-legend">
            {blocks.map((block, index) => (
              <li key={block.key} title={block.title}>
                <span className={`space-swatch space-block-tone-${toneOf(index)}`} />
                <span>{block.label}</span>
                <span className="muted">{formatBytes(block.bytes)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

export function DiskOverviewSection({ reports, folders, onOpenFolder }: SpaceMapProps) {
  return (
    <SettingsSection title="Your disks">
      {reports === null && <p className="panel-empty"><LoadingText text="Measuring your drives…" /></p>}
      {reports !== null && reports.length === 0 && <p className="muted">Nothing to show yet.</p>}
      {reports !== null && reports.map((report) => <DriveMap key={report.drive.root} report={report} folders={folders} onOpenFolder={onOpenFolder} />)}
    </SettingsSection>
  )
}
