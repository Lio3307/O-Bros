import type { JSX } from 'react'
import { ChangesPanel } from '../features/changes/ChangesPanel'
import { HistoryPanel } from '../features/history/HistoryPanel'
import { ProjectsPanel } from '../features/projects/ProjectsPanel'
import { SettingsPanel } from '../features/settings/SettingsPanel'
import { TeamPanel } from '../features/team/TeamPanel'
import { useLayoutStore, type Section } from '../state/layoutStore'

const panelBySection: Partial<Record<Section, () => JSX.Element>> = {
  projects: ProjectsPanel,
  history: HistoryPanel,
  changes: ChangesPanel,
  team: TeamPanel,
  settings: SettingsPanel
}

export function SidePanel() {
  const section = useLayoutStore((state) => state.section)
  const Panel = panelBySection[section]
  if (Panel === undefined) {
    return null
  }

  return (
    <aside className="side-panel">
      <Panel />
    </aside>
  )
}
