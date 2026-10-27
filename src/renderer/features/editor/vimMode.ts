import { Compartment, type Extension } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'
import { Vim, vim } from '@replit/codemirror-vim'
import { toast } from '../../state/toastStore'

export interface VimFileActions {
  save: () => Promise<void>
  close: () => void
  hasUnsavedChanges: () => boolean
}

interface VimEditor {
  cm6: EditorView
}

interface VimCommandParams {
  argString?: string
}

const FORCE = '!'
const UNSAVED_MESSAGE = 'This file has unsaved changes. Use :w to save, :wq to save and close, or :q! to close without saving.'

export const vimCompartment = new Compartment()

const actionsByView = new WeakMap<EditorView, VimFileActions>()
let hasFileCommands = false

function withActions(editor: VimEditor, run: (actions: VimFileActions) => void | Promise<void>): void {
  const actions = actionsByView.get(editor.cm6)
  if (actions !== undefined) {
    void run(actions)
  }
}

async function saveAndClose(actions: VimFileActions): Promise<void> {
  await actions.save()
  if (!actions.hasUnsavedChanges()) {
    actions.close()
  }
}

function defineFileCommands(): void {
  if (hasFileCommands) {
    return
  }
  hasFileCommands = true
  Vim.defineEx('write', 'w', (editor: VimEditor) => withActions(editor, (actions) => actions.save()))
  Vim.defineEx('quit', 'q', (editor: VimEditor, params: VimCommandParams) =>
    withActions(editor, (actions) => {
      if (params.argString?.trim() !== FORCE && actions.hasUnsavedChanges()) {
        toast.warning(UNSAVED_MESSAGE)
        return
      }
      actions.close()
    })
  )
  Vim.defineEx('wq', 'wq', (editor: VimEditor) => withActions(editor, saveAndClose))
  Vim.defineEx('xit', 'x', (editor: VimEditor) => withActions(editor, saveAndClose))
}

export function vimExtension(isEnabled: boolean): Extension {
  if (!isEnabled) {
    return []
  }
  defineFileCommands()
  return vim({ status: true })
}

export function connectVimFileActions(view: EditorView, actions: VimFileActions): void {
  actionsByView.set(view, actions)
}
