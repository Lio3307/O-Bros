import type { ProviderId } from './types'
import type { UsageFacts } from './usageSupport'

export type PlanProviderKind = 'account' | 'plan'

export interface PlanProviderInfo {
  id: string
  kind: PlanProviderKind
  name: string
  logoCommand: string
  cliCommand: string
  limits: string
  signIn: string
  isSignedIn: (facts: UsageFacts) => boolean
}

export const PLAN_PROVIDERS: PlanProviderInfo[] = [
  {
    id: 'claude',
    kind: 'account',
    name: 'Claude',
    logoCommand: 'claude',
    cliCommand: 'claude',
    limits: '5-hour and weekly',
    signIn: 'run claude and sign in with your Claude plan',
    isSignedIn: (facts) => facts.claudeHasLoginFile
  },
  {
    id: 'codex',
    kind: 'account',
    name: 'Codex',
    logoCommand: 'codex',
    cliCommand: 'codex',
    limits: '5-hour and weekly',
    signIn: 'run codex and sign in with your ChatGPT plan',
    isSignedIn: (facts) => facts.codexLoginMode === 'chatgpt'
  },
  {
    id: 'grok',
    kind: 'plan',
    name: 'Grok',
    logoCommand: 'grok',
    cliCommand: 'grok',
    limits: 'the current period',
    signIn: 'run grok login',
    isSignedIn: (facts) => facts.grokHasLogin
  },
  {
    id: 'clinepass',
    kind: 'plan',
    name: 'ClinePass',
    logoCommand: 'cline',
    cliCommand: 'cline',
    limits: '5-hour, weekly and monthly',
    signIn: 'run cline auth',
    isSignedIn: (facts) => facts.clineHasLogin
  }
]

export const ACCOUNT_PROVIDER_IDS = PLAN_PROVIDERS.filter((provider) => provider.kind === 'account').map((provider) => provider.id) as ProviderId[]

export function planProviderName(id: string): string {
  return planProviderOf(id)?.name ?? id
}

export function planProviderOf(id: string): PlanProviderInfo | undefined {
  return PLAN_PROVIDERS.find((provider) => provider.id === id)
}

export function isPlanProviderOnComputer(provider: PlanProviderInfo, installedCommands: string[], facts: UsageFacts | null): boolean {
  return installedCommands.includes(provider.cliCommand) || (facts !== null && provider.isSignedIn(facts))
}

export function planProviderNote(provider: PlanProviderInfo, facts: UsageFacts | null, readPlanIds: string[]): string | null {
  if (facts === null) {
    return null
  }
  if (!provider.isSignedIn(facts)) {
    return `Not signed in · ${provider.signIn}`
  }
  return provider.kind === 'plan' && !readPlanIds.includes(provider.id) ? `This account has no ${provider.name} plan with limits` : null
}
