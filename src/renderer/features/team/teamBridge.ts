import type { TeamMember, WotRendererRequest } from '../../../shared/types'
import { useAgentLaunchersStore } from '../../state/agentLaunchersStore'
import { useLayoutStore } from '../../state/layoutStore'
import { useTeamPolicyStore } from '../../state/teamPolicyStore'
import { useTeamStore } from '../../state/teamStore'
import { toast } from '../../state/toastStore'
import { useTerminalSettingsStore } from '../../state/terminalSettingsStore'
import { useWorkspaceStore } from '../../state/workspaceStore'
import { readTerminalText } from '../terminal/terminalRegistry'
import { confirmAgentGit } from './confirmAgentGit'
import { openTeamMember } from './openTeamMember'

async function answerRequest(request: WotRendererRequest): Promise<unknown> {
  if (request.kind === 'confirmGit') {
    return confirmAgentGit(request)
  }
  if (request.kind === 'listLaunchers') {
    return useAgentLaunchersStore.getState().launchers
  }
  const screen = readTerminalText(request.memberId, request.lines)
  if (screen === null) {
    throw new Error('The screen of this team member is not ready yet. Try again in a few seconds.')
  }
  return screen
}

function isWatchingMember(member: TeamMember): boolean {
  return useLayoutStore.getState().section === 'projects' && useTeamStore.getState().shownMemberId === member.id && document.hasFocus()
}

function notifyWaiting(member: TeamMember): void {
  try {
    const notification = new Notification(`Team member "${member.name}" is waiting`, {
      body: 'It is asking a question. Click to see it.'
    })
    notification.onclick = () => {
      window.focus()
      openTeamMember(member)
    }
  } catch {
    return
  }
}

function receiveMembers(members: TeamMember[]): void {
  const previous = useTeamStore.getState().members
  const shouldNotify = useTerminalSettingsStore.getState().notifyWhenFinished
  for (const member of members) {
    const before = previous.find((candidate) => candidate.id === member.id)
    if (shouldNotify && !isWatchingMember(member) && member.state === 'waiting' && before?.state !== 'waiting') {
      notifyWaiting(member)
    }
  }
  useTeamStore.getState().setMembers(members)
}

export function startTeamBridge(): () => void {
  void window.api.wot.listMembers().then(receiveMembers)
  void useTeamStore.getState().refreshInstalled()
  useTeamPolicyStore.getState().sendToApp()
  const stopNotices = window.api.wot.onNotice((message) => toast.success(message))
  const stopTabWatch = useWorkspaceStore.subscribe((state, previous) => {
    if (state.activeTabId !== previous.activeTabId) {
      useTeamStore.getState().hideMember()
    }
  })
  const stopMembers = window.api.wot.onMembers(receiveMembers)
  const stopRequests = window.api.wot.onRequest(({ requestId, request }) => {
    answerRequest(request)
      .then((answer) => window.api.wot.respond(requestId, answer, null))
      .catch((error: unknown) =>
        window.api.wot.respond(requestId, null, error instanceof Error ? error.message : 'Could not answer.')
      )
  })
  return () => {
    stopMembers()
    stopRequests()
    stopNotices()
    stopTabWatch()
  }
}
