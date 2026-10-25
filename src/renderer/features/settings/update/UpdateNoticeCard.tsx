import { X } from 'lucide-react'
import { useCallback, useState } from 'react'
import { readAnnouncedUpdates, updateNoticeFor, type AnnouncedUpdates } from '../../../../shared/updateNotice'
import { readStoredJson, writeStoredJson } from '../../../state/browserStorage'
import { restartToUpdate } from '../../../state/restartToUpdate'
import { isWorkRunning } from '../../../state/runningWork'
import { toast } from '../../../state/toastStore'
import { useUpdateStore } from '../../../state/updateStore'
import { Button } from '../../../ui/Button'
import { useLiveRefresh } from '../../../ui/useLiveRefresh'
import './updateNotice.css'

const DISMISSED_KEY = 'o-bros.announcedUpdates'
const BUSY_CHECK_MS = 15_000

function useWorkRunning(isWatching: boolean): boolean {
  const [isRunning, setIsRunning] = useState(false)
  const check = useCallback(async () => {
    setIsRunning(await isWorkRunning())
  }, [])
  useLiveRefresh(check, BUSY_CHECK_MS, { refreshNow: true, isEnabled: isWatching })
  return isRunning
}

export function UpdateNoticeCard() {
  const status = useUpdateStore((state) => state.status)
  const download = useUpdateStore((state) => state.download)
  const openReleases = useUpdateStore((state) => state.openReleases)
  const [dismissed, setDismissed] = useState<AnnouncedUpdates>(() => readAnnouncedUpdates(readStoredJson(DISMISSED_KEY)))
  const notice = updateNoticeFor(status, dismissed)
  const isWorkBusy = useWorkRunning(notice?.kind === 'ready')

  if (notice === null || status === null) {
    return null
  }
  const { kind, version } = notice

  function dismiss(): void {
    const next = { ...dismissed, [kind]: version }
    writeStoredJson(DISMISSED_KEY, next)
    setDismissed(next)
  }

  function installOnClose(): void {
    dismiss()
    toast.success(`O-BROS ${version} installs the next time you close O-BROS. Your terminals keep running until then.`)
  }

  const isDownloading = status.state === 'downloading'
  const isReady = status.state === 'ready'
  const detail = isReady
    ? isWorkBusy
      ? 'Agents or programs are running, so nothing restarts now. The update installs when you close O-BROS.'
      : 'Restarting takes a few seconds. Your tabs come back where they were.'
    : 'It downloads in the background. Your terminals keep running.'

  return (
    <section className="update-notice" role="status" aria-label="Update available">
      <header className="update-notice-header">
        <h2 className="update-notice-title">Update available</h2>
        <button type="button" className="icon-button update-notice-close" title="Hide until the next version" onClick={dismiss}>
          <X size={16} />
        </button>
      </header>
      <p className="update-notice-version">
        O-BROS v{version} is {isReady ? 'ready' : 'available'}.
      </p>
      <p className="update-notice-detail">{detail}</p>
      <button type="button" className="update-notice-link" onClick={() => void openReleases(version)}>
        Release notes
      </button>
      {isDownloading && (
        <div className="update-notice-progress" aria-label={`Downloading, ${Math.round(status.percent)} percent`}>
          <div className="update-notice-progress-fill" style={{ width: `${Math.min(status.percent, 100)}%` }} />
        </div>
      )}
      {status.state === 'available' && (
        <Button variant="primary" className="update-notice-action" onClick={() => download()}>
          Download update
        </Button>
      )}
      {isDownloading && <p className="update-notice-downloading">Downloading… {Math.round(status.percent)}%</p>}
      {isReady && !isWorkBusy && (
        <Button variant="primary" className="update-notice-action" onClick={() => restartToUpdate()}>
          Restart to update
        </Button>
      )}
      {isReady && isWorkBusy && (
        <>
          <Button variant="primary" className="update-notice-action" onClick={installOnClose}>
            Update when I close O-BROS
          </Button>
          <button type="button" className="update-notice-link update-notice-secondary" onClick={() => void restartToUpdate()}>
            Restart now instead
          </button>
        </>
      )}
    </section>
  )
}
