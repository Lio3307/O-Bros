import { ExternalLink, Square } from 'lucide-react'
import { useEffect } from 'react'
import { usePortsStore } from '../../state/portsStore'
import { isTerminalTab, useWorkspaceStore } from '../../state/workspaceStore'
import { Button } from '../../ui/Button'
import { LoadingText } from '../../ui/LoadingText'

const PORTS_POLL_MS = 5000

export function PortsSection() {
  const ports = usePortsStore((state) => state.ports)
  const load = usePortsStore((state) => state.load)
  const stop = usePortsStore((state) => state.stop)
  const open = usePortsStore((state) => state.open)
  const tabs = useWorkspaceStore((state) => state.tabs)

  useEffect(() => {
    void load()
    const timer = setInterval(() => void load(), PORTS_POLL_MS)
    return () => clearInterval(timer)
  }, [load])

  function terminalTitle(paneId: string): string {
    for (const tab of tabs.filter(isTerminalTab)) {
      const pane = tab.panes[paneId]
      if (pane !== undefined) {
        return pane.title
      }
    }
    return 'Terminal'
  }

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
              {entry.processName} · {terminalTitle(entry.paneId)}
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
          <Button variant="plain" className="port-stop hover-danger" title="Stop this process" onClick={() => stop(entry)}>
            <Square size={12} /> Stop
          </Button>
        </div>
      ))}
    </div>
  )
}
