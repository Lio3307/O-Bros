import type { ILink, ILinkProvider, Terminal } from '@xterm/xterm'
import { findFileReferences, type FileReference } from '../../../shared/fileReference'

export function createFileLinkProvider(
  terminal: Terminal,
  onOpen: (reference: FileReference) => void
): ILinkProvider {
  return {
    provideLinks(bufferLineNumber, callback) {
      const lineText = terminal.buffer.active.getLine(bufferLineNumber - 1)?.translateToString(true) ?? ''
      const links: ILink[] = findFileReferences(lineText).map((reference) => ({
        text: lineText.slice(reference.start, reference.end),
        range: {
          start: { x: reference.start + 1, y: bufferLineNumber },
          end: { x: reference.end, y: bufferLineNumber }
        },
        activate: (event) => {
          if (event.ctrlKey || event.metaKey) {
            onOpen(reference)
          }
        }
      }))
      callback(links.length > 0 ? links : undefined)
    }
  }
}
