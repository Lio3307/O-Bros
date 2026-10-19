import { useMemo } from 'react'
import type { DiffLayout } from '../../state/diffLayoutStore'
import { classifyDiffLine, parseDiffRows, splitDiffRows, type DiffCell, type DiffRow } from './diffLines'

const MARKERS: Record<DiffRow['kind'], string> = { added: '+', removed: '-', context: ' ', hunk: '' }

function LineNumber({ value }: { value: number | null }) {
  return <span className="diff-number">{value ?? ''}</span>
}

function UnifiedRows({ rows }: { rows: DiffRow[] }) {
  return (
    <>
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
    </>
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

function SplitRows({ rows }: { rows: DiffRow[] }) {
  const splitRows = useMemo(() => splitDiffRows(rows), [rows])
  return (
    <>
      <div className="diff-split-head">
        <span className="diff-split-title">
          Before <span className="diff-split-count diff-split-count-removed">−{countRows(rows, 'removed')}</span>
        </span>
        <span className="diff-split-title">
          After <span className="diff-split-count diff-split-count-added">+{countRows(rows, 'added')}</span>
        </span>
      </div>
      {splitRows.map((row, index) =>
        row.isHunk ? (
          <div key={index} className="diff-hunk">
            {row.hunkText}
          </div>
        ) : (
          <div key={index} className="diff-split-row">
            <SplitHalf cell={row.left} />
            <SplitHalf cell={row.right} />
          </div>
        )
      )}
    </>
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
  return <div className="diff-body">{layout === 'split' ? <SplitRows rows={rows} /> : <UnifiedRows rows={rows} />}</div>
}
