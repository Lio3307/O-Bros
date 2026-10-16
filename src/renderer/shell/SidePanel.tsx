import { Suspense, type ComponentType } from 'react'
import { ProjectsPanel } from '../features/projects/ProjectsPanel'
import { TeamPanel } from '../features/team/TeamPanel'
import { useLayoutStore, type Section } from '../state/layoutStore'
import { lazyComponent } from '../ui/lazyComponent'
import { LoadingText } from '../ui/LoadingText'

const HistoryPanel = lazyComponent(() => import('../features/history/HistoryPanel').then((module) => module.HistoryPanel))
const ChangesPanel = lazyComponent(() => import('../features/changes/ChangesPanel').then((module) => module.ChangesPanel))
const SettingsPanel = lazyComponent(() => import('../features/settings/SettingsPanel').then((module) => module.SettingsPanel))

const panelBySection: Partial<Record<Section, ComponentType>> = {
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
      <Suspense fallback={<p className="panel-empty"><LoadingText text="Loading…" /></p>}>
        <Panel />
      </Suspense>
    </aside>
  )
}
