import type { WebglAddon } from '@xterm/addon-webgl'
import type { Terminal } from '@xterm/xterm'
import { useEffect, useRef, type RefObject } from 'react'

interface LoadedRenderer {
  terminal: Terminal
  addon: WebglAddon
}

function createWebglAddon(WebglAddonClass: typeof WebglAddon): WebglAddon | null {
  try {
    const addon = new WebglAddonClass()
    addon.onContextLoss(() => addon.dispose())
    return addon
  } catch {
    return null
  }
}

export function useGpuRenderer(terminalRef: RefObject<Terminal | null>, paneId: string, isWanted: boolean, onRendererChanged: () => void): void {
  const loadedRef = useRef<LoadedRenderer | null>(null)

  useEffect(() => {
    const terminal = terminalRef.current
    if (terminal === null) {
      return
    }
    if (loadedRef.current !== null && loadedRef.current.terminal !== terminal) {
      loadedRef.current = null
    }
    if (!isWanted && loadedRef.current !== null) {
      loadedRef.current.addon.dispose()
      loadedRef.current = null
      onRendererChanged()
    }
    if (!isWanted || loadedRef.current !== null) {
      return
    }
    let isStillWanted = true
    void import('@xterm/addon-webgl').then(({ WebglAddon: WebglAddonClass }) => {
      if (!isStillWanted || terminalRef.current !== terminal || loadedRef.current !== null) {
        return
      }
      const addon = createWebglAddon(WebglAddonClass)
      if (addon !== null) {
        terminal.loadAddon(addon)
        loadedRef.current = { terminal, addon }
        onRendererChanged()
      }
    })
    return () => {
      isStillWanted = false
    }
  }, [isWanted, paneId])
}
