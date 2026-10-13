interface UsageBarProps {
  percentUsed: number | null
}

export function UsageBar({ percentUsed }: UsageBarProps) {
  const width = percentUsed === null ? 0 : Math.min(percentUsed, 100)
  return (
    <div className="usage-track">
      <div className="usage-fill" style={{ width: `${width}%` }} />
    </div>
  )
}
