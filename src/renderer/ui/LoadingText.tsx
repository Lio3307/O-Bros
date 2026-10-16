import { Spinner } from './Spinner'

export function LoadingText({ text, size = 14 }: { text: string; size?: number }) {
  return (
    <span className="loading-text" role="status">
      <Spinner size={size} />
      {text}
    </span>
  )
}
