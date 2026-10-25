import { useEffect } from 'react'
import { usePortsStore } from './portsStore'

const PORTS_POLL_MS = 5000

export function usePortPolling(): void {
  const load = usePortsStore((state) => state.load)

  useEffect(() => {
    void load()
    const timer = setInterval(() => void load(), PORTS_POLL_MS)
    return () => clearInterval(timer)
  }, [load])
}
