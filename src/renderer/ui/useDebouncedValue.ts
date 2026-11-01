import { useEffect, useState } from 'react'

export function useDebouncedValue<Value>(value: Value, delayMs: number): Value {
  const [settled, setSettled] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return settled
}
