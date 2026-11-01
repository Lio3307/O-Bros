import { Suspense, useRef, type CSSProperties } from 'react'
import { useActiveProjectTabs } from '../../state/activeProjectTabs'
import { openTerminal } from '../../state/openTerminal'
import { useProjectsStore } from '../../state/projectsStore'
import { useTeamStore } from '../../state/teamStore'
import { isTerminalTab, useWorkspaceStore } from '../../state/workspaceStore'
import { TeamMemberViews } from '../team/TeamMemberViews'
import { computePaneRects, listDividers } from './paneTree'
import { PaneDivider } from './PaneDivider'
import { PaneLayoutView, placement } from './PaneLayoutView'
import { SplitDropOverlay } from './SplitDropOverlay'
import { TabBar } from './TabBar'
import { isShowingSplit, layoutOfSplit } from './workspaceSplit'
import './terminal.css'
import './workspaceSplit.css'
import { Button } from '../../ui/Button'
import { lazyComponent } from '../../ui/lazyComponent'
import { LoadingText } from '../../ui/LoadingText'
import { imageTypeOf } from '../../../shared/imageFiles'
import { cn } from '../../ui/cn'

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

const CodeEditor = lazyComponent(() => import('../editor/CodeEditor').then((module) => module.CodeEditor))
const ImageViewer = lazyComponent(() => import('../editor/ImageViewer').then((module) => module.ImageViewer))

interface TerminalWorkspaceProps {
  isVisible: boolean
}

export function TerminalWorkspace({ isVisible }: TerminalWorkspaceProps) {
  const tabs = useWorkspaceStore((state) => state.tabs)
  const projectTabs = useActiveProjectTabs()
  const activeTabId = useWorkspaceStore((state) => state.activeTabId)
  const startedTabIds = useRef(new Set<string>())
  const hasNoFolders = useProjectsStore((state) => state.roots.length === 0)
  const isMemberShown = useTeamStore((state) => state.shownMemberId !== null)

  const split = useWorkspaceStore((state) => state.split)
  const activateTab = useWorkspaceStore((state) => state.activateTab)
  const resizeWorkspaceSplit = useWorkspaceStore((state) => state.resizeWorkspaceSplit)
  const contentRef = useRef<HTMLDivElement>(null)

  const terminalTabs = tabs.filter(isTerminalTab)
  const shownSplit = isShowingSplit(split, activeTabId) && !isMemberShown ? split : null
  const shownTabIds = shownSplit === null ? (activeTabId === null ? [] : [activeTabId]) : [shownSplit.first, shownSplit.second]
  const shownFileTabs = projectTabs.filter((tab) => tab.kind === 'file' && shownTabIds.includes(tab.id))
  const rectByTabId = shownSplit === null ? {} : computePaneRects(layoutOfSplit(shownSplit))

  shownTabIds.forEach((tabId) => startedTabIds.current.add(tabId))

  function sideProps(tabId: string): { style?: CSSProperties; onMouseDownCapture?: () => void } {
    const rect = rectByTabId[tabId]
    return rect === undefined
      ? {}
      : { style: placement(rect), onMouseDownCapture: () => tabId !== activeTabId && activateTab(tabId) }
  }

  function sideClass(tabId: string): string | false {
    return shownSplit !== null && (tabId === activeTabId ? 'tab-content-side tab-content-side-focused' : 'tab-content-side')
  }

  return (
    <div className={isVisible ? 'workspace' : 'workspace workspace-hidden'}>
      <TabBar />
      <div className="workspace-content" ref={contentRef}>
        {!isMemberShown && projectTabs.length === 0 && hasNoFolders && <FirstRunState />}
        {!isMemberShown && projectTabs.length === 0 && !hasNoFolders && (
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
            const isShown = shownTabIds.includes(tab.id) && !isMemberShown
            return (
              <div key={tab.id} className={cn('tab-content', !isShown && 'tab-content-hidden', isShown && sideClass(tab.id))} {...(isShown ? sideProps(tab.id) : {})}>
                <PaneLayoutView tab={tab} layout={tab.layout} isVisible={isVisible && isShown} isFocusedSide={tab.id === activeTabId} />
              </div>
            )
          })}
        {!isMemberShown &&
          shownFileTabs.map(
            (fileTab) =>
              fileTab.kind === 'file' && (
                <div key={fileTab.id} className={cn('tab-content', sideClass(fileTab.id))} {...sideProps(fileTab.id)}>
                  <Suspense
                    fallback={
                      <div className="loading-overlay">
                        <LoadingText text="Opening the editor…" isDelayed />
                      </div>
                    }
                  >
                    {imageTypeOf(fileTab.path) === null ? (
                      <CodeEditor tabId={fileTab.id} filePath={fileTab.path} />
                    ) : (
                      <ImageViewer filePath={fileTab.path} />
                    )}
                  </Suspense>
                </div>
              )
          )}
        {shownSplit !== null &&
          listDividers(layoutOfSplit(shownSplit)).map((divider) => (
            <PaneDivider key="workspace-split" divider={divider} containerRef={contentRef} onRatioChange={resizeWorkspaceSplit} />
          ))}
        {!isMemberShown && <SplitDropOverlay />}
        <TeamMemberViews isVisible={isVisible} />
      </div>
    </div>
  )
}
