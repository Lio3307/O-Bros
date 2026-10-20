export function isSameData(first: unknown, second: unknown): boolean {
  return JSON.stringify(first) === JSON.stringify(second)
}
