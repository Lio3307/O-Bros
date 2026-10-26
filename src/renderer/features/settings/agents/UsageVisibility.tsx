import { isPlanProviderOnComputer, PLAN_PROVIDERS, planProviderNote } from '../../../../shared/planProviders'
import { useInstalledCommandsStore } from '../../../state/installedCommandsStore'
import { useUsageStore } from '../../../state/usageStore'
import { useUsageVisibilityStore } from '../../../state/usageVisibilityStore'
import { AgentIcon } from '../../../ui/AgentIcon'
import { SettingsSection } from '../../../ui/SettingsSection'

export function UsageVisibility() {
  const hiddenSources = useUsageVisibilityStore((state) => state.hiddenSources)
  const toggle = useUsageVisibilityStore((state) => state.toggle)
  const plans = useUsageStore((state) => state.plans)
  const facts = useUsageStore((state) => state.facts)
  const installedCommands = useInstalledCommandsStore((state) => state.commands) ?? []
  const readPlanIds = plans.map((plan) => plan.id)
  const onComputer = PLAN_PROVIDERS.filter((provider) => isPlanProviderOnComputer(provider, installedCommands, facts))
  const elsewhere = PLAN_PROVIDERS.filter((provider) => !onComputer.includes(provider))

  return (
    <SettingsSection
      title="Usage in the status bar"
      description="Plan limits read from the sign-in each agent keeps on this computer. Choose which ones the status bar and the usage popover show. Agents you use with an API key are paid per use, so they have no limit to show."
    >
      {onComputer.length === 0 && <p className="muted">No agent with a plan O-BROS can read is on this computer.</p>}
      {onComputer.map((provider) => {
        const note = planProviderNote(provider, facts, readPlanIds)
        return (
          <label key={provider.id} className="toggle-row">
            <input type="checkbox" role="switch" checked={!hiddenSources.includes(provider.id)} onChange={() => toggle(provider.id)} />
            <AgentIcon command={provider.logoCommand} size={14} />
            <span>
              Show {provider.name} plan usage <span className="muted">({provider.limits})</span>
            </span>
            {note !== null && <span className="muted">{note}</span>}
          </label>
        )
      })}
      {elsewhere.length > 0 && (
        <p className="muted">
          Also read once installed and signed in: {elsewhere.map((provider) => `${provider.name} (${provider.signIn})`).join(', ')}.
        </p>
      )}
    </SettingsSection>
  )
}
