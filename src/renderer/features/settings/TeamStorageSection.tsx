import { Timer } from 'lucide-react'
import { formatBytes } from '../../../shared/format'
import { useLayoutStore } from '../../state/layoutStore'
import { useResourcesStore } from '../../state/resourcesStore'
import { useStorageStore } from '../../state/storageStore'
import { useTeamStore } from '../../state/teamStore'
import { Button } from '../../ui/Button'
import { SettingsSection } from '../../ui/SettingsSection'
import { CleanupRow, pluralize } from './CleanupRow'

function useTeamMemoryBytes(): number | null {
  const members = useTeamStore((state) => state.members)
  const snapshot = useResourcesStore((state) => state.snapshot)
  if (snapshot === null) {
    return null
  }
  const memberIds = new Set(members.map((member) => member.id))
  return snapshot.terminals
    .filter((terminal) => memberIds.has(terminal.paneId))
    .reduce((total, terminal) => total + terminal.privateBytes, 0)
}

export function TeamStorageSection() {
  const members = useTeamStore((state) => state.members)
  const memoryBytes = useTeamMemoryBytes()
  const report = useStorageStore((state) => state.report)
  const stopAllMembers = useStorageStore((state) => state.stopAllTeamMembers)
  const clearTeamTaskFiles = useStorageStore((state) => state.clearTeamTaskFiles)
  const teamChats = useStorageStore((state) => state.teamChats)
  const removeTeamChats = useStorageStore((state) => state.removeTeamChats)
  const openSection = useLayoutStore((state) => state.openSection)
  const selectSettingsPage = useLayoutStore((state) => state.selectSettingsPage)

  const memberAmount =
    members.length === 0
      ? 'none running'
      : `${pluralize(members.length, 'member', 'members')}${memoryBytes === null ? '' : `, ${formatBytes(memoryBytes)}`}`
  const taskFileCount = report?.teamTaskFileCount ?? 0

  function openTeamSettings(): void {
    selectSettingsPage('team')
    openSection('settings')
  }

  return (
    <SettingsSection
      title="Team (wot)"
      description={
        <>
          Team members are agents running in hidden terminals. Each agent saves their conversations like any other, so
          they also count under Saved conversations above. O-BROS can read Claude and Codex conversations, so those
          members are marked &quot;Team member&quot; in History and can be deleted here. Members of any other agent save
          their conversations in that agent's own folder, listed under Where your data lives.
        </>
      }
      actions={
        <Button variant="outline" onClick={openTeamSettings}>
          <Timer size={14} /> Auto-stop settings
        </Button>
      }
    >
      <div className="table">
        <CleanupRow
          title="Running team members"
          description="Each one is a running agent that uses memory. Stopping closes its terminal; files it changed stay as they are."
          amount={memberAmount}
          buttonLabel="Stop all"
          isDisabled={members.length === 0}
          onClean={stopAllMembers}
        />
        <CleanupRow
          title="Team member conversations"
          description="Conversations of Claude and Codex team members (the formats O-BROS can read). Deleting them frees disk space only; a member's work in your files stays. You can no longer resume or read them."
          amount={teamChats === null ? null : `${pluralize(teamChats.sessionCount, 'conversation', 'conversations')}, ${formatBytes(teamChats.totalBytes)}`}
          buttonLabel="Delete"
          isDisabled={teamChats === null || teamChats.sessionCount === 0}
          onClean={removeTeamChats}
        />
        <CleanupRow
          title="Task files"
          description="Short text files agents write to hand a long task to a team member. wot deletes each one after reading it, so this is normally empty."
          amount={report === null ? null : `${pluralize(taskFileCount, 'file', 'files')}, ${formatBytes(report.teamTaskFileBytes)}`}
          buttonLabel="Delete"
          isDisabled={taskFileCount === 0}
          onClean={clearTeamTaskFiles}
        />
      </div>
    </SettingsSection>
  )
}
