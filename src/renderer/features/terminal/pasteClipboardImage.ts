import type { Terminal } from '@xterm/xterm'
import { quotePathForShell } from '../../../shared/shellQuote'
import { toast } from '../../state/toastStore'

export async function pasteClipboardImage(terminal: Terminal): Promise<void> {
  try {
    const path = await window.api.files.saveClipboardImage()
    if (path !== null) {
      terminal.paste(`${quotePathForShell(path)} `)
    }
  } catch {
    toast.warning('Could not paste the image from the clipboard.')
  }
  terminal.focus()
}
