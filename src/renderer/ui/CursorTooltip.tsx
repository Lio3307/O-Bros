import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import './cursorTooltip.css'

export interface CursorPoint {
  x: number
  y: number
}

const GAP_FROM_CURSOR = 14
const SPACE_FROM_EDGE = 8

function placeNextToCursor(tooltip: HTMLElement, point: CursorPoint): void {
  const fitsRight = point.x + GAP_FROM_CURSOR + tooltip.offsetWidth <= window.innerWidth - SPACE_FROM_EDGE
  const fitsBelow = point.y + GAP_FROM_CURSOR + tooltip.offsetHeight <= window.innerHeight - SPACE_FROM_EDGE
  const left = fitsRight ? point.x + GAP_FROM_CURSOR : point.x - GAP_FROM_CURSOR - tooltip.offsetWidth
  const top = fitsBelow ? point.y + GAP_FROM_CURSOR : point.y - GAP_FROM_CURSOR - tooltip.offsetHeight
  tooltip.style.transform = `translate(${Math.max(SPACE_FROM_EDGE, left)}px, ${Math.max(SPACE_FROM_EDGE, top)}px)`
}

export function CursorTooltip({ point, children }: { point: CursorPoint | null; children: ReactNode }) {
  const tooltipRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (tooltipRef.current !== null && point !== null) {
      placeNextToCursor(tooltipRef.current, point)
    }
  })

  if (point === null) {
    return null
  }
  return createPortal(
    <div ref={tooltipRef} className="cursor-tooltip" role="tooltip">
      {children}
    </div>,
    document.body
  )
}
