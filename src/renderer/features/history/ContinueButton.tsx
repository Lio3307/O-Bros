import { Forward } from 'lucide-react'
import type { SessionSummary } from '../../../shared/types'
import { useContinueDialogStore } from '../../state/continueDialogStore'
import { Button } from '../../ui/Button'

const CONTINUE_LABEL = 'Continue in another agent'

export function ContinueButton({ session, isLabelled = false }: { session: SessionSummary; isLabelled?: boolean }) {
  const openDialog = useContinueDialogStore((state) => state.open)

  function open(): void {
    openDialog({
      sessionFilePath: session.filePath,
      sessionId: session.sessionId,
      title: session.title,
      folder: session.projectPath,
      provider: session.provider
    })
  }

  return isLabelled ? (
    <Button variant="outline" onClick={open}>
      <Forward size={14} /> {CONTINUE_LABEL}
    </Button>
  ) : (
    <button type="button" className="icon-button icon-button-small hover-positive" title={CONTINUE_LABEL} onClick={open}>
      <Forward size={14} />
    </button>
  )
}
