import { RefreshCw, Timer } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatBytes } from '../../../shared/format'
import { useLayoutStore } from '../../state/layoutStore'
import { useRecentFilesStore } from '../../state/recentFilesStore'
import { useResourcesStore } from '../../state/resourcesStore'
import { useStorageStore } from '../../state/storageStore'
import { useTeamStore } from '../../state/teamStore'
import { Button } from '../../ui/Button'
import { SettingsPageLayout } from '../../ui/SettingsPageLayout'
import { SettingsSection } from '../../ui/SettingsSection'
import { StatTile } from '../../ui/StatTile'
import { CleanupRow, pluralize } from './CleanupRow'
import { ConversationsSection, useConversationStorage } from './ConversationsSection'
import { DataLocationsSection } from './DataLocationsSection'
import { DiskOverviewSection } from './DiskOverviewSection'
import { HardwareAccelerationSetting } from './HardwareAccelerationSetting'
import { UniversalHistorySection } from './UniversalHistorySection'
import { useDiskReports } from './useDiskReports'
import './settings.css'
import './settingsControls.css'
import './storagePage.css'

const WAITING = '…'

function useTeamMemoryBytes(): number | null {
  const members = useTeamStore((state) => state.members)
  const snapshot = useResourcesStore((state) => state.snapshot)
  if (snapshot === null) {
    return null
  }
  const memberIds = new Set(members.map((member) => member.id))
  return snapshot.terminals.filter((terminal) => memberIds.has(terminal.paneId)).reduce((total, terminal) => total + terminal.privateBytes, 0)
}

function safeText(safeBytes: number | null): string {
  if (safeBytes === null) {
    return 'Measuring…'
  }
  return safeBytes === 0 ? 'Nothing is taking up space here right now.' : `${formatBytes(safeBytes)} can go right now. Nothing you made is lost; it is rebuilt when needed.`
}

function SafeCleanupSection() {
  const report = useStorageStore((state) => state.report)
  const clearAppCache = useStorageStore((state) => state.clearAppCache)
  const clearLeftoverTemp = useStorageStore((state) => state.clearLeftoverTemp)
  const clearTeamTaskFiles = useStorageStore((state) => state.clearTeamTaskFiles)
  const clearRecentFiles = useStorageStore((state) => state.clearRecentFiles)
  const clearSafeItems = useStorageStore((state) => state.clearSafeItems)
  const recentFileCount = useRecentFilesStore((state) => state.paths.length)
  const isMeasuring = report === null
  const taskFileCount = report?.teamTaskFileCount ?? 0
  const safeBytes = report === null ? null : report.appCacheBytes + report.leftoverTempBytes + report.teamTaskFileBytes

  return (
    <SettingsSection
      title="Free space safely"
      description={safeText(safeBytes)}
      actions={
        <Button variant="outline" disabled={safeBytes === null || (safeBytes === 0 && recentFileCount === 0)} onClick={() => clearSafeItems()}>
          Clear all safe items
        </Button>
      }
    >
      <details className="storage-details">
        <summary>Show what this clears</summary>
        <div className="table">
          <CleanupRow
            title="App cache"
            description="Files the O-BROS window keeps so it starts faster."
            amount={isMeasuring ? null : formatBytes(report.appCacheBytes)}
            buttonLabel="Clear"
            effect="the space is freed now; the next start may take a moment longer while the cache is rebuilt."
            isDisabled={isMeasuring || report.appCacheBytes === 0}
            onClean={() => clearAppCache()}
          />
          <CleanupRow
            title="Leftover temporary files"
            description="Short-lived lint folders that a crash left behind."
            amount={isMeasuring ? null : pluralize(report.leftoverTempFolders, 'folder', 'folders') + ', ' + formatBytes(report.leftoverTempBytes)}
            buttonLabel="Remove"
            effect="they are deleted. Folders still in use (younger than a minute) are skipped."
            isDisabled={isMeasuring || report.leftoverTempFolders === 0}
            onClean={() => clearLeftoverTemp()}
          />
          <CleanupRow
            title="Team task files"
            description="Long tasks handed to team members. Normally empty, because wot deletes each one after reading it."
            amount={isMeasuring ? null : `${pluralize(taskFileCount, 'file', 'files')}, ${formatBytes(report.teamTaskFileBytes)}`}
            buttonLabel="Delete"
            effect="they are deleted. A task a member has not read yet would be lost, so do it when no member is starting."
            isDisabled={taskFileCount === 0}
            onClean={() => clearTeamTaskFiles()}
          />
          <CleanupRow
            title="Recent files list"
            description="The file names Quick open shows when its search box is empty."
            amount={pluralize(recentFileCount, 'file', 'files')}
            buttonLabel="Clear"
            effect="the list is emptied; the files themselves are not touched."
            isDisabled={recentFileCount === 0}
            onClean={clearRecentFiles}
          />
        </div>
      </details>
    </SettingsSection>
  )
}

function MemorySection() {
  const terminalMemory = useStorageStore((state) => state.terminalMemory)
  const clearTerminalScrollback = useStorageStore((state) => state.clearTerminalScrollback)
  const stopAllTeamMembers = useStorageStore((state) => state.stopAllTeamMembers)
  const members = useTeamStore((state) => state.members)
  const teamMemoryBytes = useTeamMemoryBytes()
  const appMemoryBytes = useResourcesStore((state) => state.snapshot?.app.privateBytes ?? null)
  const openSection = useLayoutStore((state) => state.openSection)
  const selectSettingsPage = useLayoutStore((state) => state.selectSettingsPage)

  function openTeamSettings(): void {
    selectSettingsPage('team')
    openSection('settings')
  }

  return (
    <SettingsSection
      title="Memory right now"
      description="What uses memory (RAM) while O-BROS is open. Nothing here deletes files."
      actions={
        <Button variant="outline" onClick={openTeamSettings}>
          <Timer size={14} /> Team auto-stop settings
        </Button>
      }
    >
      <div className="memory-tiles">
        <StatTile value={appMemoryBytes === null ? WAITING : formatBytes(appMemoryBytes)} label="O-BROS itself, without the agents in its terminals" />
        <StatTile value={terminalMemory.bufferedLines.toLocaleString()} label={`lines of scrollback in ${pluralize(terminalMemory.terminalCount, 'terminal', 'terminals')}`}>
          <Button
            variant="outline"
            title="Memory is freed; you can no longer scroll back to those lines. Running programs and the visible screen stay."
            disabled={terminalMemory.terminalCount === 0}
            onClick={clearTerminalScrollback}
          >
            Clear
          </Button>
        </StatTile>
        <StatTile value={members.length === 0 ? 'None' : teamMemoryBytes === null ? String(members.length) : formatBytes(teamMemoryBytes)} label={members.length === 0 ? 'team members running' : pluralize(members.length, 'team member', 'team members') + ' running'}>
          <Button
            variant="outline"
            className="hover-danger"
            title="Every member stops and unfinished work in its current task is lost. Files they changed and their saved conversations stay."
            disabled={members.length === 0}
            onClick={stopAllTeamMembers}
          >
            Stop all
          </Button>
        </StatTile>
      </div>
    </SettingsSection>
  )
}

export function StoragePage() {
  const refresh = useStorageStore((state) => state.refresh)
  const disks = useDiskReports()
  const { storage, reload } = useConversationStorage()
  const [openFolderId, setOpenFolderId] = useState<string | null>(null)

  useEffect(() => {
    void refresh()
  }, [refresh])

  function openFolderFromMap(folderId: string): void {
    setOpenFolderId(folderId)
    requestAnimationFrame(() => {
      document.querySelector(`[data-folder-id="${CSS.escape(folderId)}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })
  }

  return (
    <SettingsPageLayout
      title="Storage and memory"
      description="What O-BROS and your agents keep on this computer, and how to get space back. Nothing is uploaded anywhere."
      actions={
        <Button variant="outline" onClick={() => Promise.all([refresh(), reload()])}>
          <RefreshCw size={14} /> Measure again
        </Button>
      }
    >
      <DiskOverviewSection reports={disks} folders={storage?.folders ?? []} onOpenFolder={openFolderFromMap} />
      <ConversationsSection storage={storage} reload={reload} openFolderId={openFolderId} onOpenFolder={setOpenFolderId} />
      <SafeCleanupSection />
      <UniversalHistorySection />
      <MemorySection />
      <HardwareAccelerationSetting />
      <DataLocationsSection />
    </SettingsPageLayout>
  )
}
