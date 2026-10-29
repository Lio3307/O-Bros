import { EditorView, ViewPlugin, type ViewUpdate } from '@codemirror/view'
import type { Extension } from '@codemirror/state'
import { trailOutline, type Box } from './trailOutline'

const TRAIL_MS = 180
const LINE_WIDTH_PX = 2
const SHORTEST_TRAIL_PX = 4

function caretBox(view: EditorView, isWide: boolean): Box | null {
  const main = view.state.selection.main
  const coords = view.coordsAtPos(main.head, main.assoc < 0 ? -1 : 1)
  if (coords === null) {
    return null
  }
  const scroller = view.scrollDOM.getBoundingClientRect()
  return {
    left: coords.left - scroller.left + view.scrollDOM.scrollLeft,
    top: coords.top - scroller.top + view.scrollDOM.scrollTop,
    width: isWide ? view.defaultCharacterWidth : LINE_WIDTH_PX,
    height: coords.bottom - coords.top
  }
}

function isFar(from: Box, to: Box): boolean {
  return Math.abs(from.left - to.left) + Math.abs(from.top - to.top) >= SHORTEST_TRAIL_PX
}

function drawTrail(view: EditorView, from: Box, to: Box): void {
  const outline = trailOutline(from, to)
  const left = Math.min(...outline.map((point) => point[0]))
  const top = Math.min(...outline.map((point) => point[1]))
  const element = document.createElement('div')
  element.className = 'cm-caretTrail'
  element.style.transform = `translate(${left}px, ${top}px)`
  element.style.width = `${Math.max(...outline.map((point) => point[0])) - left}px`
  element.style.height = `${Math.max(...outline.map((point) => point[1])) - top}px`
  element.style.clipPath = `polygon(${outline.map((point) => `${point[0] - left}px ${point[1] - top}px`).join(', ')})`
  view.scrollDOM.append(element)
  setTimeout(() => element.remove(), TRAIL_MS)
}

function trailPlugin(isWide: boolean) {
  return ViewPlugin.fromClass(
    class {
      private lastBox: Box | null = null

      constructor(view: EditorView) {
        this.follow(view, false)
      }

      update(update: ViewUpdate): void {
        if (update.selectionSet || update.docChanged || update.geometryChanged) {
          this.follow(update.view, update.selectionSet && !update.docChanged && update.view.hasFocus)
        }
      }

      private follow(view: EditorView, leavesTrail: boolean): void {
        view.requestMeasure({
          read: () => caretBox(view, isWide),
          write: (box) => {
            if (leavesTrail && box !== null && this.lastBox !== null && isFar(this.lastBox, box)) {
              drawTrail(view, this.lastBox, box)
            }
            this.lastBox = box
          }
        })
      }
    }
  )
}

export function caretTrail(isWide: boolean): Extension {
  return [
    trailPlugin(isWide),
    EditorView.theme({
      '.cm-caretTrail': {
        position: 'absolute',
        top: '0',
        left: '0',
        pointerEvents: 'none',
        zIndex: '150',
        backgroundColor: 'var(--caret-color)',
        animation: `caret-trail-fade ${TRAIL_MS}ms var(--ease-out) forwards`
      }
    })
  ]
}
