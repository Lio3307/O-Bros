import { ExternalLink, FileText } from 'lucide-react'
import { useEffect } from 'react'
import { restartToUpdate } from '../../state/restartToUpdate'
import { useUpdateStore } from '../../state/updateStore'
import { Button } from '../../ui/Button'
import { SettingsPageLayout } from '../../ui/SettingsPageLayout'
import { SettingsSection } from '../../ui/SettingsSection'
import './settings.css'
import './settingsControls.css'
import { UpdateCard } from './update/UpdateCard'

export function AboutPage() {
  const status = useUpdateStore((state) => state.status)
  const load = useUpdateStore((state) => state.load)
  const watch = useUpdateStore((state) => state.watch)
  const check = useUpdateStore((state) => state.check)
  const download = useUpdateStore((state) => state.download)
  const openReleases = useUpdateStore((state) => state.openReleases)
  const isAutoCheckEnabled = useUpdateStore((state) => state.isAutoCheckEnabled)
  const setAutoCheckEnabled = useUpdateStore((state) => state.setAutoCheckEnabled)

  useEffect(() => {
    void load()
    return watch()
  }, [load, watch])

  return (
    <SettingsPageLayout
      title="About and updates"
      description={
        <>
          o-bros {status?.currentVersion ?? ''}. O-BROS checks GitHub for a new version 30 seconds after it starts and every 6 hours, and tells you when there is one. Nothing is downloaded or installed unless you press a button.
        </>
      }
      actions={
        <>
          <Button variant="outline" onClick={() => window.api.app.openLogFolder()}>
            <FileText size={14} /> Open log folder
          </Button>
          <Button variant="outline" onClick={() => openReleases()}>
            <ExternalLink size={14} /> Releases page
          </Button>
        </>
      }
    >
      <SettingsSection title="Updates">
        <UpdateCard
          status={status}
          onCheck={check}
          onDownload={download}
          onRestart={restartToUpdate}
        />
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={isAutoCheckEnabled}
            onChange={(event) => setAutoCheckEnabled(event.target.checked)}
          />
          <span>Check for new versions automatically and tell me</span>
        </label>
      </SettingsSection>
    </SettingsPageLayout>
  )
}
