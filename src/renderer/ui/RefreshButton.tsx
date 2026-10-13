import { Check, RefreshCw, TriangleAlert } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface RefreshButtonProps {
  isBusy: boolean
  hasFailed: boolean
  onRefresh: () => void
  title: string
  variant: 'icon' | 'labeled'
  label?: string
  iconSize?: number
}

const RESULT_VISIBLE_MS = 1600

function useResultFlash(isBusy: boolean): boolean {
  const wasBusyRef = useRef(false)
  const [isResultVisible, setIsResultVisible] = useState(false)

  useEffect(() => {
    const justFinished = wasBusyRef.current && !isBusy
    wasBusyRef.current = isBusy
    if (!justFinished) {
      return
    }
    setIsResultVisible(true)
    const timer = setTimeout(() => setIsResultVisible(false), RESULT_VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [isBusy])

  return isResultVisible
}

export function RefreshButton({ isBusy, hasFailed, onRefresh, title, variant, label, iconSize = 14 }: RefreshButtonProps) {
  const isResultVisible = useResultFlash(isBusy)

  const Icon = isBusy ? RefreshCw : hasFailed ? TriangleAlert : isResultVisible ? Check : RefreshCw
  const text = isBusy ? 'Refreshing…' : isResultVisible ? (hasFailed ? 'Failed' : 'Updated') : label
  const baseClass = variant === 'icon' ? 'icon-button' : 'button-outline'
  const stateClass = isBusy ? 'refresh-busy' : isResultVisible ? 'refresh-result' : ''

  return (
    <button
      type="button"
      className={`${baseClass} ${stateClass}`}
      title={isBusy ? 'Refreshing…' : title}
      aria-busy={isBusy}
      disabled={isBusy}
      onClick={onRefresh}
    >
      <Icon size={iconSize} className={isBusy ? 'spinning' : isResultVisible ? 'refresh-pop' : ''} />
      {variant === 'labeled' && <span>{text}</span>}
    </button>
  )
}
