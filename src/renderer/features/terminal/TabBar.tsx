import { ChevronDown, Columns2, Plus, Rows2, Square, X } from 'lucide-react'
import { FileTypeIcon } from '../../ui/FileTypeIcon'
import { TerminalTabIcon } from './TerminalTabIcon'
import { TabTeamButton } from './TabTeamButton'
import { useCallback, useEffect, useRef, useState, type MouseEvent, type WheelEvent } from 'react'
import { useActiveProjectTabs } from '../../state/activeProjectTabs'
import { useAttentionStore } from '../../state/attentionStore'
import { useAgentStatusStore } from '../../state/agentStatusStore'
import { copyPath, revealInFileExplorer } from '../files/fileActions'
import { openTerminal } from '../../state/openTerminal'
import { requestCloseOtherTabs, requestCloseTab } from '../../state/requestCloseTab'
import { isTerminalTab, useWorkspaceStore, type WorkspaceTab } from '../../state/workspaceStore'
import { openTabBeside, openTerminalBeside } from '../../state/splitActions'
import { continueInAnotherAgentItem } from '../history/continueFromTab'
import { isShowingSplit, TAB_DRAG_TYPE } from './workspaceSplit'
import { showTab } from '../../state/showTab'
import { cn } from '../../ui/cn'
import { EditableTitle } from '../../ui/EditableTitle'
import { PopupMenu, type PopupMenuItem } from '../../ui/PopupMenu'
import { useShortcutLabel } from '../../state/shortcutsStore'

const MIDDLE_MOUSE_BUTTON = 1

interface OpenMenu {
  x: number
  y: number
  items: PopupMenuItem[]
  anchor?: Element
}

function locationOf(tab: WorkspaceTab): string | null {
  return tab.kind === 'file' ? tab.path : tab.cwd
}

function continueItem(tab: WorkspaceTab): PopupMenuItem[] {
  const item = isTerminalTab(tab) ? continueInAnotherAgentItem(tab) : null
  return item === null ? [] : [{ ...item, hasSeparatorBefore: true }]
}

function splitItems(tab: WorkspaceTab): PopupMenuItem[] {
  const { split, activeTabId, closeSplit } = useWorkspaceStore.getState()
  if (isShowingSplit(split, tab.id) && isShowingSplit(split, activeTabId)) {
    return [{ label: 'Close split', onSelect: closeSplit }]
  }
  if (activeTabId === null || activeTabId === tab.id) {
    return []
  }
  return [
    { label: 'Open beside', onSelect: () => openTabBeside(tab.id, 'horizontal') },
    { label: 'Open below', onSelect: () => openTabBeside(tab.id, 'vertical') }
  ]
}

function contextMenuItemsFor(tab: WorkspaceTab): PopupMenuItem[] {
  const location = locationOf(tab)
  return [
    ...splitItems(tab),
    { label: 'Close', onSelect: () => requestCloseTab(tab.id) },
    { label: 'Close other tabs', onSelect: () => requestCloseOtherTabs(tab.id) },
    {
      label: 'Copy path',
      isDisabled: location === null,
      onSelect: () => void copyPath(location ?? '')
    },
    {
      label: 'Reveal in folder',
      isDisabled: location === null,
      onSelect: () => void revealInFileExplorer(location ?? '')
    },
    ...continueItem(tab)
  ]
}

interface TabItemProps {
  tab: WorkspaceTab
  isActive: boolean
  onOpenMenu: (menu: OpenMenu) => void
}

function TabItem({ tab, isActive, onOpenMenu }: TabItemProps) {
  const renameTab = useWorkspaceStore((state) => state.renameTab)
  const moveTab = useWorkspaceStore((state) => state.moveTab)
  const setDraggedTab = useWorkspaceStore((state) => state.setDraggedTab)
  const isBesideActive = useWorkspaceStore(
    (state) => !isActive && isShowingSplit(state.split, state.activeTabId) && (state.split.first === tab.id || state.split.second === tab.id)
  )
  const needsAttention = useAttentionStore((state) => state.tabIds.includes(tab.id))
  const showsAgentStatus = useAgentStatusStore(
    (state) => tab.kind === 'terminal' && Object.keys(tab.panes).some((paneId) => state.statuses[paneId] !== undefined)
  )

  const isModified = tab.kind === 'file' && tab.isModified

  function handleMouseDown(event: MouseEvent): void {
    if (event.button === MIDDLE_MOUSE_BUTTON) {
      event.preventDefault()
      requestCloseTab(tab.id)
    }
  }

  return (
    <div
      className={cn('tab', isActive && 'tab-active', isBesideActive && 'tab-beside')}
      title={tab.kind === 'file' ? tab.path : tab.title}
      draggable
      onClick={() => showTab(tab.id)}
      onMouseDown={handleMouseDown}
      onContextMenu={(event) => {
        event.preventDefault()
        onOpenMenu({ x: event.clientX, y: event.clientY, items: contextMenuItemsFor(tab) })
      }}
      onDragStart={(event) => {
        event.dataTransfer.setData(TAB_DRAG_TYPE, tab.id)
        event.dataTransfer.effectAllowed = 'move'
        setDraggedTab(tab.id)
      }}
      onDragEnd={() => setDraggedTab(null)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        setDraggedTab(null)
        moveTab(event.dataTransfer.getData(TAB_DRAG_TYPE), tab.id)
      }}
    >
      {tab.kind === 'terminal' ? <TerminalTabIcon tab={tab} /> : <FileTypeIcon path={tab.path} />}
      {tab.kind === 'terminal' ? (
        <EditableTitle className="tab-title" value={tab.title} onCommit={(title) => renameTab(tab.id, title)} />
      ) : (
        <span className="tab-title">{tab.title}</span>
      )}
      {tab.kind === 'terminal' && <TabTeamButton tab={tab} />}
      {isModified && <span className="tab-modified-dot" title="Unsaved changes" />}
      {needsAttention && !isActive && !showsAgentStatus && <span className="tab-attention-dot" title="Finished while you were away" />}
      <button
        type="button"
        className="tab-close"
        title="Close tab"
        onClick={(event) => {
          event.stopPropagation()
          requestCloseTab(tab.id)
        }}
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function TabBar() {
  const tabs = useActiveProjectTabs()
  const activeTabId = useWorkspaceStore((state) => state.activeTabId)
  const splitPane = useWorkspaceStore((state) => state.splitPane)
  const closeSplit = useWorkspaceStore((state) => state.closeSplit)
  const isSplitShown = useWorkspaceStore((state) => isShowingSplit(state.split, state.activeTabId))
  const splitRightLabel = useShortcutLabel('splitRight')
  const splitDownLabel = useShortcutLabel('splitDown')
  const clearAttention = useAttentionStore((state) => state.clear)
  const [openMenu, setOpenMenu] = useState<OpenMenu | null>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const closeMenu = useCallback(() => setOpenMenu(null), [])

  const activeTab = tabs.find((tab) => tab.id === activeTabId)
  const splittableTab =
    activeTab?.kind === 'terminal' && Object.keys(activeTab.panes).length === 1 ? activeTab : null

  useEffect(() => {
    function clearActiveTabAttention(): void {
      if (activeTabId !== null) {
        clearAttention(activeTabId)
      }
    }
    clearActiveTabAttention()
    window.addEventListener('focus', clearActiveTabAttention)
    return () => window.removeEventListener('focus', clearActiveTabAttention)
  }, [activeTabId, clearAttention])

  useEffect(() => {
    scrollerRef.current?.querySelector('.tab-active')?.scrollIntoView({ inline: 'nearest', block: 'nearest' })
  }, [activeTabId, tabs.length])

  function scrollTabsSideways(event: WheelEvent<HTMLDivElement>): void {
    if (scrollerRef.current !== null && event.deltaX === 0) {
      scrollerRef.current.scrollLeft += event.deltaY
    }
  }

  function showAllTabs(event: MouseEvent<HTMLButtonElement>): void {
    const anchor = event.currentTarget
    const bounds = anchor.getBoundingClientRect()
    setOpenMenu({
      anchor,
      x: bounds.left,
      y: bounds.bottom + 4,
      items: tabs.map((tab) => ({
        label: tab.title,
        isActive: tab.id === activeTabId,
        onSelect: () => showTab(tab.id)
      }))
    })
  }

  return (
    <div className="tab-bar">
      <div className="tab-list">
        <div className="tab-scroller" ref={scrollerRef} onWheel={scrollTabsSideways}>
          {tabs.map((tab) => (
            <TabItem key={tab.id} tab={tab} isActive={tab.id === activeTabId} onOpenMenu={setOpenMenu} />
          ))}
        </div>
        <button type="button" className="tab-new" title="New terminal" onClick={() => openTerminal(null)}>
          <Plus size={16} />
        </button>
      </div>
      <div className="tab-bar-actions">
        {tabs.length > 1 && (
          <button type="button" title="All tabs" onClick={showAllTabs}>
            <ChevronDown size={16} />
          </button>
        )}
        {isSplitShown && (
          <button type="button" title="Close split and show one tab" aria-label="Close split" onClick={closeSplit}>
            <Square size={16} />
          </button>
        )}
        {!isSplitShown && activeTab?.kind === 'file' && (
          <>
            <button type="button" title="Open a terminal to the right" aria-label="Open a terminal to the right" onClick={() => openTerminalBeside('horizontal')}>
              <Columns2 size={16} />
            </button>
            <button type="button" title="Open a terminal below" aria-label="Open a terminal below" onClick={() => openTerminalBeside('vertical')}>
              <Rows2 size={16} />
            </button>
          </>
        )}
        {splittableTab !== null && (
          <>
            <button
              type="button"
              title={`Split right (${splitRightLabel})`}
              onClick={() => splitPane(splittableTab.id, splittableTab.focusedPaneId, 'horizontal')}
            >
              <Columns2 size={16} />
            </button>
            <button
              type="button"
              title={`Split down (${splitDownLabel})`}
              onClick={() => splitPane(splittableTab.id, splittableTab.focusedPaneId, 'vertical')}
            >
              <Rows2 size={16} />
            </button>
          </>
        )}
      </div>
      {openMenu !== null && <PopupMenu x={openMenu.x} y={openMenu.y} items={openMenu.items} anchor={openMenu.anchor} onClose={closeMenu} />}
    </div>
  )
}
