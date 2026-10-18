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
  const isRootWithSlash = parent.endsWith('/')
  const folderPrefix = isRootWithSlash ? parent : `${parent}/`
  const parentWithoutSlash = isRootWithSlash ? parent.slice(0, -1) : parent
  return child === parent || child === parentWithoutSlash || child.startsWith(folderPrefix)
}

export function comparablePath(path: string, ignoreCase: boolean): string {
  let normalized = normalizeSeparators(path)
  while (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1)
  }
  return ignoreCase ? normalized.toLowerCase() : normalized
}

function isDriveSegment(segment: string): boolean {
  return segment.length === 2 && segment.charAt(1) === ':'
}

export function parentPath(path: string): string {
  const normalized = normalizeSeparators(path)
  const lastSlash = normalized.lastIndexOf('/')
  if (lastSlash <= 0) {
    return normalized
  }
  const parent = normalized.slice(0, lastSlash)
  return isDriveSegment(parent) ? `${parent}/` : parent
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
  const root = normalizedRoot.endsWith('/') ? normalizedRoot.slice(0, -1) : normalizedRoot
  if (normalizedPath === normalizedRoot || normalizedPath === root) {
    return ''
  }
  return normalizedPath.startsWith(`${root}/`) ? normalizedPath.slice(root.length + 1) : normalizedPath
}
