import { useMemo, useRef, type RefObject } from 'react'
import type { DiffLayout } from '../../state/diffLayoutStore'
import { classifyDiffLine, parseDiffRows, splitDiffRows, type DiffCell, type DiffRow, type SplitDiffRow } from './diffLines'

const MARKERS: Record<DiffRow['kind'], string> = { added: '+', removed: '-', context: ' ', hunk: '' }

function LineNumber({ value }: { value: number | null }) {
  return <span className="diff-number">{value ?? ''}</span>
}

function UnifiedRows({ rows }: { rows: DiffRow[] }) {
  return (
    <div className="diff-lines">
      {rows.map((row, index) =>
        row.kind === 'hunk' ? (
          <div key={index} className="diff-hunk">
            {row.text}
          </div>
        ) : (
          <div key={index} className={`diff-row diff-cell-${row.kind}`}>
            <LineNumber value={row.oldNumber} />
            <LineNumber value={row.newNumber} />
            <span className="diff-marker">{MARKERS[row.kind]}</span>
            <span className="diff-text">{row.text}</span>
          </div>
        )
      )}
    </div>
  )
}

function SplitHalf({ cell }: { cell: DiffCell | null }) {
  if (cell === null) {
    return <div className="diff-half diff-half-empty" />
  }
  return (
    <div className={`diff-half diff-cell-${cell.kind}`}>
      <LineNumber value={cell.number} />
      <span className="diff-marker">{MARKERS[cell.kind]}</span>
      <span className="diff-text">{cell.text}</span>
    </div>
  )
}

function countRows(rows: DiffRow[], kind: DiffRow['kind']): number {
  return rows.filter((row) => row.kind === kind).length
}

function SplitColumn({
  rows,
  side,
  columnRef,
  onScroll
}: {
  rows: SplitDiffRow[]
  side: 'left' | 'right'
  columnRef: RefObject<HTMLDivElement | null>
  onScroll: () => void
}) {
  return (
    <div className="diff-split-column" ref={columnRef} onScroll={onScroll}>
      <div className="diff-lines">
        {rows.map((row, index) =>
          row.isHunk ? (
            <div key={index} className="diff-hunk">
              {side === 'left' ? row.hunkText : ''}
            </div>
          ) : (
            <SplitHalf key={index} cell={side === 'left' ? row.left : row.right} />
          )
        )}
      </div>
    </div>
  )
}

function followScroll(source: HTMLDivElement | null, target: HTMLDivElement | null): void {
  if (source !== null && target !== null && target.scrollTop !== source.scrollTop) {
    target.scrollTop = source.scrollTop
  }
}

function SplitRows({ rows }: { rows: DiffRow[] }) {
  const splitRows = useMemo(() => splitDiffRows(rows), [rows])
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  return (
    <div className="diff-split">
      <div className="diff-split-head">
        <span className="diff-split-title">
          Before <span className="diff-split-count diff-split-count-removed">−{countRows(rows, 'removed')}</span>
        </span>
        <span className="diff-split-title">
          After <span className="diff-split-count diff-split-count-added">+{countRows(rows, 'added')}</span>
        </span>
      </div>
      <div className="diff-split-columns">
        <SplitColumn
          rows={splitRows}
          side="left"
          columnRef={leftRef}
          onScroll={() => followScroll(leftRef.current, rightRef.current)}
        />
        <SplitColumn
          rows={splitRows}
          side="right"
          columnRef={rightRef}
          onScroll={() => followScroll(rightRef.current, leftRef.current)}
        />
      </div>
    </div>
  )
}

function RawLines({ diffText }: { diffText: string }) {
  return (
    <>
      {diffText.split('\n').map((line, index) => (
        <div key={index} className={`diff-line diff-line-${classifyDiffLine(line)}`}>
          {line}
        </div>
      ))}
    </>
  )
}

export function DiffBody({ diffText, layout }: { diffText: string; layout: DiffLayout }) {
  const rows = useMemo(() => parseDiffRows(diffText), [diffText])
  if (rows.length === 0) {
    return (
      <div className="diff-body">
        <RawLines diffText={diffText} />
      </div>
    )
  }
  if (layout === 'split') {
    return <SplitRows rows={rows} />
  }
  return (
    <div className="diff-body">
      <UnifiedRows rows={rows} />
    </div>
  )
}
