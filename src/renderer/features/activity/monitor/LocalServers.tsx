import { ExternalLink, Server, Square, SquareTerminal } from 'lucide-react'
import type { ListeningPort } from '../../../../shared/types'
import { focusTerminalPane } from '../../../state/focusTerminalPane'
import { localUrlOf, terminalTitleOf, usePortsStore } from '../../../state/portsStore'
import { usePortPolling } from '../../../state/usePortPolling'
import { Button } from '../../../ui/Button'
import { LoadingText } from '../../../ui/LoadingText'
import { StatusDot } from '../../../ui/StatusDot'

function ServerRow({ server }: { server: ListeningPort }) {
  const stop = usePortsStore((state) => state.stop)
  const open = usePortsStore((state) => state.open)
  const url = localUrlOf(server)

  return (
    <li className="server-row">
      <StatusDot tone="success" />
      <span className="server-port">:{server.port}</span>
      <span className="server-body">
        <button type="button" className="server-url" title={`Open ${url} in your browser`} onClick={() => void open(server)}>
          {url}
        </button>
        <span className="server-owner">
          {server.processName} · process {server.pid} · {terminalTitleOf(server.paneId)}
        </span>
      </span>
      <span className="server-actions">
        <Button variant="plain" className="server-action hover-positive" title={`Open ${url} in your browser`} onClick={() => open(server)}>
          <ExternalLink size={13} /> Open
        </Button>
        <Button
          variant="plain"
          className="server-action"
          title="Show the terminal it runs in"
          onClick={() => {
            focusTerminalPane(server.paneId)
          }}
        >
          <SquareTerminal size={13} /> Terminal
        </Button>
        <Button variant="plain" className="server-action hover-danger" title="Stop this server" onClick={() => stop(server)}>
          <Square size={12} /> Stop
        </Button>
      </span>
    </li>
  )
}

export function LocalServers() {
  const servers = usePortsStore((state) => state.ports)
  usePortPolling()

  return (
    <section className="monitor-section">
      <h2 className="monitor-section-title">
        Local servers{servers !== null && servers.length > 0 ? ` · ${servers.length}` : ''}
      </h2>
      {servers === null && (
        <p className="monitor-empty">
          <LoadingText text="Looking for servers…" />
        </p>
      )}
      {servers !== null && servers.length === 0 && (
        <p className="monitor-empty server-empty">
          <Server size={14} /> No server started in an O-BROS terminal is listening right now. Start one, for example with npm run dev, and it shows here.
        </p>
      )}
      {servers !== null && servers.length > 0 && (
        <ul className="server-list">
          {servers.map((server) => (
            <ServerRow key={`${server.pid}-${server.port}`} server={server} />
          ))}
        </ul>
      )}
    </section>
  )
}
