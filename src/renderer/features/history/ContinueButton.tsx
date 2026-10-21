import { ArrowRightLeft } from 'lucide-react'
import { useState, type MouseEvent } from 'react'
import type { SessionSummary } from '../../../shared/types'
import { Button } from '../../ui/Button'
import { PopupMenu } from '../../ui/PopupMenu'
import { continueMenuItems } from './continueWithAgent'

interface OpenMenu {
  x: number
  y: number
  anchor: Element
}

const MENU_GAP = 4
const CONTINUE_TITLE = 'Continue this conversation in another agent, with a handoff of what was done'

export function ContinueButton({ session, isLabelled = false }: { session: SessionSummary; isLabelled?: boolean }) {
  const [menu, setMenu] = useState<OpenMenu | null>(null)

  function open(event: MouseEvent<HTMLButtonElement>): void {
    const bounds = event.currentTarget.getBoundingClientRect()
    setMenu({ x: bounds.left, y: bounds.bottom + MENU_GAP, anchor: event.currentTarget })
  }

  return (
    <>
      {isLabelled ? (
        <Button variant="outline" title={CONTINUE_TITLE} onClick={open}>
          <ArrowRightLeft size={14} /> Continue with…
        </Button>
      ) : (
        <button type="button" className="session-action hover-positive" title={CONTINUE_TITLE} onClick={open}>
          <ArrowRightLeft size={14} />
        </button>
      )}
      {menu !== null && (
        <PopupMenu
          x={menu.x}
          y={menu.y}
          anchor={menu.anchor}
          items={continueMenuItems(session.filePath, session.provider)}
          onClose={() => setMenu(null)}
        />
      )}
    </>
  )
}
