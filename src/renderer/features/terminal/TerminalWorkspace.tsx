import { lazy, Suspense, useRef } from 'react'
import { useActiveProjectTabs } from '../../state/activeProjectTabs'
import { openTerminal } from '../../state/openTerminal'
import { isTerminalTab, useWorkspaceStore } from '../../state/workspaceStore'
import { PaneLayoutView } from './PaneLayoutView'
import { TabBar } from './TabBar'
import './terminal.css'
import { Button } from '../../ui/Button'

const CodeEditor = lazy(() => import('../editor/CodeEditor').then((module) => ({ default: module.CodeEditor })))

interface TerminalWorkspaceProps {
  isVisible: boolean
}

export function TerminalWorkspace({ isVisible }: TerminalWorkspaceProps) {
  const tabs = useWorkspaceStore((state) => state.tabs)
  const projectTabs = useActiveProjectTabs()
  const activeTabId = useWorkspaceStore((state) => state.activeTabId)
  const startedTabIds = useRef(new Set<string>())

  const terminalTabs = tabs.filter(isTerminalTab)
  const activeFileTab = projectTabs.find((tab) => tab.kind === 'file' && tab.id === activeTabId)

  if (activeTabId !== null) {
    startedTabIds.current.add(activeTabId)
  }

  return (
    <div className={isVisible ? 'workspace' : 'workspace workspace-hidden'}>
      <TabBar />
      <div className="workspace-content">
        {projectTabs.length === 0 && (
          <div className="empty-state">
            <p>No terminal is open in this project.</p>
            <Button variant="primary" onClick={() => openTerminal(null)}>
              New terminal
            </Button>
          </div>
        )}
        {terminalTabs
          .filter((tab) => startedTabIds.current.has(tab.id))
          .map((tab) => {
            const isActive = tab.id === activeTabId
            return (
              <div key={tab.id} className={isActive ? 'tab-content' : 'tab-content tab-content-hidden'}>
                <PaneLayoutView tab={tab} layout={tab.layout} isVisible={isVisible && isActive} />
              </div>
            )
          })}
        {activeFileTab?.kind === 'file' && (
          <div className="tab-content">
            <Suspense fallback={null}>
              <CodeEditor tabId={activeFileTab.id} filePath={activeFileTab.path} />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  )
}
