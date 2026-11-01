import { isPlanProviderOnComputer, PLAN_PROVIDERS, planUsageRowOf, type PlanProviderInfo, type PlanReadingFacts } from '../../../../shared/planProviders'
import type { ProviderId } from '../../../../shared/types'
import { selectActiveAccount, useAccountsStore } from '../../../state/accountsStore'
import { useInstalledCommandsStore } from '../../../state/installedCommandsStore'
import { useUsageStore } from '../../../state/usageStore'
import { useUsageVisibilityStore } from '../../../state/usageVisibilityStore'
import { AccountsRefreshButton } from '../../../ui/AccountsRefreshButton'
import { AgentIcon } from '../../../ui/AgentIcon'
import { SettingsSection } from '../../../ui/SettingsSection'
import { StatusDot, type StatusTone } from '../../../ui/StatusDot'
import { listUsageWindows } from '../../../ui/usageText'

const TONE_OF_STATE: Record<ReturnType<typeof planUsageRowOf>['state'], StatusTone> = {
  showing: 'success',
  problem: 'warning',
  unavailable: 'neutral'
}

const READABLE_AGENTS = new Intl.ListFormat('en').format(PLAN_PROVIDERS.map((provider) => provider.name))

function useReadingOf(provider: PlanProviderInfo): PlanReadingFacts {
  const account = useAccountsStore((state) => (provider.kind === 'account' ? selectActiveAccount(state, provider.id as ProviderId) : null))
  const accountUsage = useUsageStore((state) => (account === null ? undefined : state.usageByAccountId[account.id]))
  const plan = useUsageStore((state) => state.plans.find((candidate) => candidate.id === provider.id))
  if (provider.kind === 'plan') {
    return { hasNumbers: plan !== undefined && plan.windows.length > 0, errorMessage: plan?.errorMessage ?? null }
  }
  return { hasNumbers: listUsageWindows(accountUsage).length > 0, errorMessage: accountUsage?.errorMessage ?? null }
}

function PlanLimitRow({ provider }: { provider: PlanProviderInfo }) {
  const isHidden = useUsageVisibilityStore((state) => state.hiddenSources.includes(provider.id))
  const toggle = useUsageVisibilityStore((state) => state.toggle)
  const facts = useUsageStore((state) => state.facts)
  const readPlanIds = useUsageStore((state) => state.plans).map((plan) => plan.id)
  const row = planUsageRowOf(provider, facts, readPlanIds, useReadingOf(provider))

  return (
    <div className="plan-limit-row">
      <AgentIcon command={provider.logoCommand} size={18} />
      <div className="plan-limit-body">
        <span className="plan-limit-name">{provider.name}</span>
        <span className="plan-limit-state muted">
          <StatusDot tone={TONE_OF_STATE[row.state]} />
          <span>{row.text}</span>
        </span>
      </div>
      {row.state === 'showing' && (
        <input
          type="checkbox"
          role="switch"
          aria-label={`Show ${provider.name} in the status bar`}
          title={`Show ${provider.name} in the status bar`}
          checked={!isHidden}
          onChange={() => toggle(provider.id)}
        />
      )}
    </div>
  )
}

export function UsageVisibility() {
  const facts = useUsageStore((state) => state.facts)
  const installedCommands = useInstalledCommandsStore((state) => state.commands) ?? []
  const onComputer = PLAN_PROVIDERS.filter((provider) => isPlanProviderOnComputer(provider, installedCommands, facts))

  return (
    <SettingsSection
      title="Plan limits in the status bar"
      description="How much of your plan is left, shown at the bottom of the window. An agent appears there once O-BROS can read its limits, and you can turn it off here."
      actions={<AccountsRefreshButton variant="labeled" label="Rescan" />}
    >
      {onComputer.length === 0 && <p className="muted">No agent with a plan O-BROS can read is on this computer.</p>}
      {onComputer.length > 0 && (
        <div className="plan-limit-list">
          {onComputer.map((provider) => (
            <PlanLimitRow key={provider.id} provider={provider} />
          ))}
        </div>
      )}
      <p className="muted">O-BROS can read limits for {READABLE_AGENTS}. Other agents do not report them, and an API key is paid per use, so it has no limit to show.</p>
    </SettingsSection>
  )
}
