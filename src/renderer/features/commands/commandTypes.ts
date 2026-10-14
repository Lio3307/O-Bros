import type { ShortcutAction } from '../../../shared/shortcuts'

export interface AppCommand {
  id: string
  title: string
  group: string
  keywords?: string[]
  shortcutAction?: ShortcutAction
  shortcutText?: string
  run: () => void | Promise<unknown>
}
