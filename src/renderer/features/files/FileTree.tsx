import { useCallback, useEffect, useState, type DragEvent, type KeyboardEvent, type MouseEvent } from 'react'
import { friendlyErrorMessage } from '../../../shared/friendlyError'
import type { DirectoryEntry } from '../../../shared/types'
import { useFileDialogStore } from '../../state/fileDialogStore'
import { useFileTreeStore } from '../../state/fileTreeStore'
import { DisclosureChevron } from '../../ui/DisclosureChevron'
import { FileTypeIcon, FolderTypeIcon } from '../../ui/FileTypeIcon'
import { PopupMenu, type PopupMenuItem } from '../../ui/PopupMenu'
import { setDraggedPaths } from './dragData'
import { cn } from '../../ui/cn'
import { draggedPathsFor, pathsBetween } from './pickRange'
import { buildEntryMenuItems } from './fileTreeMenu'
import { isSameData } from '../../../shared/sameData'

interface FileTreeProps {
  directoryPath: string
  depth: number
  selectedPath: string | null
  onOpenFile: (filePath: string) => void
}

type TreeEntryProps = Omit<FileTreeProps, 'directoryPath'> & { entry: DirectoryEntry }

interface OpenMenu {
  x: number
  y: number
  items: PopupMenuItem[]
}

const INDENT_PER_LEVEL_PX = 16
const BASE_INDENT_PX = 8
const FILE_ICON_ALIGNMENT_PX = 18
const DRAG_LABEL_OFFSET_PX = 12

function shownTreePaths(row: Element): string[] {
  const tree = row.closest('.files-tree')
  return tree === null ? [] : Array.from(tree.querySelectorAll<HTMLElement>('[data-path]'), (element) => element.dataset.path ?? '')
}

function showCountWhileDragging(event: DragEvent, count: number): void {
  const label = document.createElement('div')
  label.className = 'drag-count'
  label.textContent = `${count} items`
  document.body.appendChild(label)
  event.dataTransfer.setDragImage(label, DRAG_LABEL_OFFSET_PX, DRAG_LABEL_OFFSET_PX)
  requestAnimationFrame(() => label.remove())
}

function TreeEntry({ entry, depth, selectedPath, onOpenFile }: TreeEntryProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [openMenu, setOpenMenu] = useState<OpenMenu | null>(null)
  const collapseRequest = useFileTreeStore((state) => state.collapseRequest)
  const openDialog = useFileDialogStore((state) => state.open)
  const closeMenu = useCallback(() => setOpenMenu(null), [])
  const isPicked = useFileTreeStore((state) => state.pickedPaths.includes(entry.path))
  const indent = BASE_INDENT_PX + depth * INDENT_PER_LEVEL_PX

  useEffect(() => {
    if (collapseRequest !== null && collapseRequest.path === entry.path) {
      setIsExpanded(false)
    }
  }, [collapseRequest, entry.path])

  function showMenu(event: MouseEvent): void {
    event.preventDefault()
    const items = buildEntryMenuItems({ path: entry.path, isDirectory: entry.isDirectory, isExpanded: isExpanded && entry.hasChildren })
    setOpenMenu({ x: event.clientX, y: event.clientY, items })
  }

  function startDrag(event: DragEvent): void {
    const paths = draggedPathsFor(useFileTreeStore.getState().pickedPaths, entry.path)
    setDraggedPaths(event.dataTransfer, paths)
    if (paths.length > 1) {
      showCountWhileDragging(event, paths.length)
    }
  }

  function clickRow(event: MouseEvent<HTMLButtonElement>, open: () => void): void {
    const store = useFileTreeStore.getState()
    if (event.ctrlKey || event.metaKey) {
      store.togglePicked(entry.path)
      return
    }
    if (event.shiftKey) {
      const anchor = store.pickAnchor ?? selectedPath ?? entry.path
      store.setPicked(pathsBetween(shownTreePaths(event.currentTarget), anchor, entry.path))
      return
    }
    store.clearPicked()
    open()
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'F2') {
      openDialog({ kind: 'rename', path: entry.path, name: entry.name })
    } else if (event.key === 'Delete') {
      openDialog({ kind: 'delete', path: entry.path, name: entry.name })
    } else if (event.key === 'Escape') {
      useFileTreeStore.getState().clearPicked()
    }
  }

  const menu = openMenu !== null && <PopupMenu x={openMenu.x} y={openMenu.y} items={openMenu.items} onClose={closeMenu} />

  if (!entry.isDirectory) {
    return (
      <>
        <button
          type="button"
          title={entry.name}
          className={cn('row', entry.path === selectedPath && 'row-selected', isPicked && 'row-picked')}
          data-path={entry.path}
          aria-pressed={isPicked || undefined}
          style={{ paddingLeft: indent + FILE_ICON_ALIGNMENT_PX }}
          onClick={(event) => clickRow(event, () => onOpenFile(entry.path))}
          draggable
          onDragStart={startDrag}
          onContextMenu={showMenu}
          onKeyDown={handleKeyDown}
        >
          <FileTypeIcon path={entry.path} />
          <span>{entry.name}</span>
        </button>
        {menu}
      </>
    )
  }

  const isOpen = isExpanded && entry.hasChildren

  return (
    <>
      <button
        type="button"
        title={entry.hasChildren ? entry.name : `${entry.name} (empty)`}
        className={cn('row', isPicked && 'row-picked')}
        data-path={entry.path}
        aria-pressed={isPicked || undefined}
        style={{ paddingLeft: entry.hasChildren ? indent : indent + FILE_ICON_ALIGNMENT_PX }}
        onClick={(event) => clickRow(event, () => setIsExpanded(!isOpen && entry.hasChildren))}
        draggable
        onDragStart={startDrag}
        onContextMenu={showMenu}
        onKeyDown={handleKeyDown}
      >
        {entry.hasChildren && <DisclosureChevron isOpen={isOpen} />}
        <FolderTypeIcon name={entry.name} isOpen={isOpen} />
        <span>{entry.name}</span>
      </button>
      {menu}
      {isOpen && (
        <FileTree directoryPath={entry.path} depth={depth + 1} selectedPath={selectedPath} onOpenFile={onOpenFile} />
      )}
    </>
  )
}

export function FileTree({ directoryPath, depth, selectedPath, onOpenFile }: FileTreeProps) {
  const [entries, setEntries] = useState<DirectoryEntry[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const refreshToken = useFileTreeStore((state) => state.refreshToken)

  useEffect(() => {
    setErrorMessage(null)
    window.api.files
      .list(directoryPath)
      .then((found) => setEntries((shown) => (isSameData(shown, found) ? shown : found)))
      .catch((error: unknown) => setErrorMessage(friendlyErrorMessage(error, 'Could not read this folder.')))
  }, [directoryPath, refreshToken])

  if (errorMessage !== null) {
    return <p className="panel-empty">{errorMessage}</p>
  }

  return (
    <>
      {entries.map((entry) => (
        <TreeEntry key={entry.path} entry={entry} depth={depth} selectedPath={selectedPath} onOpenFile={onOpenFile} />
      ))}
    </>
  )
}
