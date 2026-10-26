import { useConfirmStore, type ConfirmOptions } from '../../state/confirmStore'
import { useTeamStore } from '../../state/teamStore'
import { isTerminalTab, useWorkspaceStore } from '../../state/workspaceStore'

const ANSWER_WITHIN_MS = 100_000

export const ANSWER_WINDOW_NOTE = 'If you do not answer within 100 seconds, the answer is no.'
export const REFUSED_REASON = 'The user said no, or did not answer within 100 seconds.'

export function isTeamMember(paneId: string): boolean {
  return useTeamStore.getState().members.some((member) => member.id === paneId)
}

export function whoAsks(paneId: string, fromAgent: boolean): string {
  const member = useTeamStore.getState().members.find((candidate) => candidate.id === paneId)
  if (member !== undefined) {
    return `Team member "${member.name}" (${member.agentName})`
  }
  for (const tab of useWorkspaceStore.getState().tabs.filter(isTerminalTab)) {
    const pane = tab.panes[paneId]
    if (pane !== undefined) {
      return fromAgent ? `The agent in "${pane.title}"` : `A command in "${pane.title}"`
    }
  }
  return fromAgent ? 'An agent' : 'A command'
}

function notifyIfAway(title: string): void {
  if (document.hasFocus()) {
    return
  }
  try {
    const notification = new Notification(title, { body: 'Open O-BROS to allow or refuse it.' })
    notification.onclick = () => window.focus()
  } catch {
    return
  }
}

export async function askInTime(options: ConfirmOptions, notificationTitle: string): Promise<boolean> {
  notifyIfAway(notificationTitle)

  let timer: ReturnType<typeof setTimeout> | null = null
  const timedOut = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => {
      if (useConfirmStore.getState().options === options) {
        useConfirmStore.getState().answer(false)
      }
      resolve(false)
    }, ANSWER_WITHIN_MS)
  })
  const answer = await Promise.race([useConfirmStore.getState().ask(options), timedOut])
  if (timer !== null) {
    clearTimeout(timer)
  }
  return answer
}
