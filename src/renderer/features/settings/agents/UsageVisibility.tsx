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
  const credits = useUsageStore((state) => state.credits)
  const isProviderPresent = useIsProviderPresent()
  const planProviders = PLAN_PROVIDERS.filter((provider) => isProviderPresent(provider.id))
  const sources = [
    ...planProviders.map((provider) => ({ id: provider.id, label: `${provider.name} plan usage`, icon: <ProviderMark provider={provider.id} /> })),
    ...credits.map((balance) => ({
      id: balance.id,
      label: `${balance.name} credit (key from ${balance.viaTool})`,
      icon: <AgentIcon command={balance.logoCommand} size={14} />
    }))
  ]

  return (
    <SettingsSection
      title="Usage in the status bar"
      description="Every usage figure O-BROS can read on this computer. Claude and Codex report how much of your plan you have used (5-hour and weekly). OpenRouter reports money spent and credit left, from its key in OpenCode or in OPENROUTER_API_KEY. Other agents and API keys, such as Gemini, Google, NVIDIA or Cloudflare, have no usage service, so there is no figure to show."
    >
      {sources.length === 0 && <p className="muted">Nothing on this computer reports usage.</p>}
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
