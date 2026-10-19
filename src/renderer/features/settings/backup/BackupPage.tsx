import { Download, Upload } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../../ui/Button'
import { SettingsPageLayout } from '../../../ui/SettingsPageLayout'
import { SettingsSection } from '../../../ui/SettingsSection'
import { exportSettings, importSettings } from './settingsBackupActions'
import '../settings.css'

export function BackupPage() {
  const [includeProjectFolders, setIncludeProjectFolders] = useState(true)

  return (
    <SettingsPageLayout
      title="Backup and restore"
      description="Save your O-BROS settings to a JSON file, and load them again on this or another computer."
    >
      <SettingsSection
        title="Export"
        description={
          <>
            Saves your color theme, editor settings, shortcuts, agent buttons, terminal options,
            agent and git options, and the name and email for commits made by agents. Open tabs and recent files are not
            included. Accounts, logins and tokens are never included.
          </>
        }
        actions={
          <Button variant="outline" onClick={() => exportSettings(includeProjectFolders)}>
            <Download size={14} /> Export settings…
          </Button>
        }
      >
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={includeProjectFolders}
            onChange={(event) => setIncludeProjectFolders(event.target.checked)}
          />
          <span>Include the list of project folders</span>
        </label>
      </SettingsSection>

      <SettingsSection
        title="Import"
        description={
          <>
            Loads a file made with Export. O-BROS checks the file first and shows what it contains before changing
            anything. Settings in the file replace yours, and project folders are added only if they exist on this
            computer.
          </>
        }
        actions={
          <Button variant="outline" onClick={() => importSettings()}>
            <Upload size={14} /> Import settings…
          </Button>
        }
      />
    </SettingsPageLayout>
  )
}
