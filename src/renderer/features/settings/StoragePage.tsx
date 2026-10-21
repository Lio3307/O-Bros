import { RefreshCw, Timer } from 'lucide-react'
import { useEffect } from 'react'
import { formatBytes } from '../../../shared/format'
import { useLayoutStore } from '../../state/layoutStore'
import { useRecentFilesStore } from '../../state/recentFilesStore'
import { useResourcesStore } from '../../state/resourcesStore'
import { useStorageStore } from '../../state/storageStore'
import { useTeamStore } from '../../state/teamStore'
import { Button } from '../../ui/Button'
import { SettingsPageLayout } from '../../ui/SettingsPageLayout'
import { SettingsSection } from '../../ui/SettingsSection'
import { CleanupRow, pluralize } from './CleanupRow'
import { ConversationFolderSection } from './ConversationFolderSection'
import { DataLocationsSection } from './DataLocationsSection'
import { DiskOverviewSection } from './DiskOverviewSection'
import { HardwareAccelerationSetting } from './HardwareAccelerationSetting'
import { SafetyLabel, SAFETY_COPY, type Safety } from './SafetyLabel'
import { SavedSessionsSection } from './SavedSessionsSection'
import { UniversalHistorySection } from './UniversalHistorySection'
import './settings.css'
import './settingsControls.css'

const SAFETY_ORDER: Safety[] = ['safe', 'undoable', 'permanent']

function SafetyLegend() {
  return (
    <div className="safety-legend">
      {SAFETY_ORDER.map((safety) => (
        <span key={safety} className="safety-legend-item">
          <SafetyLabel safety={safety} />
          <span className="muted">{SAFETY_COPY[safety].explanation}</span>
        </span>
      ))}
    </div>
  )
}

function useTeamMemoryBytes(): number | null {
  const members = useTeamStore((state) => state.members)
  const snapshot = useResourcesStore((state) => state.snapshot)
  if (snapshot === null) {
    return null
  }
  const memberIds = new Set(members.map((member) => member.id))
  return snapshot.terminals.filter((terminal) => memberIds.has(terminal.paneId)).reduce((total, terminal) => total + terminal.privateBytes, 0)
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

  return (
    <SettingsSection
      title="Free space safely"
      description="Everything here is rebuilt when needed. The worst case is that something loads a little slower once."
      actions={
        <Button variant="outline" onClick={() => clearSafeItems()}>
          Clear all safe items
        </Button>
      }
    >
      <div className="table">
        <CleanupRow
          title="App cache"
          description="Files the O-BROS window keeps so it starts faster."
          amount={isMeasuring ? null : formatBytes(report.appCacheBytes)}
          buttonLabel="Clear"
          safety="safe"
          effect="the space is freed now; the next start may take a moment longer while the cache is rebuilt."
          isDisabled={isMeasuring || report.appCacheBytes === 0}
          onClean={() => clearAppCache()}
        />
        <CleanupRow
          title="Leftover temporary files"
          description="Short-lived lint folders that a crash left in the system temp folder."
          amount={isMeasuring ? null : pluralize(report.leftoverTempFolders, 'folder', 'folders') + ', ' + formatBytes(report.leftoverTempBytes)}
          buttonLabel="Remove"
          safety="safe"
          effect="they are deleted. Folders still in use (younger than a minute) are skipped."
          isDisabled={isMeasuring || report.leftoverTempFolders === 0}
          onClean={() => clearLeftoverTemp()}
        />
        <CleanupRow
          title="Team task files"
          description="Text files agents write to hand a long task to a team member. wot deletes each one after reading it, so this is normally empty."
          amount={isMeasuring ? null : `${pluralize(taskFileCount, 'file', 'files')}, ${formatBytes(report.teamTaskFileBytes)}`}
          buttonLabel="Delete"
          safety="safe"
          effect="they are deleted. A task a member has not read yet would be lost, so do it when no member is starting."
          isDisabled={taskFileCount === 0}
          onClean={() => clearTeamTaskFiles()}
        />
        <CleanupRow
          title="Recent files list"
          description="The file names Quick open shows when its search box is empty."
          amount={pluralize(recentFileCount, 'file', 'files')}
          buttonLabel="Clear"
          safety="safe"
          effect="the list is emptied; the files themselves are not touched."
          isDisabled={recentFileCount === 0}
          onClean={clearRecentFiles}
        />
      </div>
    </SettingsSection>
  )
}

function MemorySection() {
  const terminalMemory = useStorageStore((state) => state.terminalMemory)
  const clearTerminalScrollback = useStorageStore((state) => state.clearTerminalScrollback)
  const stopAllTeamMembers = useStorageStore((state) => state.stopAllTeamMembers)
  const members = useTeamStore((state) => state.members)
  const teamMemoryBytes = useTeamMemoryBytes()
  const openSection = useLayoutStore((state) => state.openSection)
  const selectSettingsPage = useLayoutStore((state) => state.selectSettingsPage)

  function openTeamSettings(): void {
    selectSettingsPage('team')
    openSection('settings')
  }

  const memberAmount =
    members.length === 0
      ? 'none running'
      : `${pluralize(members.length, 'member', 'members')}${teamMemoryBytes === null ? '' : `, ${formatBytes(teamMemoryBytes)}`}`

  return (
    <SettingsSection
      title="Memory right now"
      description="What uses your computer's memory (RAM) while O-BROS is open. Nothing here deletes files."
      actions={
        <Button variant="outline" onClick={openTeamSettings}>
          <Timer size={14} /> Team auto-stop settings
        </Button>
      }
    >
      <div className="table">
        <CleanupRow
          title="Terminal history in memory"
          description="Lines that scrolled off the top of every open terminal."
          amount={terminalMemory.bufferedLines.toLocaleString() + ' lines in ' + pluralize(terminalMemory.terminalCount, 'terminal', 'terminals')}
          buttonLabel="Clear"
          safety="safe"
          effect="memory is freed; you can no longer scroll back to those lines. Running programs and the visible screen stay."
          isDisabled={terminalMemory.terminalCount === 0}
          onClean={clearTerminalScrollback}
        />
        <CleanupRow
          title="Running team members"
          description="Agents a lead summoned with wot. Each one is a running agent that uses memory."
          amount={memberAmount}
          buttonLabel="Stop all"
          safety="permanent"
          effect="every member stops and its terminal closes; unfinished work in a member's turn is lost. Files they changed and their saved conversations stay."
          isDisabled={members.length === 0}
          onClean={stopAllTeamMembers}
        />
      </div>
    </SettingsSection>
  )
}

export function StoragePage() {
  const refresh = useStorageStore((state) => state.refresh)

  useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <SettingsPageLayout
      title="Storage and memory"
      description={
        <>
          See what O-BROS and your agents keep on your disks and in memory, and free space when you need it. Every action
          says what happens before you press it, and anything that cannot be undone asks first. Your project files, git
          history and agent logins are never touched here.
        </>
      }
      actions={
        <Button variant="outline" onClick={() => refresh()}>
          <RefreshCw size={14} /> Measure again
        </Button>
      }
    >
      <SafetyLegend />
      <DiskOverviewSection />
      <SafeCleanupSection />
      <h2 className="storage-group-title">Conversations</h2>
      <UniversalHistorySection />
      <ConversationFolderSection />
      <SavedSessionsSection />
      <MemorySection />
      <HardwareAccelerationSetting />
      <DataLocationsSection />
    </SettingsPageLayout>
  )
}
