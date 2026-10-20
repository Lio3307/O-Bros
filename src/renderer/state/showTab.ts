import { useTeamStore } from './teamStore'
import { useWorkspaceStore } from './workspaceStore'

export function showTab(tabId: string): void {
  useTeamStore.getState().hideMember()
  useWorkspaceStore.getState().activateTab(tabId)
}
