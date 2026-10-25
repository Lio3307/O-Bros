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
      <h3 className="section-label">Listening ports</h3>
      {ports === null && <p className="panel-empty"><LoadingText text="Looking for open ports…" /></p>}
      {ports !== null && ports.length === 0 && <p className="panel-empty">Nothing is listening on a port.</p>}
      {ports?.map((entry) => (
        <div key={`${entry.pid}-${entry.port}`} className="resource-row resource-row-terminal">
          <span className="resource-name">
            <span className="port-number">:{entry.port}</span>
            <span className="muted port-owner">
              {entry.processName} · {terminalTitleOf(entry.paneId)}
            </span>
          </span>
          <Button
            variant="plain"
            className="port-stop hover-positive"
            title={`Open http://localhost:${entry.port} in your browser`}
            onClick={() => open(entry)}
          >
            <ExternalLink size={12} /> Open
          </Button>
          <Button variant="plain" className="port-stop hover-danger" title="Stop this server" onClick={() => stop(entry)}>
            <Square size={12} /> Stop
          </Button>
        </div>
      ))}
    </div>
  )
}
