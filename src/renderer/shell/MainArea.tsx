import { ActivityMonitor } from '../features/activity/monitor/ActivityMonitor'
import { ChangesMain } from '../features/changes/ChangesMain'
import { SessionReplay } from '../features/history/SessionReplay'
import { SettingsPage } from '../features/settings/SettingsPage'
import { TeamWorkspace } from '../features/team/TeamWorkspace'
import { TerminalWorkspace } from '../features/terminal/TerminalWorkspace'
import { useLayoutStore } from '../state/layoutStore'

export function MainArea() {
  const section = useLayoutStore((state) => state.section)

  return (
    <main className="main-area">
      <TerminalWorkspace isVisible={section === 'projects'} />
      <TeamWorkspace isVisible={section === 'team'} />
      {section === 'history' && <SessionReplay />}
      {section === 'changes' && <ChangesMain />}
      {section === 'activity' && <ActivityMonitor />}
      {section === 'settings' && <SettingsPage />}
    </main>
  )
}
