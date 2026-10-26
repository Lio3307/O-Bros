import { useEffect, useSyncExternalStore } from 'react'
import { lastPathSegment } from '../../shared/paths'
import { fileIconName, folderIconName } from './fileIconNames'
import { areFileIconsLoaded, fileIconUrl, hasFileIcon, loadFileIcons, subscribeToFileIcons } from './fileIconSet'
import './fileTypeIcon.css'

function useFileIcons(): boolean {
  useEffect(() => loadFileIcons(), [])
  return useSyncExternalStore(subscribeToFileIcons, areFileIconsLoaded)
}

function IconImage({ url, size }: { url: string | null; size: number }) {
  if (url === null) {
    return <span className="file-type-icon" style={{ width: size, height: size }} aria-hidden="true" />
  }
  return <img className="file-type-icon file-type-icon-ready" src={url} alt="" width={size} height={size} draggable={false} />
}

export function FileTypeIcon({ path, size = 14 }: { path: string; size?: number }) {
  const isLoaded = useFileIcons()
  return <IconImage url={isLoaded ? fileIconUrl(fileIconName(lastPathSegment(path), hasFileIcon)) : null} size={size} />
}

export function NamedFileIcon({ name, size = 14 }: { name: string; size?: number }) {
  const isLoaded = useFileIcons()
  return <IconImage url={isLoaded ? fileIconUrl(name) : null} size={size} />
}

export function FolderTypeIcon({ name, isOpen, size = 14 }: { name: string; isOpen: boolean; size?: number }) {
  const isLoaded = useFileIcons()
  return <IconImage url={isLoaded ? fileIconUrl(folderIconName(name, isOpen, hasFileIcon)) : null} size={size} />
}
