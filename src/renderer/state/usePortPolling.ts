import { useEffect } from 'react'
import { usePortsStore } from './portsStore'

const PORTS_POLL_MS = 5000

let viewerCount = 0
let pollTimer: ReturnType<typeof setInterval> | null = null

function startViewing(): () => void {
  viewerCount += 1
  if (pollTimer === null) {
    void usePortsStore.getState().load()
    pollTimer = setInterval(() => void usePortsStore.getState().load(), PORTS_POLL_MS)
  }
  return () => {
    viewerCount -= 1
    if (viewerCount === 0 && pollTimer !== null) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }
}

export function usePortPolling(): void {
  useEffect(() => startViewing(), [])
}
