import { Download, RefreshCw, RotateCw } from 'lucide-react'
import type { UpdateStatus } from '../../../../shared/types'
import { Button } from '../../../ui/Button'
import { describeUpdate } from './updateDisplay'
import './update.css'

interface UpdateCardProps {
  status: UpdateStatus | null
  onCheck: () => void
  onDownload: () => void
  onRestart: () => void
}

function UpdateAction({ status, onCheck, onDownload, onRestart }: UpdateCardProps) {
  switch (status?.state) {
    case 'available':
      return (
        <Button variant="primary" onClick={onDownload}>
          <Download size={14} /> Download {status.latestVersion}
        </Button>
      )
    case 'ready':
      return (
        <Button variant="primary" onClick={onRestart}>
          <RotateCw size={14} /> Restart and install
        </Button>
      )
    case 'unavailable':
    case 'checking':
    case 'downloading':
      return null
    case 'upToDate':
    case 'failed':
      return (
        <Button variant="outline" onClick={onCheck}>
          <RefreshCw size={14} /> Check again
        </Button>
      )
    default:
      return (
        <Button variant="outline" onClick={onCheck}>
          <RefreshCw size={14} /> Check for updates
        </Button>
      )
  }
}

export function UpdateCard(props: UpdateCardProps) {
  const { status } = props
  const display = describeUpdate(status)
  const percent = Math.round(status?.percent ?? 0)

  return (
    <div className={`update-card update-card-${display.tone}`}>
      <span className="update-dot" />
      <div className="update-body">
        <div className="update-title-row">
          <span className="update-title">{display.title}</span>
          {display.tag !== null && <span className="update-tag">{display.tag}</span>}
        </div>
        <span className="muted">{display.detail}</span>
        {display.showsProgress && (
          <div className="update-progress" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
            <div className="update-progress-fill" style={{ width: `${percent}%` }} />
          </div>
        )}
      </div>
      <UpdateAction {...props} />
    </div>
  )
}
