import { Search, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import { lastPathSegment } from '../../../shared/paths'
import { useFileTreeStore } from '../../state/fileTreeStore'
import { useProjectsStore } from '../../state/projectsStore'
import { useWorkspaceStore } from '../../state/workspaceStore'
import { PopupMenu, type PopupMenuItem } from '../../ui/PopupMenu'
import { FileTree } from './FileTree'
import { buildRootMenuItems } from './fileTreeMenu'
import { mergeSearchHits, type MergedHit } from './mergeSearchHits'
import './files.css'
import { Button } from '../../ui/Button'

const SEARCH_DEBOUNCE_MS = 200

interface OpenMenu {
  x: number
  y: number
  items: PopupMenuItem[]
}

export function FilesPanel() {
  const activeProjectPath = useProjectsStore((state) => state.activeProjectPath)
  const openFileTab = useWorkspaceStore((state) => state.openFileTab)
  const activeTab = useWorkspaceStore((state) => state.tabs.find((tab) => tab.id === state.activeTabId))
  const searchScopePath = useFileTreeStore((state) => state.searchScopePath)
  const setSearchScope = useFileTreeStore((state) => state.setSearchScope)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<MergedHit[]>([])
  const [openMenu, setOpenMenu] = useState<OpenMenu | null>(null)
  const closeMenu = useCallback(() => setOpenMenu(null), [])

  const selectedPath = activeTab?.kind === 'file' ? activeTab.path : null
  const isSearching = query.trim().length > 0
  const searchRoot = searchScopePath ?? activeProjectPath

  useEffect(() => {
    setSearchScope(null)
  }, [activeProjectPath, setSearchScope])

  useEffect(() => {
    if (searchScopePath !== null) {
      searchInputRef.current?.focus()
    }
  }, [searchScopePath])

  useEffect(() => {
    if (searchRoot === null || !isSearching) {
      setHits([])
      return
    }
    const timer = setTimeout(() => {
      const request = { root: searchRoot, query: query.trim() }
      Promise.all([
        window.api.files.search({ ...request, mode: 'names' }),
        window.api.files.search({ ...request, mode: 'contents' })
      ])
        .then(([nameHits, contentHits]) => setHits(mergeSearchHits(nameHits, contentHits)))
        .catch(() => setHits([]))
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchRoot, query, isSearching])

  if (activeProjectPath === null) {
    return (
      <aside className="files-panel">
        <p className="panel-empty">Open a folder in Projects to browse its files.</p>
      </aside>
    )
  }

  function showRootMenu(event: MouseEvent<HTMLDivElement>): void {
    if (event.target !== event.currentTarget || activeProjectPath === null) {
      return
    }
    event.preventDefault()
    setOpenMenu({ x: event.clientX, y: event.clientY, items: buildRootMenuItems(activeProjectPath) })
  }

  return (
    <aside className="files-panel">
      <header className="files-header">
        <span className="panel-title">{lastPathSegment(activeProjectPath)}</span>
      </header>
      <label className="find-field">
        <Search size={14} />
        <input
          ref={searchInputRef}
          placeholder="Find by name or text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {searchScopePath !== null && (
        <div className="search-scope">
          <span className="muted search-scope-text">In {lastPathSegment(searchScopePath)}</span>
          <Button variant="icon" title="Search the whole project" onClick={() => setSearchScope(null)}>
            <X size={14} />
          </Button>
        </div>
      )}
      <div className="files-tree" onContextMenu={showRootMenu}>
        {isSearching ? (
          hits.map(({ hit, isContentOnly }) => (
            <button key={hit.path} type="button" title={hit.path} className="row" onClick={() => openFileTab(hit.path)}>
              <span>{hit.name}</span>
              {isContentOnly && <span className="muted search-tag">in text</span>}
            </button>
          ))
        ) : (
          <FileTree directoryPath={activeProjectPath} depth={0} selectedPath={selectedPath} onOpenFile={openFileTab} />
        )}
      </div>
      {openMenu !== null && <PopupMenu x={openMenu.x} y={openMenu.y} items={openMenu.items} onClose={closeMenu} />}
    </aside>
  )
}
