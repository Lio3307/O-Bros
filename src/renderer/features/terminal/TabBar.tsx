import { ChevronDown, Columns2, File, Plus, Rows2, X } from 'lucide-react'
import { TerminalTabIcon } from './TerminalTabIcon'
import { useCallback, useEffect, useRef, useState, type MouseEvent, type WheelEvent } from 'react'
import { useActiveProjectTabs } from '../../state/activeProjectTabs'
import { useAttentionStore } from '../../state/attentionStore'
import { copyPath, revealInFileExplorer } from '../files/fileActions'
import { openTerminal } from '../../state/openTerminal'
import { requestCloseOtherTabs, requestCloseTab } from '../../state/requestCloseTab'
import { useWorkspaceStore, type WorkspaceTab } from '../../state/workspaceStore'
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

function contextMenuItemsFor(tab: WorkspaceTab): PopupMenuItem[] {
  const location = locationOf(tab)
  return [
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
    }
  ]
}

interface TabItemProps {
  tab: WorkspaceTab
  isActive: boolean
  onOpenMenu: (menu: OpenMenu) => void
}

function TabItem({ tab, isActive, onOpenMenu }: TabItemProps) {
  const activateTab = useWorkspaceStore((state) => state.activateTab)
  const renameTab = useWorkspaceStore((state) => state.renameTab)
  const moveTab = useWorkspaceStore((state) => state.moveTab)
  const needsAttention = useAttentionStore((state) => state.tabIds.includes(tab.id))

  const isModified = tab.kind === 'file' && tab.isModified

  function handleMouseDown(event: MouseEvent): void {
    if (event.button === MIDDLE_MOUSE_BUTTON) {
      event.preventDefault()
      requestCloseTab(tab.id)
    }
  }

  return (
    <div
      className={isActive ? 'tab tab-active' : 'tab'}
      title={tab.kind === 'file' ? tab.path : tab.title}
      draggable
      onClick={() => activateTab(tab.id)}
      onMouseDown={handleMouseDown}
      onContextMenu={(event) => {
        event.preventDefault()
        onOpenMenu({ x: event.clientX, y: event.clientY, items: contextMenuItemsFor(tab) })
      }}
      onDragStart={(event) => event.dataTransfer.setData('text/plain', tab.id)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        moveTab(event.dataTransfer.getData('text/plain'), tab.id)
      }}
    >
      {tab.kind === 'terminal' ? <TerminalTabIcon tab={tab} /> : <File size={14} />}
      {tab.kind === 'terminal' ? (
        <EditableTitle className="tab-title" value={tab.title} onCommit={(title) => renameTab(tab.id, title)} />
      ) : (
        <span className="tab-title">{tab.title}</span>
      )}
      {isModified && <span className="tab-modified-dot" title="Unsaved changes" />}
      {needsAttention && !isActive && <span className="tab-attention-dot" title="Finished while you were away" />}
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
  const splitRightLabel = useShortcutLabel('splitRight')
  const splitDownLabel = useShortcutLabel('splitDown')
  const activateTab = useWorkspaceStore((state) => state.activateTab)
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
        onSelect: () => activateTab(tab.id)
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
