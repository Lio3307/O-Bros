import {
  findReferencesKeymap,
  hoverTooltips,
  jumpToDefinitionKeymap,
  LSPClient,
  serverCompletion,
  signatureHelp,
  signatureKeymap
} from '@codemirror/lsp-client'
import { Compartment, type Extension } from '@codemirror/state'
import { keymap, type EditorView } from '@codemirror/view'
import { filePathToUri } from '../../../../shared/fileUri'
import { lspLanguageIdOf, type LanguageServerSession } from '../../../../shared/languageServers'
import { useLanguageServerStore } from '../../../state/languageServerStore'
import { forgetTransport, ipcTransport } from './ipcTransport'
import { ObrosWorkspace } from './obrosWorkspace'
import { sanitizeHtml } from './sanitizeHtml'
import { serverDiagnosticsBridge } from './serverDiagnosticsBridge'

const REQUEST_TIMEOUT_MS = 10_000

export const languageServerCompartment = new Compartment()

export interface PreparedServer {
  sessionId: string
  title: string
  extension: Extension
}

const clients = new Map<string, LSPClient>()
let isWatchingClosed = false

function watchClosedSessions(): void {
  if (isWatchingClosed) {
    return
  }
  isWatchingClosed = true
  window.api.lsp.onClosed((sessionId) => {
    clients.get(sessionId)?.disconnect()
    clients.delete(sessionId)
    forgetTransport(sessionId)
  })
}

function clientFor(session: LanguageServerSession): LSPClient {
  const known = clients.get(session.sessionId)
  if (known !== undefined) {
    return known
  }
  const client = new LSPClient({
    rootUri: session.rootUri,
    timeout: REQUEST_TIMEOUT_MS,
    sanitizeHTML: sanitizeHtml,
    workspace: (owner) => new ObrosWorkspace(owner),
    extensions: [
      serverCompletion(),
      hoverTooltips(),
      signatureHelp(),
      serverDiagnosticsBridge,
      keymap.of([...jumpToDefinitionKeymap, ...findReferencesKeymap, ...signatureKeymap])
    ]
  })
  client.connect(ipcTransport(session.sessionId))
  clients.set(session.sessionId, client)
  return client
}

export async function prepareLanguageServer(filePath: string, languageId: string): Promise<PreparedServer | null> {
  watchClosedSessions()
  const choices = useLanguageServerStore.getState().choices
  const session = await window.api.lsp.start({ filePath, languageId, choices }).catch(() => null)
  if (session === null) {
    return null
  }
  const extension = clientFor(session).plugin(filePathToUri(filePath), lspLanguageIdOf(filePath, languageId))
  return { sessionId: session.sessionId, title: session.serverTitle, extension }
}

export function attachLanguageServer(view: EditorView, prepared: PreparedServer): void {
  view.dispatch({ effects: languageServerCompartment.reconfigure(prepared.extension) })
}

export function detachLanguageServer(view: EditorView | null, prepared: PreparedServer): void {
  view?.dispatch({ effects: languageServerCompartment.reconfigure([]) })
  window.api.lsp.release(prepared.sessionId)
}
