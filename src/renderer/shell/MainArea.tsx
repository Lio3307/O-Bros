import { ChangesMain } from '../features/changes/ChangesMain'
import { SessionReplay } from '../features/history/SessionReplay'
import { SettingsPage } from '../features/settings/SettingsPage'
import { TerminalWorkspace } from '../features/terminal/TerminalWorkspace'
import { useLayoutStore } from '../state/layoutStore'

export function MainArea() {
  const section = useLayoutStore((state) => state.section)

  return (
    <main className="main-area">
      <TerminalWorkspace isVisible={section === 'projects'} />
      {section === 'history' && <SessionReplay />}
      {section === 'changes' && <ChangesMain />}
      {section === 'settings' && <SettingsPage />}
    </main>
  )
}
