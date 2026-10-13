import { useEffect, useState } from 'react'
import { friendlyErrorMessage } from '../../../shared/friendlyError'
import type { SessionMessage } from '../../../shared/types'
import { useHistoryStore } from '../../state/historyStore'
import './history.css'

export function SessionReplay() {
  const sessions = useHistoryStore((state) => state.sessions)
  const selectedFilePath = useHistoryStore((state) => state.selectedFilePath)
  const [messages, setMessages] = useState<SessionMessage[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const session = sessions.find((candidate) => candidate.filePath === selectedFilePath)

  useEffect(() => {
    if (selectedFilePath === null) {
      setMessages([])
      return
    }
    setErrorMessage(null)
    window.api.history
      .get(selectedFilePath)
      .then(setMessages)
      .catch((error: unknown) => setErrorMessage(friendlyErrorMessage(error, 'Could not open this session.')))
  }, [selectedFilePath])

  if (session === undefined) {
    return <div className="empty-state">Select a session to read it.</div>
  }

  return (
    <div className="replay">
      <header className="replay-header">
        <span className="replay-title">{session.title}</span>
        <span className="replay-meta">{session.projectPath ?? 'Unknown folder'} · read-only</span>
      </header>
      <div className="replay-body">
        {errorMessage !== null && <p className="muted">{errorMessage}</p>}
        {messages.map((message, index) => (
          <div key={index} className={message.role === 'user' ? 'message message-user' : 'message'}>
            <span className="message-role">{message.role === 'user' ? '>' : '●'}</span>
            <pre className="message-text">{message.text}</pre>
          </div>
        ))}
      </div>
    </div>
  )
}
