import type { AccountRef } from '../../../shared/types'
import type { FileTab, TerminalPaneInfo, TerminalTab, WorkspaceTab } from '../../state/workspaceStore'
import { clampSplitRatio, listPaneIds, type PaneLayout } from './paneTree'

export interface SessionSnapshot {
  tabs: WorkspaceTab[]
  activeTabId: string | null
}

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function toAccount(value: unknown): AccountRef | null {
  if (!isRecord(value) || typeof value.configDir !== 'string') {
    return null
  }
  if (value.provider !== 'claude' && value.provider !== 'codex') {
    return null
  }
  return { provider: value.provider, configDir: value.configDir }
}

function toLayout(value: unknown): PaneLayout | null {
  if (!isRecord(value)) {
    return null
  }
  if (value.kind === 'pane') {
    return typeof value.paneId === 'string' ? { kind: 'pane', paneId: value.paneId } : null
  }
  const direction = value.direction
  if (value.kind !== 'split' || (direction !== 'horizontal' && direction !== 'vertical')) {
    return null
  }
  const first = toLayout(value.first)
  const second = toLayout(value.second)
  if (first === null || second === null) {
    return null
  }
  const ratio = typeof value.ratio === 'number' ? clampSplitRatio(value.ratio) : undefined
  return ratio === undefined ? { kind: 'split', direction, first, second } : { kind: 'split', direction, ratio, first, second }
}

function toPane(value: unknown): TerminalPaneInfo | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.title !== 'string' || !isNullableString(value.cwd)) {
    return null
  }
  return { id: value.id, title: value.title, cwd: value.cwd, account: toAccount(value.account), startCommand: null }
}

function toTerminalTab(value: JsonRecord): TerminalTab | null {
  const layout = toLayout(value.layout)
  if (layout === null || !isRecord(value.panes) || typeof value.focusedPaneId !== 'string') {
    return null
  }
  const panes: Record<string, TerminalPaneInfo> = {}
  for (const paneId of listPaneIds(layout)) {
    const pane = toPane(value.panes[paneId])
    if (pane === null) {
      return null
    }
    panes[paneId] = pane
  }
  const focusedPaneId = value.focusedPaneId in panes ? value.focusedPaneId : listPaneIds(layout)[0]
  return {
    kind: 'terminal',
    id: value.id as string,
    title: value.title as string,
    cwd: isNullableString(value.cwd) ? value.cwd : null,
    createdAt: typeof value.createdAt === 'number' ? value.createdAt : Date.now(),
    layout,
    panes,
    focusedPaneId
  }
}

function toFileTab(value: JsonRecord): FileTab | null {
  if (typeof value.path !== 'string') {
    return null
  }
  return { kind: 'file', id: value.id as string, title: value.title as string, path: value.path, isModified: false }
}

function toTab(value: unknown): WorkspaceTab | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.title !== 'string') {
    return null
  }
  if (value.kind === 'terminal') {
    return toTerminalTab(value)
  }
  return value.kind === 'file' ? toFileTab(value) : null
}

export function serializeSession(snapshot: SessionSnapshot): string {
  return JSON.stringify(snapshot)
}

export function parseSession(raw: string | null): SessionSnapshot | null {
  if (raw === null) {
    return null
  }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || !Array.isArray(parsed.tabs)) {
      return null
    }
    const tabs = parsed.tabs.map(toTab).filter((tab): tab is WorkspaceTab => tab !== null)
    const activeTabId = tabs.some((tab) => tab.id === parsed.activeTabId) ? (parsed.activeTabId as string) : null
    return { tabs, activeTabId: activeTabId ?? tabs[0]?.id ?? null }
  } catch {
    return null
  }
}
