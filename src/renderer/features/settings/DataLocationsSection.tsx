import { FolderOpen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { friendlyErrorMessage } from '../../../shared/friendlyError'
import type { DataLocation, DataLocationKind } from '../../../shared/types'
import { toast } from '../../state/toastStore'
import './settings.css'
import './settingsControls.css'
import { Button } from '../../ui/Button'
import { SettingsSection } from '../../ui/SettingsSection'

interface LocationCopy {
  title: string
  note: string
}

const COPY_BY_KIND: Record<DataLocationKind, LocationCopy> = {
  program: {
    title: 'The o-bros program',
    note: 'The installed app itself. Do not change files here. Uninstall o-bros from your system settings to remove it. Your settings below stay, so a reinstall keeps your setup.'
  },
  updater: {
    title: 'Downloaded updates',
    note: 'The installer of a new version that o-bros downloaded and is waiting to install. It can be about 100 MB. The folder only exists after you download an update.'
  },
  appData: {
    title: 'o-bros settings and app data',
    note: 'Your list of project folders, your open tabs and settings, and the app caches. Delete it only while o-bros is closed. You would lose your folders list and settings, nothing else.'
  },
  logs: {
    title: 'o-bros log file',
    note: 'A short text file about crashes and errors. It never contains your conversations or file contents. Safe to delete.'
  },
  claudeSessions: {
    title: 'Claude conversations',
    note: 'Written by Claude Code, not by o-bros. The History panel only reads these files. To delete them, use History or Saved conversations above so o-bros can ask you first.'
  },
  codexSessions: {
    title: 'Codex conversations',
    note: 'Written by Codex, not by o-bros. The History panel only reads these files. To delete them, use History or Saved conversations above so o-bros can ask you first.'
  }
}

function LocationRow({ location }: { location: DataLocation }) {
  const copy = COPY_BY_KIND[location.kind]
  const title = location.accountLabel === null ? copy.title : `${copy.title} (${location.accountLabel})`

  async function open(): Promise<void> {
    try {
      await window.api.storage.openLocation(location.id)
    } catch (error) {
      toast.warning(friendlyErrorMessage(error, 'That folder does not exist yet.'))
    }
  }

  return (
    <div className="table-row location-row">
      <div className="cell cell-account">
        <span className="account-label">{title}</span>
        <span className="muted">{copy.note}</span>
        <span className="muted mono location-path">{location.path}</span>
      </div>
      <Button variant="outline" onClick={() => void open()}>
        <FolderOpen size={14} /> Open folder
      </Button>
    </div>
  )
}

export function DataLocationsSection() {
  const [locations, setLocations] = useState<DataLocation[] | null>(null)

  useEffect(() => {
    window.api.storage
      .locations()
      .then(setLocations)
      .catch(() => setLocations([]))
  }, [])

  return (
    <SettingsSection
      title="Where your data lives"
      description={
        <>
          o-bros keeps very little of its own. Your conversations stay where Claude and Codex put them, and your
          projects stay in their own folders: o-bros never copies them. Nothing here is uploaded anywhere.
        </>
      }
    >
      {locations === null && <p className="panel-empty">Looking…</p>}
      {locations !== null && (
        <div className="table">
          {locations.map((location) => (
            <LocationRow key={location.id} location={location} />
          ))}
        </div>
      )}
    </SettingsSection>
  )
}
