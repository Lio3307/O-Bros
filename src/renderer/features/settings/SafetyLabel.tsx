import { Chip } from '../../ui/Chip'
import type { StatusTone } from '../../ui/StatusDot'

export type Safety = 'safe' | 'undoable' | 'permanent'

interface SafetyCopy {
  label: string
  tone: StatusTone
  explanation: string
}

export const SAFETY_COPY: Record<Safety, SafetyCopy> = {
  safe: { label: 'Safe', tone: 'success', explanation: 'Rebuilt automatically when needed. Nothing you made is lost.' },
  undoable: { label: 'Can undo', tone: 'info', explanation: 'You can reverse this later from this page.' },
  permanent: { label: 'Permanent', tone: 'danger', explanation: 'Cannot be undone. Read what you lose before you press it.' }
}

export function SafetyLabel({ safety }: { safety: Safety }) {
  const copy = SAFETY_COPY[safety]
  return (
    <Chip tone={copy.tone} title={copy.explanation}>
      {copy.label}
    </Chip>
  )
}
