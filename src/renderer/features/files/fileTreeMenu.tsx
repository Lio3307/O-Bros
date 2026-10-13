import {
  ChevronsDownUp,
  Copy,
  ExternalLink,
  FilePlus,
  FolderPlus,
  Pencil,
  Search,
  SendToBack,
  SquareTerminal,
  Trash2
} from 'lucide-react'
import { lastPathSegment, parentPath } from '../../../shared/paths'
import { useFileDialogStore } from '../../state/fileDialogStore'
import { useFileTreeStore } from '../../state/fileTreeStore'
import type { PopupMenuItem } from '../../ui/PopupMenu'
import { sendPathToTerminal } from '../terminal/sendToTerminal'
import { copyPath, copyRelativePath, openFolderInTerminal, revealInFileExplorer } from './fileActions'

const ICON_SIZE = 14

export interface TreeTarget {
  path: string
  isDirectory: boolean
  isExpanded: boolean
}

function newEntryItems(folderPath: string): PopupMenuItem[] {
  const { open } = useFileDialogStore.getState()
  return [
    {
      label: 'New File',
      icon: <FilePlus size={ICON_SIZE} />,
      onSelect: () => open({ kind: 'create', entryKind: 'file', parentPath: folderPath })
    },
    {
      label: 'New Folder',
      icon: <FolderPlus size={ICON_SIZE} />,
      onSelect: () => open({ kind: 'create', entryKind: 'folder', parentPath: folderPath })
    }
  ]
}

export function buildRootMenuItems(rootPath: string): PopupMenuItem[] {
  return [
    ...newEntryItems(rootPath),
    {
      label: 'Open in Terminal',
      icon: <SquareTerminal size={ICON_SIZE} />,
      hasSeparatorBefore: true,
      onSelect: () => openFolderInTerminal(rootPath)
    },
    {
      label: 'Reveal in File Explorer',
      icon: <ExternalLink size={ICON_SIZE} />,
      onSelect: () => void revealInFileExplorer(rootPath)
    }
  ]
}

export function buildEntryMenuItems(target: TreeTarget): PopupMenuItem[] {
  const folderPath = target.isDirectory ? target.path : parentPath(target.path)
  const { open } = useFileDialogStore.getState()
  const { collapse, setSearchScope } = useFileTreeStore.getState()
  const name = lastPathSegment(target.path)

  const items: PopupMenuItem[] = [
    ...newEntryItems(folderPath),
    {
      label: 'Copy Path',
      icon: <Copy size={ICON_SIZE} />,
      hasSeparatorBefore: true,
      onSelect: () => void copyPath(target.path)
    },
    {
      label: 'Copy Relative Path',
      icon: <Copy size={ICON_SIZE} />,
      onSelect: () => void copyRelativePath(target.path)
    },
    {
      label: 'Open in Terminal',
      icon: <SquareTerminal size={ICON_SIZE} />,
      onSelect: () => openFolderInTerminal(folderPath)
    },
    {
      label: 'Send Path to Terminal',
      icon: <SendToBack size={ICON_SIZE} />,
      onSelect: () => sendPathToTerminal(target.path)
    }
  ]

  if (target.isDirectory && target.isExpanded) {
    items.push({
      label: 'Collapse Folder',
      icon: <ChevronsDownUp size={ICON_SIZE} />,
      onSelect: () => collapse(target.path)
    })
  }
  if (target.isDirectory) {
    items.push({
      label: 'Find in Folder',
      icon: <Search size={ICON_SIZE} />,
      onSelect: () => setSearchScope(target.path)
    })
  }

  items.push(
    {
      label: 'Reveal in File Explorer',
      icon: <ExternalLink size={ICON_SIZE} />,
      onSelect: () => void revealInFileExplorer(target.path)
    },
    {
      label: 'Rename',
      icon: <Pencil size={ICON_SIZE} />,
      hint: 'F2',
      hasSeparatorBefore: true,
      onSelect: () => open({ kind: 'rename', path: target.path, name })
    },
    {
      label: 'Delete',
      icon: <Trash2 size={ICON_SIZE} />,
      hint: 'Del',
      isDanger: true,
      onSelect: () => open({ kind: 'delete', path: target.path, name })
    }
  )
  return items
}
