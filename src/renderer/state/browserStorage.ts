export function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function readStoredJson(key: string): unknown {
  const saved = readStored(key)
  if (saved === null) {
    return null
  }
  try {
    return JSON.parse(saved) as unknown
  } catch {
    return null
  }
}

export function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    return
  }
}

export function writeStoredJson(key: string, value: unknown): void {
  writeStored(key, JSON.stringify(value))
}
