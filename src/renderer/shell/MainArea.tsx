import { Suspense } from 'react'
import { TerminalWorkspace } from '../features/terminal/TerminalWorkspace'
import { useLayoutStore } from '../state/layoutStore'
import { lazyComponent } from '../ui/lazyComponent'
import { LoadingText } from '../ui/LoadingText'

const SessionReplay = lazyComponent(() => import('../features/history/SessionReplay').then((module) => module.SessionReplay))
const ChangesMain = lazyComponent(() => import('../features/changes/ChangesMain').then((module) => module.ChangesMain))
const ActivityMonitor = lazyComponent(() =>
  import('../features/activity/monitor/ActivityMonitor').then((module) => module.ActivityMonitor)
)
const SettingsPage = lazyComponent(() => import('../features/settings/SettingsPage').then((module) => module.SettingsPage))

function MainLoading() {
  return (
    <div className="main-loading">
      <LoadingText text="Loading…" />
    </div>
  )
}

export function MainArea() {
  const section = useLayoutStore((state) => state.section)

  return (
    <main className="main-area">
      <TerminalWorkspace isVisible={section === 'projects'} />
      <Suspense fallback={<MainLoading />}>
        {section === 'history' && <SessionReplay />}
        {section === 'changes' && <ChangesMain />}
        {section === 'activity' && <ActivityMonitor />}
        {section === 'settings' && <SettingsPage />}
      </Suspense>
    </main>
  )
}
