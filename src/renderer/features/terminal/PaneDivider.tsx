import type { MouseEvent as ReactMouseEvent, RefObject } from 'react'
import { clampSplitRatio, type SplitDivider } from './paneTree'

interface PaneDividerProps {
  divider: SplitDivider
  containerRef: RefObject<HTMLDivElement>
  onRatioChange: (ratio: number) => void
}

export function PaneDivider({ divider, containerRef, onRatioChange }: PaneDividerProps) {
  const { direction, region, ratio } = divider
  const isHorizontal = direction === 'horizontal'

  const style = isHorizontal
    ? { left: `${region.left + region.width * ratio}%`, top: `${region.top}%`, height: `${region.height}%` }
    : { top: `${region.top + region.height * ratio}%`, left: `${region.left}%`, width: `${region.width}%` }

  function startDragging(event: ReactMouseEvent): void {
    event.preventDefault()
    const container = containerRef.current
    if (container === null) {
      return
    }
    const bounds = container.getBoundingClientRect()

    function moveTo(moveEvent: MouseEvent): void {
      const percentOfContainer = isHorizontal
        ? ((moveEvent.clientX - bounds.left) / bounds.width) * 100
        : ((moveEvent.clientY - bounds.top) / bounds.height) * 100
      const regionStart = isHorizontal ? region.left : region.top
      const regionSize = isHorizontal ? region.width : region.height
      onRatioChange(clampSplitRatio((percentOfContainer - regionStart) / regionSize))
    }

    function stopDragging(): void {
      window.removeEventListener('mousemove', moveTo)
      window.removeEventListener('mouseup', stopDragging)
      document.body.classList.remove('is-resizing-panes')
    }

    document.body.classList.add('is-resizing-panes')
    window.addEventListener('mousemove', moveTo)
    window.addEventListener('mouseup', stopDragging)
  }

  return (
    <div
      className={`pane-divider pane-divider-${direction}`}
      style={style}
      role="separator"
      aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
      onMouseDown={startDragging}
    />
  )
}
