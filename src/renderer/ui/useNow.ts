import { useEffect, useState } from 'react'

export function useNow(refreshEveryMs: number): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), refreshEveryMs)
    return () => clearInterval(timer)
  }, [refreshEveryMs])

  return now
}
