import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import { useToastStore, type ToastKind } from '../state/toastStore'
import './toast.css'

const ICON_BY_KIND: Record<ToastKind, typeof CircleCheck> = {
  success: CircleCheck,
  info: Info,
  warning: TriangleAlert,
  error: CircleAlert
}

export function ToastHost() {
  const toasts = useToastStore((state) => state.toasts)
  const dismiss = useToastStore((state) => state.dismiss)

  return (
    <div className="toast-host" aria-live="polite">
      {toasts.map((item) => {
        const Icon = ICON_BY_KIND[item.kind]
        return (
          <div key={item.id} className={`toast toast-${item.kind}`} role={item.kind === 'error' ? 'alert' : 'status'}>
            <Icon size={16} className="toast-icon" />
            <span className="toast-message">{item.message}</span>
            {item.action !== null && (
              <button
                type="button"
                className="toast-action"
                onClick={() => {
                  dismiss(item.id)
                  void item.action?.run()
                }}
              >
                {item.action.label}
              </button>
            )}
            <button type="button" className="toast-close" title="Dismiss" onClick={() => dismiss(item.id)}>
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
