const VARIABLE_MARK = '%'
const WINDOWS_PATH_SEPARATOR = ';'

function variableValue(name: string, environment: Record<string, string | undefined>): string | undefined {
  const key = Object.keys(environment).find((candidate) => candidate.toLowerCase() === name.toLowerCase())
  return key === undefined ? undefined : environment[key]
}

export function expandWindowsVariables(text: string, environment: Record<string, string | undefined>): string {
  const parts = text.split(VARIABLE_MARK)
  if (parts.length < 3) {
    return text
  }
  let expanded = parts[0]
  let index = 1
  while (index < parts.length) {
    const name = parts[index]
    const isClosed = index + 1 < parts.length
    const value = isClosed && name !== '' ? variableValue(name, environment) : undefined
    if (value !== undefined) {
      expanded += value + parts[index + 1]
      index += 2
    } else {
      expanded += VARIABLE_MARK + name
      index += 1
    }
  }
  return expanded
}

function folderKey(folder: string): string {
  const trimmed = folder.trim().toLowerCase()
  return trimmed.endsWith('\\') ? trimmed.slice(0, -1) : trimmed
}

export function mergeWindowsPath(currentPath: string, extraPaths: string[]): string {
  const folders = currentPath.split(WINDOWS_PATH_SEPARATOR).filter((folder) => folder.trim() !== '')
  const known = new Set(folders.map(folderKey))
  for (const extraPath of extraPaths) {
    for (const folder of extraPath.split(WINDOWS_PATH_SEPARATOR)) {
      const key = folderKey(folder)
      if (key !== '' && !known.has(key)) {
        known.add(key)
        folders.push(folder.trim())
      }
    }
  }
  return folders.join(WINDOWS_PATH_SEPARATOR)
}
