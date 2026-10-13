const BYTES_PER_UNIT = 1024
const UNITS = ['B', 'KB', 'MB', 'GB', 'TB']

export function formatBytes(bytes: number): string {
  let value = Math.max(bytes, 0)
  let unitIndex = 0
  while (value >= BYTES_PER_UNIT && unitIndex < UNITS.length - 1) {
    value /= BYTES_PER_UNIT
    unitIndex += 1
  }
  const isWholeNumber = unitIndex === 0
  const digits = unitIndex >= 3 ? 2 : 1
  return `${isWholeNumber ? Math.round(value) : value.toFixed(digits)} ${UNITS[unitIndex]}`
}

export function formatPercent(percent: number): string {
  return `${Math.max(percent, 0).toFixed(1)}%`
}
