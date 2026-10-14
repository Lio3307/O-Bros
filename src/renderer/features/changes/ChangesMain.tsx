import { FileDiff, Network, type LucideIcon } from 'lucide-react'
import { useChangesStore, type ChangesView } from '../../state/changesStore'
import { Button } from '../../ui/Button'
import { CommitGraphView } from './CommitGraphView'
import { DiffView } from './DiffView'
import './changes.css'

const VIEW_TABS: { value: ChangesView; label: string; Icon: LucideIcon }[] = [
  { value: 'diff', label: 'Changes', Icon: FileDiff },
  { value: 'graph', label: 'Graph', Icon: Network }
]

export function ChangesMain() {
  const view = useChangesStore((state) => state.view)
  const setView = useChangesStore((state) => state.setView)

  return (
    <div className="changes-main">
      <div className="changes-tabs" role="tablist">
        {VIEW_TABS.map(({ value, label, Icon }) => (
          <Button
            key={value}
            variant="plain"
            className={value === view ? 'changes-tab changes-tab-active' : 'changes-tab'}
            onClick={() => setView(value)}
            role="tab"
            aria-selected={value === view}
          >
            <Icon size={14} /> {label}
          </Button>
        ))}
      </div>
      <div className="changes-main-content">{view === 'graph' ? <CommitGraphView /> : <DiffView />}</div>
    </div>
  )
}
