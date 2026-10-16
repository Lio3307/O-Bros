import { create } from 'zustand'
import { friendlyErrorMessage } from '../../shared/friendlyError'
import type { ListeningPort } from '../../shared/types'
import { toast } from './toastStore'

interface PortsState {
  ports: ListeningPort[] | null
  load: () => Promise<void>
  stop: (port: ListeningPort) => Promise<void>
  open: (port: ListeningPort) => Promise<void>
}

export const usePortsStore = create<PortsState>()((set, get) => ({
  ports: null,

  load: async () => {
    try {
      set({ ports: await window.api.ports.list() })
    } catch {
      set({ ports: [] })
    }
  },

  stop: async (port) => {
    try {
      await window.api.ports.stop(port.pid)
      toast.success('Stopped ' + port.processName + ' on port ' + port.port + '.')
    } catch (error) {
      toast.error(friendlyErrorMessage(error, 'Could not stop that process.'))
    }
    await get().load()
  },

  open: async (port) => {
    try {
      await window.api.ports.open(port.port)
    } catch (error) {
      toast.error(friendlyErrorMessage(error, 'Could not open that port in the browser.'))
    }
  }
}))
