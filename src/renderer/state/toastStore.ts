import { create } from 'zustand'

export type ToastKind = 'success' | 'info' | 'warning' | 'error'

export interface ToastAction {
  label: string
  run: () => void | Promise<unknown>
}

export interface Toast {
  id: string
  kind: ToastKind
  message: string
  action: ToastAction | null
}

const VISIBLE_MS: Record<ToastKind, number> = {
  success: 3500,
  info: 6000,
  warning: 5500,
  error: 7000
}
const MAX_VISIBLE_TOASTS = 4

interface ToastState {
  toasts: Toast[]
  show: (kind: ToastKind, message: string, action?: ToastAction) => void
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],

  show: (kind, message, action) => {
    const isAlreadyShown = get().toasts.some((shown) => shown.kind === kind && shown.message === message)
    if (isAlreadyShown) {
      return
    }
    const toast: Toast = { id: crypto.randomUUID(), kind, message, action: action ?? null }
    set({ toasts: [...get().toasts, toast].slice(-MAX_VISIBLE_TOASTS) })
    if (action === undefined) {
      setTimeout(() => get().dismiss(toast.id), VISIBLE_MS[kind])
    }
  },

  dismiss: (id) => set({ toasts: get().toasts.filter((toast) => toast.id !== id) })
}))

export const toast = {
  success: (message: string) => useToastStore.getState().show('success', message),
  info: (message: string, action?: ToastAction) => useToastStore.getState().show('info', message, action),
  warning: (message: string) => useToastStore.getState().show('warning', message),
  error: (message: string) => useToastStore.getState().show('error', message)
}
