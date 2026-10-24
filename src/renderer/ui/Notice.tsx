import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from './cn'
import './notice.css'

export type NoticeTone = 'info' | 'success' | 'warning' | 'danger'

const TONE_CLASS: Record<NoticeTone, string> = {
  info: 'notice-info',
  success: 'notice-success',
  warning: 'notice-warning',
  danger: 'notice-danger'
}

const TONE_ICON: Record<NoticeTone, LucideIcon> = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert
}

interface NoticeProps {
  tone?: NoticeTone
  title: ReactNode
  children?: ReactNode
  actions?: ReactNode
  className?: string
}

export function Notice({ tone = 'info', title, children, actions, className }: NoticeProps) {
  const Icon = TONE_ICON[tone]
  const isUrgent = tone === 'warning' || tone === 'danger'
  return (
    <div role={isUrgent ? 'alert' : 'status'} className={cn('notice', TONE_CLASS[tone], className)}>
      <div className="notice-message">
        <span className="notice-title">
          <Icon size={14} />
          {title}
        </span>
        {children !== undefined && <div className="notice-detail">{children}</div>}
      </div>
      {actions !== undefined && <div className="notice-actions">{actions}</div>}
    </div>
  )
}
