import { useEffect, useState } from 'react'
import type { LiveAgent } from '../../../../shared/activity'
import { useResourcesStore } from '../../../state/resourcesStore'

const LIVE_POLL_MS = 2000
const RESOURCES_POLL_MS = 10_000

export function useLiveAgents(): LiveAgent[] | null {
  const [agents, setAgents] = useState<LiveAgent[] | null>(null)
  const pollResources = useResourcesStore((state) => state.poll)

  useEffect(() => {
    let isCurrent = true
    function readLive(): void {
      window.api.activity
        .live()
        .then((live) => isCurrent && setAgents(live))
        .catch(() => isCurrent && setAgents([]))
    }
    readLive()
    void pollResources()
    const liveTimer = setInterval(readLive, LIVE_POLL_MS)
    const resourcesTimer = setInterval(() => void pollResources(), RESOURCES_POLL_MS)
    return () => {
      isCurrent = false
      clearInterval(liveTimer)
      clearInterval(resourcesTimer)
    }
  }, [pollResources])

  return agents
}
