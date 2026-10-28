import { Spinner } from './Spinner'
import { cn } from './cn'

export function LoadingText({ text, size = 14, isDelayed = false }: { text: string; size?: number; isDelayed?: boolean }) {
  return (
    <span className={cn('loading-text', isDelayed && 'loading-text-delayed')} role="status">
      <Spinner size={size} />
      {text}
    </span>
  )
}
