import { ChangesPanel } from '../features/changes/ChangesPanel'
import { HistoryPanel } from '../features/history/HistoryPanel'
import { ProjectsPanel } from '../features/projects/ProjectsPanel'
import { SettingsPanel } from '../features/settings/SettingsPanel'
import { useLayoutStore, type Section } from '../state/layoutStore'

const panelBySection: Record<Section, () => JSX.Element> = {
  projects: ProjectsPanel,
  history: HistoryPanel,
  changes: ChangesPanel,
  settings: SettingsPanel
}

export function SidePanel() {
  const section = useLayoutStore((state) => state.section)
  const Panel = panelBySection[section]

  return (
    <aside className="side-panel">
      <Panel />
    </aside>
  )
}
