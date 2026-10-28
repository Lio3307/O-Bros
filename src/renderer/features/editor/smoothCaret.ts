import { EditorSelection, type Extension } from '@codemirror/state'
import { EditorView, layer, RectangleMarker, type LayerMarker } from '@codemirror/view'

const GLIDE = '90ms var(--ease-out)'
const TYPING_CLASS = 'cm-smoothCaret-typing'
const BLINK_NAMES = ['caret-blink', 'caret-blink2']

class SlidingMarker implements LayerMarker {
  constructor(
    readonly className: string,
    readonly left: number,
    readonly top: number,
    readonly width: number | null,
    readonly height: number
  ) {}

  eq(other: LayerMarker): boolean {
    return (
      other instanceof SlidingMarker &&
      other.className === this.className &&
      other.left === this.left &&
      other.top === this.top &&
      other.width === this.width &&
      other.height === this.height
    )
  }

  draw(): HTMLElement {
    const element = document.createElement('div')
    element.className = this.className
    this.place(element)
    return element
  }

  update(element: HTMLElement, previous: LayerMarker): boolean {
    if (!(previous instanceof SlidingMarker) || previous.className !== this.className) {
      return false
    }
    this.place(element)
    return true
  }

  private place(element: HTMLElement): void {
    element.style.transform = `translate(${this.left}px, ${this.top}px)`
    element.style.height = `${this.height}px`
    element.style.width = this.width === null ? '' : `${this.width}px`
  }
}

function mainCursorBox(view: EditorView): RectangleMarker | null {
  const main = view.state.selection.main
  return RectangleMarker.forRange(view, '', EditorSelection.cursor(main.head, main.assoc))[0] ?? null
}

function contentBox(view: EditorView): { left: number; width: number } {
  const content = view.contentDOM.getBoundingClientRect()
  const scroller = view.scrollDOM.getBoundingClientRect()
  return { left: content.left - scroller.left + view.scrollDOM.scrollLeft, width: content.width }
}

function needsRedraw(update: { docChanged: boolean; selectionSet: boolean; geometryChanged: boolean; viewportChanged: boolean }): boolean {
  return update.docChanged || update.selectionSet || update.geometryChanged || update.viewportChanged
}

const caretLayer = layer({
  above: true,
  class: 'cm-smoothCaretLayer',
  markers(view) {
    const box = mainCursorBox(view)
    return box === null ? [] : [new SlidingMarker('cm-smoothCaret', box.left, box.top, null, box.height)]
  },
  update(update, layerElement) {
    layerElement.classList.toggle(TYPING_CLASS, update.docChanged)
    if (update.selectionSet) {
      layerElement.style.animationName = layerElement.style.animationName === BLINK_NAMES[0] ? BLINK_NAMES[1] : BLINK_NAMES[0]
    }
    return needsRedraw(update)
  }
})

const lineLayer = layer({
  above: false,
  class: 'cm-activeLineLayer',
  markers(view) {
    const box = mainCursorBox(view)
    if (box === null) {
      return []
    }
    const content = contentBox(view)
    return [new SlidingMarker('cm-activeLineSlide', content.left, box.top, content.width, box.height)]
  },
  update(update, layerElement) {
    layerElement.classList.toggle(TYPING_CLASS, update.docChanged)
    return needsRedraw(update)
  }
})

export function smoothCaret(shapeStyle: Record<string, string>, blinks: boolean): Extension {
  return [
    lineLayer,
    caretLayer,
    EditorView.theme({
      '.cm-cursor-primary': { visibility: 'hidden' },
      '.cm-activeLine': { backgroundColor: 'transparent' },
      '.cm-smoothCaretLayer, .cm-activeLineLayer': { pointerEvents: 'none' },
      '.cm-smoothCaret, .cm-activeLineSlide': {
        position: 'absolute',
        top: '0',
        left: '0',
        transition: `transform ${GLIDE}, height ${GLIDE}, width ${GLIDE}`,
        willChange: 'transform'
      },
      '.cm-smoothCaret': { display: 'none', ...shapeStyle },
      '&.cm-focused .cm-smoothCaret': { display: 'block' },
      '.cm-activeLineSlide': { backgroundColor: 'color-mix(in srgb, var(--color-strong) 4%, transparent)' },
      [`.${TYPING_CLASS} .cm-smoothCaret, .${TYPING_CLASS} .cm-activeLineSlide`]: { transition: 'none' },
      '&.cm-focused > .cm-scroller > .cm-smoothCaretLayer': blinks ? { animation: `steps(1) ${BLINK_NAMES[0]} 1.2s infinite` } : {}
    })
  ]
}
