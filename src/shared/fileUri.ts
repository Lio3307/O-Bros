const FILE_SCHEME = 'file://'

function isDriveSegment(segment: string): boolean {
  return segment.length === 2 && segment.charAt(1) === ':'
}

export function filePathToUri(path: string): string {
  const segments = path.split('\\').join('/').split('/')
  const encoded = segments.map((segment) => (isDriveSegment(segment) ? segment : encodeURIComponent(segment)))
  const joined = encoded.join('/')
  return FILE_SCHEME + (joined.startsWith('/') ? joined : '/' + joined)
}

export function fileUriToPath(uri: string): string | null {
  if (!uri.startsWith(FILE_SCHEME)) {
    return null
  }
  const segments = uri
    .slice(FILE_SCHEME.length)
    .split('/')
    .map((segment) => decodeURIComponent(segment))
  const hasDrive = segments.length > 1 && segments[0] === '' && isDriveSegment(segments[1])
  if (hasDrive) {
    return segments.slice(1).join('\\')
  }
  return segments.join('/')
}

export function sameFileUri(first: string, second: string): boolean {
  const firstPath = fileUriToPath(first)
  const secondPath = fileUriToPath(second)
  if (firstPath === null || secondPath === null) {
    return first === second
  }
  const isWindowsPath = firstPath.charAt(1) === ':'
  return isWindowsPath ? firstPath.toLowerCase() === secondPath.toLowerCase() : firstPath === secondPath
}
