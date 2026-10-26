import { isAgentCommand } from '../../../shared/agentLaunchers'
import {
  agentStatusOf,
  isSubmit,
  newAgentActivity,
  withOutput,
  withResize,
  withScreen,
  withTyping,
  type AgentActivity,
  type AgentStatus
} from '../../../shared/agentStatus'
import { isSameData } from '../../../shared/sameData'
import { useAgentCatalogStore } from '../../state/agentCatalogStore'
import { useAgentLaunchersStore } from '../../state/agentLaunchersStore'
import { useAgentStatusStore } from '../../state/agentStatusStore'
import { isTerminalTab, useWorkspaceStore } from '../../state/workspaceStore'
import { readTerminalText } from './terminalRegistry'

const CHECK_EVERY_MS = 1000
const SCREEN_LINES = 15

const activities = new Map<string, AgentActivity>()

function runningAgentPaneIds(): string[] {
  const launchers = useAgentLaunchersStore.getState().launchers
  const registry = useAgentCatalogStore.getState().registry
  return useWorkspaceStore
    .getState()
    .tabs.filter(isTerminalTab)
    .flatMap((tab) => Object.values(tab.panes))
    .filter((pane) => pane.isAgentRunning && isAgentCommand(pane.agentCommand, launchers, registry))
    .map((pane) => pane.id)
}

function screenOf(paneId: string): string {
  return readTerminalText(paneId, SCREEN_LINES) ?? ''
}

function updateActivity(paneId: string, change: (activity: AgentActivity) => AgentActivity): void {
  const activity = activities.get(paneId)
  if (activity !== undefined) {
    activities.set(paneId, change(activity))
  }
}

function checkStatuses(): void {
  const now = Date.now()
  const paneIds = runningAgentPaneIds()
  for (const paneId of activities.keys()) {
    if (!paneIds.includes(paneId)) {
      activities.delete(paneId)
    }
  }
  const statuses: Record<string, AgentStatus> = {}
  for (const paneId of paneIds) {
    const screen = screenOf(paneId)
    const activity = withScreen(activities.get(paneId) ?? newAgentActivity(now), screen)
    activities.set(paneId, activity)
    statuses[paneId] = agentStatusOf(activity, screen, now)
  }
  if (!isSameData(statuses, useAgentStatusStore.getState().statuses)) {
    useAgentStatusStore.getState().setStatuses(statuses)
  }
}

export function noteAgentOutput(paneId: string): void {
  updateActivity(paneId, (activity) => withOutput(activity, Date.now()))
}

export function noteAgentTyping(paneId: string, data: string): void {
  updateActivity(paneId, (activity) => withTyping(activity, data, isSubmit(data) ? screenOf(paneId) : '', Date.now()))
}

export function noteAgentResize(paneId: string): void {
  updateActivity(paneId, (activity) => withResize(activity, Date.now()))
}

export function startAgentStatusTracking(): () => void {
  const timer = setInterval(checkStatuses, CHECK_EVERY_MS)
  return () => clearInterval(timer)
}
