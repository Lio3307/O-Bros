import type { IconifyJSON } from '@iconify/types'

const DEFAULT_ICON_SIZE = 16

let iconSet: IconifyJSON | null = null
let loading: Promise<void> | null = null
const listeners = new Set<() => void>()
const urlByName = new Map<string, string | null>()

function bodyOf(set: IconifyJSON, name: string): string | null {
  const icon = set.icons[name] ?? set.icons[set.aliases?.[name]?.parent ?? '']
  return icon?.body ?? null
}

export function loadFileIcons(): void {
  loading ??= import('@iconify-json/catppuccin').then(
    ({ icons }) => {
      iconSet = icons
      listeners.forEach((listener) => listener())
    },
    () => {
      loading = null
    }
  )
}

export function subscribeToFileIcons(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function areFileIconsLoaded(): boolean {
  return iconSet !== null
}

export function hasFileIcon(name: string): boolean {
  return iconSet !== null && bodyOf(iconSet, name) !== null
}

export function fileIconUrl(name: string): string | null {
  if (iconSet === null) {
    return null
  }
  const cached = urlByName.get(name)
  if (cached !== undefined) {
    return cached
  }
  const body = bodyOf(iconSet, name)
  const size = iconSet.width ?? DEFAULT_ICON_SIZE
  const url =
    body === null
      ? null
      : `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${iconSet.height ?? size}">${body}</svg>`)}`
  urlByName.set(name, url)
  return url
}
