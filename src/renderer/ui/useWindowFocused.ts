import { useEffect, useState } from 'react'

export function useWindowFocused(): boolean {
  const [isFocused, setIsFocused] = useState(true)

  useEffect(() => window.api.appearance.onWindowFocusChanged(setIsFocused), [])

  return isFocused
}
