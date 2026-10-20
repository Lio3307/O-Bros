import type { Diagnostic } from '@codemirror/lint'
import { LSPPlugin, type LSPClient, type LSPClientExtension } from '@codemirror/lsp-client'
import { ViewPlugin, type ViewUpdate } from '@codemirror/view'
import { fileUriToPath } from '../../../../shared/fileUri'
import { showServerDiagnostics } from '../diagnosticsBoard'

const SYNC_DELAY_MS = 500
const SEVERITIES: Diagnostic['severity'][] = ['error', 'error', 'warning', 'info', 'hint']

interface ServerDiagnostic {
  range: { start: { line: number; character: number }; end: { line: number; character: number } }
  severity?: number
  message: string
  source?: string
}

interface PublishDiagnosticsParams {
  uri: string
  version?: number
  diagnostics: ServerDiagnostic[]
}

const syncAfterTyping = ViewPlugin.fromClass(
  class {
    private timer: ReturnType<typeof setTimeout> | null = null

    update(update: ViewUpdate): void {
      if (!update.docChanged) {
        return
      }
      if (this.timer !== null) {
        clearTimeout(this.timer)
      }
      this.timer = setTimeout(() => {
        this.timer = null
        LSPPlugin.get(update.view)?.client.sync()
      }, SYNC_DELAY_MS)
    }

    destroy(): void {
      if (this.timer !== null) {
        clearTimeout(this.timer)
      }
    }
  }
)

function handlePublish(client: LSPClient, params: PublishDiagnosticsParams): boolean {
  const file = client.workspace.getFile(params.uri)
  if (file === null || (params.version !== undefined && params.version !== null && params.version !== file.version)) {
    return false
  }
  const view = file.getView()
  const plugin = view === null ? null : LSPPlugin.get(view)
  const filePath = fileUriToPath(file.uri)
  if (view === null || plugin === null || filePath === null) {
    return false
  }
  const toOffset = (position: ServerDiagnostic['range']['start']) =>
    plugin.unsyncedChanges.mapPos(plugin.fromPosition(position, plugin.syncedDoc))
  showServerDiagnostics(
    view,
    filePath,
    params.diagnostics.map((item) => ({
      from: toOffset(item.range.start),
      to: toOffset(item.range.end),
      severity: SEVERITIES[item.severity ?? 1] ?? 'error',
      message: item.message,
      source: item.source
    }))
  )
  return true
}

export const serverDiagnosticsBridge: LSPClientExtension = {
  clientCapabilities: { textDocument: { publishDiagnostics: { versionSupport: true } } },
  notificationHandlers: {
    'textDocument/publishDiagnostics': (client, params: PublishDiagnosticsParams) => handlePublish(client, params)
  },
  editorExtension: syncAfterTyping
}
