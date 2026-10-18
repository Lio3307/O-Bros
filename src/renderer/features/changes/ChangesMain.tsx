import { FileDiff, Network, type LucideIcon } from 'lucide-react'
import { useChangesStore, type ChangesView } from '../../state/changesStore'
import { useProjectsStore } from '../../state/projectsStore'
import { LoadingText } from '../../ui/LoadingText'
import { Button } from '../../ui/Button'
import { CommitGraphView } from './CommitGraphView'
import { DiffView } from './DiffView'
import { FolderOverview } from './FolderOverview'
import './changes.css'

const VIEW_TABS: { value: ChangesView; label: string; Icon: LucideIcon }[] = [
  { value: 'diff', label: 'Changes', Icon: FileDiff },
  { value: 'graph', label: 'Graph', Icon: Network }
]

export function ChangesMain() {
  const view = useChangesStore((state) => state.view)
  const setView = useChangesStore((state) => state.setView)
  const status = useChangesStore((state) => state.status)
  const loadedPath = useChangesStore((state) => state.loadedPath)
  const errorMessage = useChangesStore((state) => state.errorMessage)
  const activeProjectPath = useProjectsStore((state) => state.activeProjectPath)

  if (activeProjectPath === null) {
    return <div className="changes-main"><p className="panel-empty">No folder selected. Open one in Projects first.</p></div>
  }
  if (loadedPath !== activeProjectPath) {
    return (
      <div className="changes-main">
        <p className="panel-empty"><LoadingText text="Reading the folder…" /></p>
      </div>
    )
  }
  if (status === null) {
    return (
      <div className="changes-main">
        <FolderOverview folderPath={activeProjectPath} message={errorMessage ?? 'This folder is not a git repository.'} />
      </div>
    )
  }

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
