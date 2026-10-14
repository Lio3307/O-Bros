import { useEffect, useState } from 'react'
import { friendlyErrorMessage } from '../../../shared/friendlyError'
import type { SessionMessage } from '../../../shared/types'
import { useHistoryStore } from '../../state/historyStore'
import { Button } from '../../ui/Button'
import './history.css'

const MESSAGES_SHOWN_FIRST = 200

export function SessionReplay() {
  const sessions = useHistoryStore((state) => state.sessions)
  const selectedFilePath = useHistoryStore((state) => state.selectedFilePath)
  const [messages, setMessages] = useState<SessionMessage[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [shownCount, setShownCount] = useState(MESSAGES_SHOWN_FIRST)

  const session = sessions.find((candidate) => candidate.filePath === selectedFilePath)

  useEffect(() => {
    setShownCount(MESSAGES_SHOWN_FIRST)
    if (selectedFilePath === null) {
      setMessages([])
      return
    }
    let isCurrent = true
    setErrorMessage(null)
    window.api.history
      .get(selectedFilePath)
      .then((loaded) => isCurrent && setMessages(loaded))
      .catch(
        (error: unknown) =>
          isCurrent && setErrorMessage(friendlyErrorMessage(error, 'Could not open this session.'))
      )
    return () => {
      isCurrent = false
    }
  }, [selectedFilePath])

  if (session === undefined) {
    return <div className="empty-state">Select a session to read it.</div>
  }

  const hiddenCount = messages.length - shownCount

  return (
    <div className="replay">
      <header className="replay-header">
        <span className="replay-title">{session.title}</span>
        <span className="replay-meta">{session.projectPath ?? 'Unknown folder'} · read-only</span>
      </header>
      <div className="replay-body">
        {errorMessage !== null && <p className="muted">{errorMessage}</p>}
        {messages.slice(0, shownCount).map((message, index) => (
          <div key={index} className={message.role === 'user' ? 'message message-user' : 'message'}>
            <span className="message-role">{message.role === 'user' ? '>' : '●'}</span>
            <pre className="message-text">{message.text}</pre>
          </div>
        ))}
        {hiddenCount > 0 && (
          <Button variant="outline" onClick={() => setShownCount(shownCount + MESSAGES_SHOWN_FIRST)}>
            Show {Math.min(hiddenCount, MESSAGES_SHOWN_FIRST)} more ({hiddenCount} hidden)
          </Button>
        )}
      </div>
    </div>
  )
}
