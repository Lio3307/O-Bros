import { ExternalLink, FileText } from 'lucide-react'
import { useEffect } from 'react'
import { useCloseRequestStore } from '../../state/closeRequestStore'
import { useUpdateStore } from '../../state/updateStore'
import './settings.css'
import './settingsControls.css'

export function AboutPage() {
  const status = useUpdateStore((state) => state.status)
  const load = useUpdateStore((state) => state.load)
  const watch = useUpdateStore((state) => state.watch)
  const check = useUpdateStore((state) => state.check)
  const download = useUpdateStore((state) => state.download)
  const openReleases = useUpdateStore((state) => state.openReleases)
  const beginClose = useCloseRequestStore((state) => state.begin)

  useEffect(() => {
    void load()
    return watch()
  }, [load, watch])

  const state = status?.state ?? 'idle'
  const canCheck = state === 'idle' || state === 'upToDate' || state === 'failed'

  return (
    <div className="settings-page">
      <header className="settings-header">
        <div>
          <h1 className="settings-title">About and updates</h1>
          <p className="muted">o-bros {status?.currentVersion ?? ''}. Updates are never checked or downloaded unless you press a button here.</p>
        </div>
        <div className="settings-header-actions">
          <button type="button" className="button-outline" onClick={() => void window.api.app.openLogFolder()}>
            <FileText size={14} /> Open log folder
          </button>
          <button type="button" className="button-outline" onClick={() => void openReleases()}>
            <ExternalLink size={14} /> Releases page
          </button>
        </div>
      </header>

      <section className="settings-section">
        <h2 className="settings-subtitle">Updates</h2>
        {state === 'unavailable' && <p className="muted">{status?.message}</p>}
        {state === 'idle' && <p className="muted">Press the button to look for a newer version on GitHub.</p>}
        {state === 'checking' && <p className="muted">Looking for updates.</p>}
        {state === 'upToDate' && <p className="muted">You have the latest version.</p>}
        {state === 'failed' && <p className="muted">{status?.message}</p>}
        {state === 'available' && (
          <p className="muted">
            Version {status?.latestVersion} is available. Downloading does not change the running app.
          </p>
        )}
        {state === 'downloading' && <p className="muted">Downloading {Math.round(status?.percent ?? 0)}%.</p>}
        {state === 'ready' && (
          <p className="muted">
            Downloaded. It installs when you close o-bros, then start the app again. Close now to install it
            immediately.
          </p>
        )}

        <div className="settings-header-actions">
          {canCheck && (
            <button type="button" className="button-outline" onClick={() => void check()}>
              Check for updates
            </button>
          )}
          {state === 'available' && (
            <button type="button" className="button-outline" onClick={() => void download()}>
              Download {status?.latestVersion}
            </button>
          )}
          {state === 'ready' && (
            <button type="button" className="button-outline" onClick={() => void beginClose()}>
              Close and install
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
