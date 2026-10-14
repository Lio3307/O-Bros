import { useEffect } from 'react'
import { FilesPanel } from './features/files/FilesPanel'
import { FileActionDialogs } from './features/files/FileActionDialogs'
import { QuickOpen } from './features/files/QuickOpen'
import { CommandPalette } from './features/commands/CommandPalette'
import { PromptPicker } from './features/prompts/PromptPicker'
import { TextPromptHost } from './ui/TextPromptHost'
import { CloseConfirmModal } from './features/shutdown/CloseConfirmModal'
import { useQuickOpenShortcut } from './features/files/useQuickOpenShortcut'
import { useTerminalZoomShortcuts } from './features/terminal/useTerminalZoomShortcuts'
import { useWorkspaceShortcuts } from './features/terminal/useWorkspaceShortcuts'
import { MainArea } from './shell/MainArea'
import { Rail } from './shell/Rail'
import { SidePanel } from './shell/SidePanel'
import { StatusBar } from './shell/StatusBar'
import { TitleBar } from './shell/TitleBar'
import { ConfirmHost } from './ui/ConfirmHost'
import { ToastHost } from './ui/ToastHost'
import { useCloseRequestStore } from './state/closeRequestStore'
import { useInstalledCommandsStore } from './state/installedCommandsStore'
import { useLayoutStore } from './state/layoutStore'
import { startProjectTabSync } from './state/projectTabSync'
import { useProjectsStore } from './state/projectsStore'
import { useRefreshStore } from './state/refreshStore'
import { restoreSavedSession, startSessionPersistence } from './state/sessionPersistence'

const USAGE_REFRESH_MS = 5 * 60_000
const COMMANDS_RESCAN_AFTER_MS = 30_000

function useStartupData(): void {
  const loadProjects = useProjectsStore((state) => state.load)
  const loadInstalledCommands = useInstalledCommandsStore((state) => state.load)
  const rescanInstalledCommands = useInstalledCommandsStore((state) => state.refreshIfOlderThan)
  const refreshAccountsAndUsage = useRefreshStore((state) => state.refresh)

  useEffect(() => {
    restoreSavedSession()
    const stopPersistence = startSessionPersistence()
    const stopProjectTabSync = startProjectTabSync()
    return () => {
      stopPersistence()
      stopProjectTabSync()
    }
  }, [])

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  useEffect(() => {
    void loadInstalledCommands()
    function rescanWhenWindowIsFocused(): void {
      void rescanInstalledCommands(COMMANDS_RESCAN_AFTER_MS)
    }
    window.addEventListener('focus', rescanWhenWindowIsFocused)
    return () => window.removeEventListener('focus', rescanWhenWindowIsFocused)
  }, [loadInstalledCommands, rescanInstalledCommands])

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
  useWorkspaceShortcuts()
  useQuickOpenShortcut()
  const sidebarMode = useLayoutStore((state) => state.sidebarMode)
  const section = useLayoutStore((state) => state.section)
  const isFilesPanelOpen = useLayoutStore((state) => state.isFilesPanelOpen)
  const isQuickOpenVisible = useLayoutStore((state) => state.isQuickOpenVisible)
  const isPromptPickerVisible = useLayoutStore((state) => state.isPromptPickerVisible)
  const isCommandPaletteVisible = useLayoutStore((state) => state.isCommandPaletteVisible)

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
      {isPromptPickerVisible && <PromptPicker />}
      {isCommandPaletteVisible && <CommandPalette />}
      <FileActionDialogs />
      <CloseConfirmModal />
      <ConfirmHost />
      <TextPromptHost />
      <ToastHost />
    </div>
  )
}
