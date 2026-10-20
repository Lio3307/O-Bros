import { useEffect, useRef } from 'react'

export const LIVE_REFRESH_MS = 4000

export function useLiveRefresh(refresh: () => Promise<unknown>, everyMs: number | null = LIVE_REFRESH_MS): void {
  const latestRefresh = useRef(refresh)

  useEffect(() => {
    latestRefresh.current = refresh
  }, [refresh])

  useEffect(() => {
    let isRunning = false

    async function refreshWhenShown(): Promise<void> {
      if (document.hidden || isRunning) {
        return
      }
      isRunning = true
      try {
        await latestRefresh.current()
      } catch {
        return
      } finally {
        isRunning = false
      }
    }

    function onShown(): void {
      void refreshWhenShown()
    }

    window.addEventListener('focus', onShown)
    document.addEventListener('visibilitychange', onShown)
    const timer = everyMs === null ? null : setInterval(onShown, everyMs)
    return () => {
      window.removeEventListener('focus', onShown)
      document.removeEventListener('visibilitychange', onShown)
      if (timer !== null) {
        clearInterval(timer)
      }
    }
  }, [everyMs])
}
