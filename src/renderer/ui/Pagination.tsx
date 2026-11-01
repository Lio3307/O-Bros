import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PageOf } from '../../shared/pagination'
import './pagination.css'

interface PaginationProps {
  current: PageOf<unknown>
  onChange: (page: number) => void
}

export function Pagination({ current, onChange }: PaginationProps) {
  const { page, pageCount, from, to, total } = current
  if (pageCount <= 1) {
    return null
  }

  return (
    <nav className="pagination" aria-label="Pages">
      <span className="muted">
        {from}–{to} of {total}
      </span>
      <span className="pagination-controls">
        <button type="button" className="icon-button" title="Previous page" aria-label="Previous page" disabled={page === 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft size={16} />
        </button>
        <span className="pagination-page">
          Page {page} of {pageCount}
        </span>
        <button type="button" className="icon-button" title="Next page" aria-label="Next page" disabled={page === pageCount} onClick={() => onChange(page + 1)}>
          <ChevronRight size={16} />
        </button>
      </span>
    </nav>
  )
}
