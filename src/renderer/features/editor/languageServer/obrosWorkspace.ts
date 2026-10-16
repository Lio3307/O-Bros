import { LSPPlugin, Workspace, type WorkspaceFile } from '@codemirror/lsp-client'
import type { Text } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'
import { fileUriToPath, sameFileUri } from '../../../../shared/fileUri'
import { useLayoutStore } from '../../../state/layoutStore'
import { useWorkspaceStore } from '../../../state/workspaceStore'

const OPEN_WAIT_MS = 5000
const OPEN_POLL_MS = 50

class OpenFile implements WorkspaceFile {
  constructor(
    public uri: string,
    public languageId: string,
    public version: number,
    public doc: Text,
    public view: EditorView
  ) {}

  getView(): EditorView {
    return this.view
  }
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export class ObrosWorkspace extends Workspace {
  files: OpenFile[] = []
  private versions = new Map<string, number>()

  private nextVersion(uri: string): number {
    const version = (this.versions.get(uri) ?? -1) + 1
    this.versions.set(uri, version)
    return version
  }

  getFile(uri: string): OpenFile | null {
    return this.files.find((file) => sameFileUri(file.uri, uri)) ?? null
  }

  syncFiles() {
    const updates = []
    for (const file of this.files) {
      const plugin = LSPPlugin.get(file.view)
      if (plugin === null || plugin.unsyncedChanges.empty) {
        continue
      }
      updates.push({ changes: plugin.unsyncedChanges, file, prevDoc: file.doc })
      file.doc = file.view.state.doc
      file.version = this.nextVersion(file.uri)
      plugin.clear()
    }
    return updates
  }

  openFile(uri: string, languageId: string, view: EditorView): void {
    const known = this.getFile(uri)
    if (known !== null) {
      known.view = view
      return
    }
    const file = new OpenFile(uri, languageId, this.nextVersion(uri), view.state.doc, view)
    this.files.push(file)
    this.client.didOpen(file)
  }

  closeFile(uri: string, view: EditorView): void {
    const file = this.getFile(uri)
    if (file === null || file.view !== view) {
      return
    }
    this.files = this.files.filter((candidate) => candidate !== file)
    this.client.didClose(file.uri)
  }

  async displayFile(uri: string): Promise<EditorView | null> {
    const open = this.getFile(uri)
    if (open !== null) {
      return open.view
    }
    const path = fileUriToPath(uri)
    if (path === null) {
      return null
    }
    useWorkspaceStore.getState().openFileTab(path)
    useLayoutStore.getState().showSection('projects')
    for (let waited = 0; waited < OPEN_WAIT_MS; waited += OPEN_POLL_MS) {
      await wait(OPEN_POLL_MS)
      const opened = this.getFile(uri)
      if (opened !== null) {
        return opened.view
      }
    }
    return null
  }
}
