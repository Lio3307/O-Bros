import { ExternalLink, Square } from 'lucide-react'
import { terminalTitleOf, usePortsStore } from '../../state/portsStore'
import { usePortPolling } from '../../state/usePortPolling'
import { Button } from '../../ui/Button'
import { LoadingText } from '../../ui/LoadingText'

export function PortsSection() {
  const ports = usePortsStore((state) => state.ports)
  const stop = usePortsStore((state) => state.stop)
  const open = usePortsStore((state) => state.open)
  usePortPolling()

  return (
    <div className="ports-section">
      <h3 className="section-label">Local servers</h3>
      {ports === null && (
        <p className="panel-empty">
          <LoadingText text="Looking for open ports…" />
        </p>
      )}
      {ports !== null && ports.length === 0 && <p className="panel-empty">No server started in a terminal is listening on a port.</p>}
      {ports?.map((entry) => (
        <div key={`${entry.pid}-${entry.port}`} className="resource-row resource-row-item port-row">
          <span className="resource-name">
            <span className="port-number">:{entry.port}</span>
            <span className="port-owner">
              {entry.processName} <span className="muted">· {terminalTitleOf(entry.paneId)}</span>
            </span>
          </span>
          <Button
            variant="plain"
            className="port-action hover-positive"
            title={`Open http://localhost:${entry.port} in your browser`}
            aria-label={`Open port ${entry.port} in your browser`}
            onClick={() => open(entry)}
          >
            <ExternalLink size={13} />
          </Button>
          <Button
            variant="plain"
            className="port-action hover-danger"
            title="Stop this server"
            aria-label={`Stop the server on port ${entry.port}`}
            onClick={() => stop(entry)}
          >
            <Square size={13} />
          </Button>
        </div>
      ))}
    </div>
  )
}
