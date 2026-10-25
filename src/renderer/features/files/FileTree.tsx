import { useCallback, useEffect, useState, type DragEvent, type KeyboardEvent, type MouseEvent } from 'react'
import { friendlyErrorMessage } from '../../../shared/friendlyError'
import type { DirectoryEntry } from '../../../shared/types'
import { useFileDialogStore } from '../../state/fileDialogStore'
import { useFileTreeStore } from '../../state/fileTreeStore'
import { DisclosureChevron } from '../../ui/DisclosureChevron'
import { FileTypeIcon, FolderTypeIcon } from '../../ui/FileTypeIcon'
import { PopupMenu, type PopupMenuItem } from '../../ui/PopupMenu'
import { DRAGGED_PATH_TYPE } from './dragData'
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

function TreeEntry({ entry, depth, selectedPath, onOpenFile }: TreeEntryProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [openMenu, setOpenMenu] = useState<OpenMenu | null>(null)
  const collapseRequest = useFileTreeStore((state) => state.collapseRequest)
  const openDialog = useFileDialogStore((state) => state.open)
  const closeMenu = useCallback(() => setOpenMenu(null), [])
  const indent = BASE_INDENT_PX + depth * INDENT_PER_LEVEL_PX

  useEffect(() => {
    if (collapseRequest !== null && collapseRequest.path === entry.path) {
      setIsExpanded(false)
    }
  }, [collapseRequest, entry.path])

  function showMenu(event: MouseEvent): void {
    event.preventDefault()
    const items = buildEntryMenuItems({ path: entry.path, isDirectory: entry.isDirectory, isExpanded })
    setOpenMenu({ x: event.clientX, y: event.clientY, items })
  }

  function startDrag(event: DragEvent): void {
    event.dataTransfer.setData(DRAGGED_PATH_TYPE, entry.path)
    event.dataTransfer.effectAllowed = 'copy'
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'F2') {
      openDialog({ kind: 'rename', path: entry.path, name: entry.name })
    } else if (event.key === 'Delete') {
      openDialog({ kind: 'delete', path: entry.path, name: entry.name })
    }
  }

  const menu = openMenu !== null && <PopupMenu x={openMenu.x} y={openMenu.y} items={openMenu.items} onClose={closeMenu} />

  if (!entry.isDirectory) {
    return (
      <>
        <button
          type="button"
          title={entry.name}
          className={entry.path === selectedPath ? 'row row-selected' : 'row'}
          style={{ paddingLeft: indent + FILE_ICON_ALIGNMENT_PX }}
          onClick={() => onOpenFile(entry.path)}
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

  return (
    <>
      <button
        type="button"
        title={entry.name}
        className="row"
        style={{ paddingLeft: indent }}
        onClick={() => setIsExpanded(!isExpanded)}
        draggable
        onDragStart={startDrag}
        onContextMenu={showMenu}
        onKeyDown={handleKeyDown}
      >
        <DisclosureChevron isOpen={isExpanded} />
        <FolderTypeIcon name={entry.name} isOpen={isExpanded} />
        <span>{entry.name}</span>
      </button>
      {menu}
      {isExpanded && (
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
