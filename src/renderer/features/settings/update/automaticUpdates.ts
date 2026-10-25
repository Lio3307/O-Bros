import { useUpdateStore } from '../../../state/updateStore'

const FIRST_CHECK_DELAY_MS = 30_000
const CHECK_EVERY_MS = 6 * 60 * 60 * 1000

function checkQuietly(): void {
  if (useUpdateStore.getState().isAutoCheckEnabled) {
    void window.api.updater.check().catch(() => undefined)
  }
}

export function startAutomaticUpdates(): () => void {
  const store = useUpdateStore.getState()
  void store.load().catch(() => undefined)
  const stopWatching = store.watch()
  const firstCheck = setTimeout(checkQuietly, FIRST_CHECK_DELAY_MS)
  const laterChecks = setInterval(checkQuietly, CHECK_EVERY_MS)
  return () => {
    stopWatching()
    clearTimeout(firstCheck)
    clearInterval(laterChecks)
  }
}
