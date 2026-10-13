import { RefreshCw } from 'lucide-react'
import { useEffect } from 'react'
import { formatBytes } from '../../../shared/format'
import { useRecentFilesStore } from '../../state/recentFilesStore'
import { useStorageStore } from '../../state/storageStore'
import { CleanupRow, pluralize } from './CleanupRow'
import { SavedSessionsSection } from './SavedSessionsSection'
import './settings.css'
import './settingsControls.css'

export function StoragePage() {
  const report = useStorageStore((state) => state.report)
  const terminalMemory = useStorageStore((state) => state.terminalMemory)
  const refresh = useStorageStore((state) => state.refresh)
  const clearAppCache = useStorageStore((state) => state.clearAppCache)
  const clearLeftoverTemp = useStorageStore((state) => state.clearLeftoverTemp)
  const clearTerminalScrollback = useStorageStore((state) => state.clearTerminalScrollback)
  const clearRecentFiles = useStorageStore((state) => state.clearRecentFiles)
  const clearEverything = useStorageStore((state) => state.clearEverything)
  const recentFileCount = useRecentFilesStore((state) => state.paths.length)

  useEffect(() => {
    void refresh()
  }, [refresh])

  const isMeasuring = report === null
  const appCacheBytes = report?.appCacheBytes ?? 0
  const leftoverTempFolders = report?.leftoverTempFolders ?? 0
  const leftoverTempBytes = report?.leftoverTempBytes ?? 0

  return (
    <div className="settings-page">
      <header className="settings-header">
        <div>
          <h1 className="settings-title">Storage and memory</h1>
          <p className="muted">
            Everything listed here is safe to clear. It is rebuilt when needed, so the worst case is that something
            loads a little slower once.
          </p>
        </div>
        <div className="settings-header-actions">
          <button type="button" className="button-outline" onClick={() => void refresh()}>
            <RefreshCw size={14} /> Measure again
          </button>
          <button type="button" className="button-outline" onClick={() => void clearEverything()}>
            Clear everything below
          </button>
        </div>
      </header>

      <div className="table">
        <CleanupRow
          title="App cache"
          description="Files the app window keeps so it starts faster."
          amount={isMeasuring ? 'Measuring' : formatBytes(appCacheBytes)}
          buttonLabel="Clear"
          isDisabled={isMeasuring || appCacheBytes === 0}
          onClean={() => void clearAppCache()}
        />
        <CleanupRow
          title="Leftover temporary files"
          description="Short-lived lint folders that a crash left in the system temp folder."
          amount={
            isMeasuring
              ? 'Measuring'
              : pluralize(leftoverTempFolders, 'folder', 'folders') + ', ' + formatBytes(leftoverTempBytes)
          }
          buttonLabel="Remove"
          isDisabled={isMeasuring || leftoverTempFolders === 0}
          onClean={() => void clearLeftoverTemp()}
        />
        <CleanupRow
          title="Terminal history in memory"
          description="Scrolled-off lines every open terminal keeps. Running programs and visible text are not touched."
          amount={
            terminalMemory.bufferedLines.toLocaleString() +
            ' lines in ' +
            pluralize(terminalMemory.terminalCount, 'terminal', 'terminals')
          }
          buttonLabel="Clear"
          isDisabled={terminalMemory.terminalCount === 0}
          onClean={clearTerminalScrollback}
        />
        <CleanupRow
          title="Recent files list"
          description="The names Quick open shows when its search box is empty."
          amount={pluralize(recentFileCount, 'file', 'files')}
          buttonLabel="Clear"
          isDisabled={recentFileCount === 0}
          onClean={clearRecentFiles}
        />
      </div>

      <SavedSessionsSection />

      <section className="settings-section">
        <h2 className="settings-subtitle">What is never deleted here</h2>
        <p className="muted">
          Your project files, git history, Claude and Codex logins, your project folders list, and your editor and
          terminal settings. Conversations are only deleted from the section above or the History panel, after you
          confirm.
        </p>
        <p className="muted">
          To keep memory low over time, lower the history kept per terminal in Settings, Terminal, and close terminals
          you no longer use. The Resource Manager shows what each one costs.
        </p>
      </section>
    </div>
  )
}
