import { Square } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  choiceFor,
  type LanguageServerSource,
  type LanguageServerStatus,
  type RunningLanguageServer
} from '../../../shared/languageServers'
import { lastPathSegment } from '../../../shared/paths'
import { useLanguageServerStore } from '../../state/languageServerStore'
import { useProjectsStore } from '../../state/projectsStore'
import { Button } from '../../ui/Button'
import { Chip } from '../../ui/Chip'
import { LoadingText } from '../../ui/LoadingText'
import { SettingsPageLayout } from '../../ui/SettingsPageLayout'
import { SettingsSection } from '../../ui/SettingsSection'
import { StatusDot, type StatusTone } from '../../ui/StatusDot'
import './settings.css'
import './settingsControls.css'

const RUNNING_POLL_MS = 3000

const SOURCE_LABELS: Record<LanguageServerSource, string> = {
  project: 'Found in this project',
  path: 'Found on this computer',
  custom: 'Your own command'
}

const SOURCE_TONES: Record<LanguageServerSource, StatusTone> = { project: 'success', path: 'success', custom: 'info' }

function ServerRow({ server }: { server: LanguageServerStatus }) {
  const choice = useLanguageServerStore((state) => choiceFor(state.choices, server.id))
  const setEnabled = useLanguageServerStore((state) => state.setEnabled)
  const setCustomCommand = useLanguageServerStore((state) => state.setCustomCommand)
  const [draft, setDraft] = useState(choice.customCommand ?? '')
  const [isEditing, setIsEditing] = useState(false)
  const isCancelling = useRef(false)
  const defaultCommand = [server.command, ...server.args].join(' ')
  const showsCommand = isEditing || choice.customCommand !== null

  function save(): void {
    if (isCancelling.current) {
      isCancelling.current = false
      return
    }
    setCustomCommand(server.id, draft)
    setIsEditing(false)
  }

  function cancel(): void {
    isCancelling.current = true
    setDraft(choice.customCommand ?? '')
    setIsEditing(false)
  }

  return (
    <div className="table-row table-row-stacked language-server-row">
      <div className="cell cell-account">
        <span className="language-server-title">
          <span className="account-label">{server.title}</span>
          <span className="status-label">
            <StatusDot tone={server.source === null ? 'neutral' : SOURCE_TONES[server.source]} />
            {server.source === null ? 'Not installed' : SOURCE_LABELS[server.source]}
          </span>
        </span>
        <span className="language-server-chips">
          {server.languages.map((language) => (
            <Chip key={language}>{language}</Chip>
          ))}
        </span>
        {server.resolvedPath !== null && <span className="muted mono">{server.resolvedPath}</span>}
        {server.source === null && (
          <span className="muted">
            Install it with <span className="mono">{server.install}</span>, then press Look again.
          </span>
        )}
        {showsCommand ? (
          <label className="language-server-command">
            <span className="muted">
              Your own command, used instead of <span className="mono">{defaultCommand}</span>. Leave it empty to go back.
              Enter saves, Esc cancels.
            </span>
            <input
              className="field mono"
              placeholder={defaultCommand}
              value={draft}
              autoFocus={isEditing}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={save}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  save()
                } else if (event.key === 'Escape') {
                  cancel()
                  event.currentTarget.blur()
                }
              }}
            />
          </label>
        ) : (
          <button type="button" className="link-button language-server-command-toggle" onClick={() => setIsEditing(true)}>
            Use my own command…
          </button>
        )}
      </div>
      <label className="toggle-row language-server-toggle">
        <input type="checkbox" checked={choice.isEnabled} onChange={(event) => setEnabled(server.id, event.target.checked)} />
        <span>Use</span>
      </label>
    </div>
  )
}

function RunningServers() {
  const [running, setRunning] = useState<RunningLanguageServer[]>([])

  useEffect(() => {
    let isCurrent = true
    function read(): void {
      void window.api.lsp
        .running()
        .then((list) => isCurrent && setRunning(list))
        .catch(() => undefined)
    }
    read()
    const timer = setInterval(read, RUNNING_POLL_MS)
    return () => {
      isCurrent = false
      clearInterval(timer)
    }
  }, [])

  return (
    <SettingsSection
      title="Running now"
      description={
        <>
          A server starts when you open a file it understands and stops a minute after you close its last file. Each one
          uses memory: the TypeScript server often needs 200 to 500 MB for a large project.
        </>
      }
    >
      {running.length === 0 && <p className="muted">No language server is running.</p>}
      {running.length > 0 && (
        <div className="table">
          {running.map((server) => (
            <div key={server.sessionId} className="table-row language-server-row">
              <div className="cell cell-account">
                <span className="account-label">{server.serverTitle}</span>
                <span className="muted">
                  {lastPathSegment(server.rootPath)} · {server.openFiles === 1 ? '1 open file' : `${server.openFiles} open files`}
                </span>
              </div>
              <Button variant="outline" className="hover-danger" onClick={() => void window.api.lsp.stop(server.sessionId)}>
                <Square size={12} /> Stop
              </Button>
            </div>
          ))}
        </div>
      )}
    </SettingsSection>
  )
}

export function LanguageServersPage() {
  const choices = useLanguageServerStore((state) => state.choices)
  const activeProjectPath = useProjectsStore((state) => state.activeProjectPath)
  const [servers, setServers] = useState<LanguageServerStatus[] | null>(null)
  const [lookCount, setLookCount] = useState(0)

  useEffect(() => {
    let isCurrent = true
    window.api.lsp
      .statuses(activeProjectPath, choices)
      .then((found) => isCurrent && setServers(found))
      .catch(() => isCurrent && setServers([]))
    return () => {
      isCurrent = false
    }
  }, [activeProjectPath, choices, lookCount])

  const installed = servers?.filter((server) => server.source !== null) ?? []
  const missing = servers?.filter((server) => server.source === null) ?? []

  return (
    <SettingsPageLayout
      title="Language servers"
      description={
        <>
          Language servers give the editor real code intelligence: completions from your whole project and its packages,
          type information on hover, errors as you type, go to definition (F12), find references (Shift+F12) and
          parameter hints (Ctrl+Shift+Space). O-BROS finds the servers installed in the selected project or on this
          computer and starts the right one for the file you open. You can turn one off or give your own command.
        </>
      }
      actions={
        <Button variant="outline" onClick={() => setLookCount(lookCount + 1)}>
          Look again
        </Button>
      }
    >
      <RunningServers />
      {servers === null ? (
        <p className="muted">
          <LoadingText text="Looking for language servers…" />
        </p>
      ) : (
        <>
          <SettingsSection
            title="Found"
            description={
              installed.length === 0
                ? 'No language server was found. Install one below and press Look again.'
                : 'For each language the first one that is turned on is used.'
            }
          >
            {installed.length > 0 && (
              <div className="table">
                {installed.map((server) => (
                  <ServerRow key={server.id} server={server} />
                ))}
              </div>
            )}
          </SettingsSection>
          <SettingsSection title="Not installed" description="Install the ones for the languages you use, or enter your own command.">
            <div className="table">
              {missing.map((server) => (
                <ServerRow key={server.id} server={server} />
              ))}
            </div>
          </SettingsSection>
        </>
      )}
    </SettingsPageLayout>
  )
}
