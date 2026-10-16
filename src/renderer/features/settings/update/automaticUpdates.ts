import { readAnnouncedUpdates, updateNoticeFor, type AnnouncedUpdates } from '../../../../shared/updateNotice'
import { restartToUpdate } from '../../../state/restartToUpdate'
import { toast } from '../../../state/toastStore'
import { useUpdateStore } from '../../../state/updateStore'

const FIRST_CHECK_DELAY_MS = 30_000
const CHECK_EVERY_MS = 6 * 60 * 60 * 1000
const ANNOUNCED_KEY = 'o-bros.announcedUpdates'

function loadAnnounced(): AnnouncedUpdates {
  try {
    return readAnnouncedUpdates(JSON.parse(localStorage.getItem(ANNOUNCED_KEY) ?? 'null'))
  } catch {
    return {}
  }
}

function saveAnnounced(announced: AnnouncedUpdates): void {
  try {
    localStorage.setItem(ANNOUNCED_KEY, JSON.stringify(announced))
  } catch {
    return
  }
}

function announceIfNew(): void {
  const announced = loadAnnounced()
  const notice = updateNoticeFor(useUpdateStore.getState().status, announced)
  if (notice === null) {
    return
  }
  saveAnnounced({ ...announced, [notice.kind]: notice.version })
  const action =
    notice.kind === 'available'
      ? { label: 'Download', run: () => useUpdateStore.getState().download() }
      : { label: 'Restart to update', run: () => restartToUpdate() }
  toast.info(notice.message, action)
}

function checkQuietly(): void {
  if (useUpdateStore.getState().isAutoCheckEnabled) {
    void window.api.updater.check().catch(() => undefined)
  }
}

export function startAutomaticUpdates(): () => void {
  const store = useUpdateStore.getState()
  void store.load().catch(() => undefined)
  const stopWatching = store.watch()
  const stopAnnouncing = useUpdateStore.subscribe(announceIfNew)
  const firstCheck = setTimeout(checkQuietly, FIRST_CHECK_DELAY_MS)
  const laterChecks = setInterval(checkQuietly, CHECK_EVERY_MS)
  return () => {
    stopWatching()
    stopAnnouncing()
    clearTimeout(firstCheck)
    clearInterval(laterChecks)
  }
}
