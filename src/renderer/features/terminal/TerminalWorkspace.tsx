import { lazy, Suspense, useRef } from 'react'
import { useActiveProjectTabs } from '../../state/activeProjectTabs'
import { openTerminal } from '../../state/openTerminal'
import { useProjectsStore } from '../../state/projectsStore'
import { isTerminalTab, useWorkspaceStore } from '../../state/workspaceStore'
import { PaneLayoutView } from './PaneLayoutView'
import { TabBar } from './TabBar'
import './terminal.css'
import { Button } from '../../ui/Button'

function FirstRunState() {
  const addRoot = useProjectsStore((state) => state.addRoot)

  return (
    <div className="empty-state">
      <p className="empty-state-title">Open a project folder to start</p>
      <p className="empty-state-text">Agents work inside the folder you choose, never in your whole home folder.</p>
      <Button variant="primary" onClick={() => addRoot()}>
        Open a project folder
      </Button>
      <Button variant="link" onClick={() => openTerminal(null)}>
        Open a terminal in your home folder
      </Button>
    </div>
  )
}

const CodeEditor = lazy(() => import('../editor/CodeEditor').then((module) => ({ default: module.CodeEditor })))

interface TerminalWorkspaceProps {
  isVisible: boolean
}

export function TerminalWorkspace({ isVisible }: TerminalWorkspaceProps) {
  const tabs = useWorkspaceStore((state) => state.tabs)
  const projectTabs = useActiveProjectTabs()
  const activeTabId = useWorkspaceStore((state) => state.activeTabId)
  const startedTabIds = useRef(new Set<string>())
  const hasNoFolders = useProjectsStore((state) => state.roots.length === 0)

  const terminalTabs = tabs.filter(isTerminalTab)
  const activeFileTab = projectTabs.find((tab) => tab.kind === 'file' && tab.id === activeTabId)

  if (activeTabId !== null) {
    startedTabIds.current.add(activeTabId)
  }

  return (
    <div className={isVisible ? 'workspace' : 'workspace workspace-hidden'}>
      <TabBar />
      <div className="workspace-content">
        {projectTabs.length === 0 && hasNoFolders && <FirstRunState />}
        {projectTabs.length === 0 && !hasNoFolders && (
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
