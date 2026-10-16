import { lazy, type ComponentType } from 'react'

export function lazyComponent<Props extends object>(load: () => Promise<ComponentType<Props>>) {
  return lazy(async () => ({ default: await load() }))
}
