import type { ProviderId } from '../../../../shared/types'
import { useIsProviderPresent } from '../../../state/presentProviders'
import { useUsageStore } from '../../../state/usageStore'
import { useUsageVisibilityStore } from '../../../state/usageVisibilityStore'
import { AgentIcon } from '../../../ui/AgentIcon'
import { ProviderMark } from '../../../ui/ProviderMark'
import { SettingsSection } from '../../../ui/SettingsSection'

const PLAN_PROVIDERS: { id: ProviderId; name: string }[] = [
  { id: 'claude', name: 'Claude' },
  { id: 'codex', name: 'Codex' }
]

export function UsageVisibility() {
  const hiddenSources = useUsageVisibilityStore((state) => state.hiddenSources)
  const toggle = useUsageVisibilityStore((state) => state.toggle)
  const plans = useUsageStore((state) => state.plans)
  const isProviderPresent = useIsProviderPresent()
  const planProviders = PLAN_PROVIDERS.filter((provider) => isProviderPresent(provider.id))
  const sources = [
    ...planProviders.map((provider) => ({ id: provider.id, label: `${provider.name} plan usage`, icon: <ProviderMark provider={provider.id} /> })),
    ...plans.map((plan) => ({ id: plan.id, label: `${plan.name} plan usage`, icon: <AgentIcon command={plan.logoCommand} size={14} /> }))
  ]

  return (
    <SettingsSection
      title="Usage in the status bar"
      description="Plan limits from agents you sign in to with an account, read from the sign-in each agent keeps on this computer: Claude and Codex (5-hour and weekly), Grok (SuperGrok or X Premium, after grok login) and ClinePass (5-hour, weekly and monthly, after cline auth). Agents you use with an API key are paid per use, so they have no limit to show."
    >
      {sources.length === 0 && <p className="muted">No agent on this computer is signed in to a plan with limits.</p>}
      {sources.map((source) => (
        <label key={source.id} className="toggle-row">
          <input type="checkbox" role="switch" checked={!hiddenSources.includes(source.id)} onChange={() => toggle(source.id)} />
          {source.icon}
          <span>Show {source.label}</span>
        </label>
      ))}
    </SettingsSection>
  )
}
