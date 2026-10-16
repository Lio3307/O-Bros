import { useConfirmStore } from '../state/confirmStore'
import { Button } from './Button'
import { Modal } from './Modal'

export function ConfirmHost() {
  const options = useConfirmStore((state) => state.options)
  const answer = useConfirmStore((state) => state.answer)

  if (options === null) {
    return null
  }
  return (
    <Modal
      title={options.title}
      onEscape={() => answer(false)}
      actions={
        <>
          <Button variant="outline" autoFocus onClick={() => answer(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => answer(true)}>
            {options.confirmLabel}
          </Button>
        </>
      }
    >
      <p className="muted confirm-message">{options.message}</p>
    </Modal>
  )
}
