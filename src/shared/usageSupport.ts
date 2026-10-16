export type UsageSupportKind = 'shown' | 'needs-login' | 'needs-subscription' | 'pay-per-use' | 'not-supported'

export interface UsageSupport {
  kind: UsageSupportKind
  label: string
  detail: string
}

export interface UsageFacts {
  claudeHasLoginFile: boolean
  claudePlan: string | null
  codexLoginMode: 'chatgpt' | 'api-key' | null
  codexPlan: string | null
  geminiAuthType: string | null
  openRouterVia: string | null
}

const CLAUDE_PAID_PLANS = ['pro', 'max', 'team', 'enterprise']
const GEMINI_KEY_TYPES = ['gemini-api-key', 'vertex-ai']
const NO_USAGE_SERVICE =
  "This agent's provider has no usage service O-BROS can read, so there is no limit to show."

function planName(plan: string): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1)
}

function claudeSupport(facts: UsageFacts): UsageSupport {
  if (!facts.claudeHasLoginFile) {
    return {
      kind: 'needs-login',
      label: 'Sign in to show usage',
      detail: 'Run claude once and sign in with your Claude account. On macOS the login is kept in the Keychain, which O-BROS does not read.'
    }
  }
  if (facts.claudePlan !== null && CLAUDE_PAID_PLANS.includes(facts.claudePlan)) {
    return {
      kind: 'shown',
      label: `Usage shown · Claude ${planName(facts.claudePlan)}`,
      detail: 'Your 5-hour and weekly limits are shown in the status bar.'
    }
  }
  return {
    kind: 'needs-subscription',
    label: 'Needs a Claude subscription',
    detail: 'Usage limits exist only for Claude Pro, Max, Team or Enterprise. With an API key you pay per use, so there is no limit to show.'
  }
}

function codexSupport(facts: UsageFacts): UsageSupport {
  if (facts.codexLoginMode === null) {
    return { kind: 'needs-login', label: 'Sign in to show usage', detail: 'Run codex once and sign in with your ChatGPT account.' }
  }
  if (facts.codexLoginMode === 'api-key') {
    return {
      kind: 'needs-subscription',
      label: 'Needs a ChatGPT plan',
      detail: 'Codex is signed in with an OpenAI API key, which is pay-per-use. Sign in with a ChatGPT plan to see usage limits.'
    }
  }
  const plan = facts.codexPlan === null ? 'ChatGPT' : `ChatGPT ${planName(facts.codexPlan)}`
  return { kind: 'shown', label: `Usage shown · ${plan}`, detail: 'Your Codex limits are shown in the status bar.' }
}

function geminiSupport(facts: UsageFacts): UsageSupport {
  if (facts.geminiAuthType !== null && GEMINI_KEY_TYPES.includes(facts.geminiAuthType)) {
    return {
      kind: 'pay-per-use',
      label: 'Pay-per-use key · no limit to show',
      detail: 'Gemini CLI uses an API key, which is billed per use and has no 5-hour or weekly limit.'
    }
  }
  return {
    kind: 'not-supported',
    label: 'Usage not available',
    detail: 'Google has no public usage service for Gemini CLI logins, so O-BROS cannot show a limit.'
  }
}

function openCodeSupport(facts: UsageFacts): UsageSupport {
  if (facts.openRouterVia !== null) {
    return {
      kind: 'shown',
      label: 'OpenRouter spending shown',
      detail: `OpenCode uses an OpenRouter key (found in ${facts.openRouterVia}); its spending and credit are shown in the usage popover. Other keys are pay-per-use.`
    }
  }
  return {
    kind: 'pay-per-use',
    label: 'Pay-per-use keys · no limit to show',
    detail: 'OpenCode uses API keys from the providers you connect. They are billed per use and have no usage limit to show.'
  }
}

export function usageSupportFor(program: string, facts: UsageFacts): UsageSupport {
  const lowered = program.toLowerCase()
  if (lowered === 'claude') {
    return claudeSupport(facts)
  }
  if (lowered === 'codex') {
    return codexSupport(facts)
  }
  if (lowered === 'gemini') {
    return geminiSupport(facts)
  }
  if (lowered === 'opencode') {
    return openCodeSupport(facts)
  }
  return { kind: 'not-supported', label: 'Usage not available', detail: NO_USAGE_SERVICE }
}
