import { useEffect } from 'react'
import { FilesPanel } from './features/files/FilesPanel'
import { FileActionDialogs } from './features/files/FileActionDialogs'
import { QuickOpen } from './features/files/QuickOpen'
import { CloseConfirmModal } from './features/shutdown/CloseConfirmModal'
import { useQuickOpenShortcut } from './features/files/useQuickOpenShortcut'
import { useTerminalZoomShortcuts } from './features/terminal/useTerminalZoomShortcuts'
import { MainArea } from './shell/MainArea'
import { Rail } from './shell/Rail'
import { SidePanel } from './shell/SidePanel'
import { StatusBar } from './shell/StatusBar'
import { TitleBar } from './shell/TitleBar'
import { ConfirmHost } from './ui/ConfirmHost'
import { ToastHost } from './ui/ToastHost'
import { useCloseRequestStore } from './state/closeRequestStore'
import { useLayoutStore } from './state/layoutStore'
import { useProjectsStore } from './state/projectsStore'
import { useRefreshStore } from './state/refreshStore'
import { restoreSavedSession, startSessionPersistence } from './state/sessionPersistence'

const USAGE_REFRESH_MS = 5 * 60_000

function useStartupData(): void {
  const loadProjects = useProjectsStore((state) => state.load)
  const refreshAccountsAndUsage = useRefreshStore((state) => state.refresh)

  useEffect(() => {
    restoreSavedSession()
    return startSessionPersistence()
  }, [])

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  useEffect(() => {
    void refreshAccountsAndUsage()
    const timer = setInterval(() => void refreshAccountsAndUsage(), USAGE_REFRESH_MS)
    return () => clearInterval(timer)
  }, [refreshAccountsAndUsage])
}

function useCloseRequests(): void {
  const beginClose = useCloseRequestStore((state) => state.begin)

  useEffect(() => window.api.app.onCloseRequested(() => void beginClose()), [beginClose])
}

export function App() {
  useStartupData()
  useCloseRequests()
  useTerminalZoomShortcuts()
  useQuickOpenShortcut()
  const sidebarMode = useLayoutStore((state) => state.sidebarMode)
  const section = useLayoutStore((state) => state.section)
  const isFilesPanelOpen = useLayoutStore((state) => state.isFilesPanelOpen)
  const isQuickOpenVisible = useLayoutStore((state) => state.isQuickOpenVisible)

  return (
    <div className="app">
      <TitleBar />
      <div className="app-body">
        {sidebarMode !== 'hidden' && <Rail />}
        {sidebarMode === 'expanded' && <SidePanel />}
        <MainArea />
        {isFilesPanelOpen && section === 'projects' && <FilesPanel />}
      </div>
      <StatusBar />
      {isQuickOpenVisible && <QuickOpen />}
      <FileActionDialogs />
      <CloseConfirmModal />
      <ConfirmHost />
      <ToastHost />
    </div>
  )
}
