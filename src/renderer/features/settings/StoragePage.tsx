import { RefreshCw } from 'lucide-react'
import { useEffect } from 'react'
import { formatBytes } from '../../../shared/format'
import { useRecentFilesStore } from '../../state/recentFilesStore'
import { useStorageStore } from '../../state/storageStore'
import { CleanupRow, pluralize } from './CleanupRow'
import { ConversationFolderSection } from './ConversationFolderSection'
import { DataLocationsSection } from './DataLocationsSection'
import { HardwareAccelerationSetting } from './HardwareAccelerationSetting'
import { SavedSessionsSection } from './SavedSessionsSection'
import { TeamStorageSection } from './TeamStorageSection'
import './settings.css'
import './settingsControls.css'
import { Button } from '../../ui/Button'
import { SettingsPageLayout } from '../../ui/SettingsPageLayout'

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
    <SettingsPageLayout
      title="Storage and memory"
      description={
        <>
          Everything listed here is safe to clear. It is rebuilt when needed, so the worst case is that something
          loads a little slower once.
        </>
      }
      actions={
        <>
          <Button variant="outline" onClick={() => refresh()}>
            <RefreshCw size={14} /> Measure again
          </Button>
          <Button variant="outline" onClick={() => clearEverything()}>
            Clear everything below
          </Button>
        </>
      }
    >
      <div className="table">
        <CleanupRow
          title="App cache"
          description="Files the app window keeps so it starts faster. A few small graphics caches are separate; the system rebuilds them and they are about 10 MB."
          amount={isMeasuring ? null : formatBytes(appCacheBytes)}
          buttonLabel="Clear"
          isDisabled={isMeasuring || appCacheBytes === 0}
          onClean={() => clearAppCache()}
        />
        <CleanupRow
          title="Leftover temporary files"
          description="Short-lived lint folders that a crash left in the system temp folder."
          amount={
            isMeasuring
              ? null
              : pluralize(leftoverTempFolders, 'folder', 'folders') + ', ' + formatBytes(leftoverTempBytes)
          }
          buttonLabel="Remove"
          isDisabled={isMeasuring || leftoverTempFolders === 0}
          onClean={() => clearLeftoverTemp()}
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

      <ConversationFolderSection />

      <TeamStorageSection />

      <HardwareAccelerationSetting />

      <DataLocationsSection />

      <section className="settings-section">
        <h2 className="settings-subtitle">What is never deleted here</h2>
        <p className="muted">
          Your project files, git history, agent logins, your project folders list, and your editor and
          terminal settings. Conversations are only deleted from the section above or the History panel, after you
          confirm.
        </p>
        <p className="muted">
          To keep memory low over time, lower the history kept per terminal in Settings, Terminal, and close terminals
          you no longer use. The Resource Manager shows what each one costs.
        </p>
      </section>
    </SettingsPageLayout>
  )
}
