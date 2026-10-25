import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { isPathInside, lastPathSegment, relativePathFrom } from '../../../shared/paths'
import type { SearchHit } from '../../../shared/types'
import { useLayoutStore } from '../../state/layoutStore'
import { useProjectsStore } from '../../state/projectsStore'
import { useRecentFilesStore } from '../../state/recentFilesStore'
import { useWorkspaceStore } from '../../state/workspaceStore'
import { FileTypeIcon } from '../../ui/FileTypeIcon'
import { handlePickerKey } from './pickerKeys'
import './quickOpen.css'

const SEARCH_DEBOUNCE_MS = 120

export function QuickOpen() {
  const rootPath = useProjectsStore((state) => state.activeProjectPath)
  const closeQuickOpen = useLayoutStore((state) => state.closeQuickOpen)
  const openFileTab = useWorkspaceStore((state) => state.openFileTab)
  const showSection = useLayoutStore((state) => state.showSection)
  const recentPaths = useRecentFilesStore((state) => state.paths)

  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [foundHits, setFoundHits] = useState<SearchHit[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  const isQueryEmpty = query.trim() === ''

  const recentHits = useMemo<SearchHit[]>(() => {
    if (rootPath === null) {
      return []
    }
    return recentPaths
      .filter((path) => isPathInside(path, rootPath))
      .map((path) => ({ name: lastPathSegment(path), path }))
  }, [recentPaths, rootPath])

  const hits = isQueryEmpty ? recentHits : foundHits

  useEffect(() => inputRef.current?.focus(), [])

  useEffect(() => {
    setSelectedIndex(0)
    const trimmedQuery = query.trim()
    if (rootPath === null || trimmedQuery === '') {
      setFoundHits([])
      return
    }
    let isCurrent = true
    const timer = setTimeout(() => {
      window.api.files
        .search({ root: rootPath, query: trimmedQuery, mode: 'names' })
        .then((found) => {
          if (isCurrent) {
            setFoundHits(found)
          }
        })
        .catch(() => undefined)
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      isCurrent = false
      clearTimeout(timer)
    }
  }, [query, rootPath])

  function openHit(hit: SearchHit): void {
    openFileTab(hit.path)
    showSection('projects')
    closeQuickOpen()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    handlePickerKey(event, { items: hits, selectedIndex, setSelectedIndex, onClose: closeQuickOpen, onPick: openHit })
  }

  return (
    <div className="quick-open-backdrop" onMouseDown={closeQuickOpen}>
      <div className="quick-open" onMouseDown={(event) => event.stopPropagation()}>
        <input
          ref={inputRef}
          placeholder={rootPath === null ? 'Open a project folder first' : 'Go to file by name'}
          value={query}
          disabled={rootPath === null}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="quick-open-results">
          {isQueryEmpty && hits.length > 0 && <h3 className="section-label quick-open-label">Recently opened</h3>}
          {hits.map((hit, index) => (
            <button
              key={hit.path}
              type="button"
              className={index === selectedIndex ? 'quick-open-row quick-open-row-selected' : 'quick-open-row'}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => openHit(hit)}
            >
              <FileTypeIcon path={hit.path} size={16} />
              <span className="quick-open-name">{hit.name}</span>
              <span className="quick-open-path">{rootPath === null ? hit.path : relativePathFrom(hit.path, rootPath)}</span>
            </button>
          ))}
          {!isQueryEmpty && hits.length === 0 && <p className="panel-empty">No files match.</p>}
          {isQueryEmpty && hits.length === 0 && <p className="panel-empty">Type to search. Files you open show up here.</p>}
        </div>
      </div>
    </div>
  )
}
