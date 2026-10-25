import { ChevronRight } from 'lucide-react'
import { cn } from './cn'

export function DisclosureChevron({ isOpen, size = 14 }: { isOpen: boolean; size?: number }) {
  return <ChevronRight size={size} className={cn('disclosure-chevron', isOpen && 'disclosure-chevron-open')} aria-hidden="true" />
}
