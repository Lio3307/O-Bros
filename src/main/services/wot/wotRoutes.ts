import { isValidCommitIdentity, type CommitIdentity } from '../../../shared/commitIdentity'
import { decideGit } from './gitDecision'
import { isWotInstalled, listSkillTargets } from './skillInstaller'
import { skillUpdateNoteForAgents } from '../../../shared/skillUpdates'
import { removeAgentCredits } from './commitCredits'
import { terminalFactsOf } from '../terminalFacts'
import {
  availableAgents,
  findOwnMember,
  isTeamMember,
  listOwnMembers,
  readMemberScreen,
  sendToMember,
  spawnMember,
  stopMember,
  waitForAnyMember,
  waitForMember
} from './teamRegistry'
import { WotError } from './wotError'

type RequestBody = Record<string, unknown>

function textField(body: RequestBody, field: string, isRequired: boolean): string {
  const value = body[field]
  if (typeof value === 'string') {
    return value
  }
  if (isRequired) {
    throw new WotError('bad-request', `"${field}" is missing.`)
  }
  return ''
}

function numberField(body: RequestBody, field: string): number | undefined {
  const value = body[field]
  return typeof value === 'number' ? value : undefined
}

function textListField(body: RequestBody, field: string): string[] {
  const value = body[field]
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new WotError('bad-request', `"${field}" must be a list of text.`)
  }
  return value as string[]
}

function identityField(body: RequestBody): CommitIdentity | null {
  const value = body.identity
  if (typeof value !== 'object' || value === null) {
    return null
  }
  const candidate = value as Record<string, unknown>
  const identity = { name: String(candidate.name ?? ''), email: String(candidate.email ?? '') }
  return isValidCommitIdentity(identity) ? identity : null
}

const NOT_INSTALLED_MESSAGE =
  'The wot skill is not installed, so team features are off. Tell the user: open O-BROS, go to Settings → Team (wot) and install the wot skill for the agents you want to use.'

function teamCallerPaneOf(body: RequestBody): string {
  if (!isWotInstalled()) {
    throw new WotError('disabled', NOT_INSTALLED_MESSAGE)
  }
  return callerPaneOf(body)
}

function callerPaneOf(body: RequestBody): string {
  const paneId = textField(body, 'pane', true)
  if (terminalFactsOf(paneId) === undefined) {
    throw new WotError('not-allowed', 'This terminal is not one O-BROS opened, so it cannot use wot.')
  }
  return paneId
}

export const WOT_ROUTES: Record<string, (body: RequestBody) => Promise<unknown>> = {
  '/status': async (body) => {
    const paneId = teamCallerPaneOf(body)
    const skillNote = skillUpdateNoteForAgents(await listSkillTargets().catch(() => []))
    return { paneId, isMember: isTeamMember(paneId), memberCount: listOwnMembers(paneId).length, skillNote }
  },

  '/agents': async (body) => {
    teamCallerPaneOf(body)
    return availableAgents()
  },

  '/spawn': async (body) =>
    spawnMember({
      callerPaneId: teamCallerPaneOf(body),
      agent: textField(body, 'agent', true),
      name: textField(body, 'name', false),
      task: textField(body, 'task', false),
      agentArgs: body.agentArgs === undefined ? [] : textListField(body, 'agentArgs'),
      cwd: textField(body, 'cwd', false)
    }),

  '/list': async (body) => listOwnMembers(teamCallerPaneOf(body)),

  '/send': async (body) => {
    const member = findOwnMember(textField(body, 'member', true), teamCallerPaneOf(body))
    return sendToMember(member.id, textField(body, 'text', true))
  },

  '/read': async (body) => {
    const member = findOwnMember(textField(body, 'member', true), teamCallerPaneOf(body))
    return { member, screen: await readMemberScreen(member.id, numberField(body, 'lines')) }
  },

  '/wait': async (body) => {
    const callerPaneId = teamCallerPaneOf(body)
    if (body.any === true) {
      return { any: await waitForAnyMember(callerPaneId, numberField(body, 'timeout')) }
    }
    return waitForMember(findOwnMember(textField(body, 'member', true), callerPaneId).id, numberField(body, 'timeout'))
  },

  '/git-check': async (body) =>
    decideGit({
      paneId: callerPaneOf(body),
      gitArguments: textListField(body, 'args'),
      cwd: textField(body, 'cwd', true),
      guardPid: numberField(body, 'pid') ?? null
    }),

  '/after-commit': async (body) => {
    callerPaneOf(body)
    await removeAgentCredits(textField(body, 'cwd', true), textListField(body, 'args'), identityField(body))
    return {}
  },

  '/stop': async (body) => {
    const member = findOwnMember(textField(body, 'member', true), teamCallerPaneOf(body))
    return { member: stopMember(member.id) }
  }
}
