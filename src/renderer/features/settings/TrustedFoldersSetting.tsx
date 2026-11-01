import { useEffect, useState } from 'react'
import { lastPathSegment } from '../../../shared/paths'
import { Button } from '../../ui/Button'
import { SettingsSection } from '../../ui/SettingsSection'

export function TrustedFoldersSetting() {
  const [folders, setFolders] = useState<string[]>([])

  useEffect(() => {
    void window.api.trust.list().then(setFolders)
  }, [])

  async function stopTrusting(folder: string): Promise<void> {
    await window.api.trust.revoke(folder)
    setFolders(await window.api.trust.list())
  }

  return (
    <SettingsSection
      title="Trusted folders"
      description="O-BROS asks before using a folder whose own settings can run programs. These are the ones you said yes to. If you stop trusting one, its Git panel and its own language server turn off again."
    >
      <div className="table">
        {folders.length === 0 && <p className="panel-empty">No trusted folders yet.</p>}
        {folders.map((folder) => (
          <div key={folder} className="table-row">
            <div className="cell cell-account">
              <span className="account-label">{lastPathSegment(folder)}</span>
              <span className="muted">{folder}</span>
            </div>
            <Button variant="remove" onClick={() => stopTrusting(folder)}>
              Stop trusting
            </Button>
          </div>
        ))}
      </div>
    </SettingsSection>
  )
}
