import { create } from 'zustand'

export type ToastKind = 'success' | 'warning' | 'error'

export interface Toast {
  id: string
  kind: ToastKind
  message: string
}

const VISIBLE_MS: Record<ToastKind, number> = {
  success: 3500,
  warning: 5500,
  error: 7000
}
const MAX_VISIBLE_TOASTS = 4

interface ToastState {
  toasts: Toast[]
  show: (kind: ToastKind, message: string) => void
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],

  show: (kind, message) => {
    const toast: Toast = { id: crypto.randomUUID(), kind, message }
    set({ toasts: [...get().toasts, toast].slice(-MAX_VISIBLE_TOASTS) })
    setTimeout(() => get().dismiss(toast.id), VISIBLE_MS[kind])
  },

  dismiss: (id) => set({ toasts: get().toasts.filter((toast) => toast.id !== id) })
}))

export const toast = {
  success: (message: string) => useToastStore.getState().show('success', message),
  warning: (message: string) => useToastStore.getState().show('warning', message),
  error: (message: string) => useToastStore.getState().show('error', message)
}
