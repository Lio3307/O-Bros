function normalizeSeparators(path: string): string {
  return path.split('\\').join('/')
}

export function lastPathSegment(path: string): string {
  const trimmed = comparablePath(path, false)
  const segment = trimmed.slice(trimmed.lastIndexOf('/') + 1)
  return segment === '' ? trimmed : segment
}

export function fileExtension(path: string): string {
  const name = lastPathSegment(path)
  const dotIndex = name.lastIndexOf('.')
  return dotIndex <= 0 ? '' : name.slice(dotIndex + 1).toLowerCase()
}

export function isPathInside(childPath: string, parentPath: string): boolean {
  const child = normalizeSeparators(childPath)
  const parent = normalizeSeparators(parentPath)
  return child === parent || child.startsWith(`${parent}/`)
}

export function comparablePath(path: string, ignoreCase: boolean): string {
  let normalized = normalizeSeparators(path)
  while (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1)
  }
  return ignoreCase ? normalized.toLowerCase() : normalized
}

export function parentPath(path: string): string {
  const normalized = normalizeSeparators(path)
  const lastSlash = normalized.lastIndexOf('/')
  return lastSlash <= 0 ? normalized : normalized.slice(0, lastSlash)
}

export function isAbsolutePath(path: string): boolean {
  return path.startsWith('/') || path.startsWith('\\') || path.charAt(1) === ':'
}

export function resolvePath(basePath: string, path: string): string {
  if (isAbsolutePath(path)) {
    return path
  }
  const separator = basePath.includes('\\') ? '\\' : '/'
  const segments = normalizeSeparators(basePath).split('/')
  for (const segment of normalizeSeparators(path).split('/')) {
    if (segment === '..' && segments.length > 1) {
      segments.pop()
    } else if (segment !== '' && segment !== '.' && segment !== '..') {
      segments.push(segment)
    }
  }
  return segments.join(separator)
}

export function relativePathFrom(path: string, rootPath: string): string {
  const normalizedPath = normalizeSeparators(path)
  const normalizedRoot = normalizeSeparators(rootPath)
  if (normalizedPath === normalizedRoot) {
    return ''
  }
  return normalizedPath.startsWith(`${normalizedRoot}/`) ? normalizedPath.slice(normalizedRoot.length + 1) : normalizedPath
}
