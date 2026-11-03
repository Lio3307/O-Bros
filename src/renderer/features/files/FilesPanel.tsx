import { GitBranch, Search, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import { lastPathSegment } from '../../../shared/paths'
import { useFileTreeStore } from '../../state/fileTreeStore'
import { useGitMarksStore } from '../../state/gitMarksStore'
import type { GitStatus } from '../../../shared/types'
import { useProjectsStore } from '../../state/projectsStore'
import { useWorkspaceStore, type WorkspaceTab } from '../../state/workspaceStore'
import { FileTypeIcon } from '../../ui/FileTypeIcon'
import { PopupMenu, type PopupMenuItem } from '../../ui/PopupMenu'
import { useLiveRefresh } from '../../ui/useLiveRefresh'
import { FileTree } from './FileTree'
import { buildRootMenuItems } from './fileTreeMenu'
import { nextFilesRoot } from './filesRoot'
import { mergeSearchHits, type MergedHit } from './mergeSearchHits'
import './files.css'
import { Button } from '../../ui/Button'

const SEARCH_DEBOUNCE_MS = 200

interface OpenMenu {
  x: number
  y: number
  items: PopupMenuItem[]
}

function changeCountText(status: GitStatus): string {
  const count = new Set(status.changes.map((change) => change.path)).size
  return count === 0 ? 'no changes' : count === 1 ? '1 change' : `${count} changes`
}

function GitSummary({ status }: { status: GitStatus | null | undefined }) {
  if (status === undefined) {
    return null
  }
  if (status === null) {
    return (
      <span className="files-git files-git-none" title="This folder is not inside a git repository, so changes are not tracked.">
        No git
      </span>
    )
  }
  return (
    <span className="files-git" title={`Git repository at ${status.root}. Colored names show what changed since the last commit.`}>
      <GitBranch size={12} />
      <span className="files-git-branch">{status.branch === '' ? 'no branch' : status.branch}</span>
      <span className="files-git-count">· {changeCountText(status)}</span>
    </span>
  )
}

function useFilesRoot(activeTab: WorkspaceTab | undefined): string | null {
  const projectPath = useProjectsStore((state) => state.activeProjectPath)
  const [root, setRoot] = useState(() => nextFilesRoot(null, projectPath, activeTab))
  const next = nextFilesRoot(root, projectPath, activeTab)
  if (next !== root) {
    setRoot(next)
  }
  return next
}

export function FilesPanel() {
  const openFileTab = useWorkspaceStore((state) => state.openFileTab)
  const activeTab = useWorkspaceStore((state) => state.tabs.find((tab) => tab.id === state.activeTabId))
  const rootPath = useFilesRoot(activeTab)
  const searchScopePath = useFileTreeStore((state) => state.searchScopePath)
  const setSearchScope = useFileTreeStore((state) => state.setSearchScope)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<MergedHit[]>([])
  const [openMenu, setOpenMenu] = useState<OpenMenu | null>(null)
  const closeMenu = useCallback(() => setOpenMenu(null), [])
  const refreshTree = useFileTreeStore((state) => state.refresh)
  const gitStatus = useGitMarksStore((state) => (state.projectPath === rootPath ? state.status : undefined))
  const loadGitMarks = useGitMarksStore((state) => state.load)

  useEffect(() => {
    if (rootPath !== null) {
      void loadGitMarks(rootPath)
    }
  }, [rootPath, loadGitMarks])

  useLiveRefresh(
    useCallback(async () => {
      refreshTree()
      if (rootPath !== null) {
        await loadGitMarks(rootPath)
      }
    }, [refreshTree, loadGitMarks, rootPath])
  )

  const selectedPath = activeTab?.kind === 'file' ? activeTab.path : null
  const isSearching = query.trim().length > 0
  const searchRoot = searchScopePath ?? rootPath

  useEffect(() => {
    setSearchScope(null)
  }, [rootPath, setSearchScope])

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

  if (rootPath === null) {
    return (
      <aside className="files-panel">
        <p className="panel-empty">Open a folder in Projects to browse its files.</p>
      </aside>
    )
  }

  function showRootMenu(event: MouseEvent<HTMLDivElement>): void {
    if (event.target !== event.currentTarget || rootPath === null) {
      return
    }
    event.preventDefault()
    setOpenMenu({ x: event.clientX, y: event.clientY, items: buildRootMenuItems(rootPath) })
  }

  return (
    <aside className="files-panel">
      <header className="files-header">
        <span className="panel-title" title={rootPath}>
          {lastPathSegment(rootPath)}
        </span>
        <GitSummary status={gitStatus} />
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
              <FileTypeIcon path={hit.path} />
              <span>{hit.name}</span>
              {isContentOnly && <span className="muted search-tag">in text</span>}
            </button>
          ))
        ) : (
          <FileTree directoryPath={rootPath} depth={0} selectedPath={selectedPath} onOpenFile={openFileTab} />
        )}
      </div>
      {openMenu !== null && <PopupMenu x={openMenu.x} y={openMenu.y} items={openMenu.items} onClose={closeMenu} />}
    </aside>
  )
}
