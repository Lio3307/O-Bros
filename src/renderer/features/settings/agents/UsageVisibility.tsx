import type { ProviderId } from '../../../../shared/types'
import { useUsageVisibilityStore } from '../../../state/usageVisibilityStore'
import { ProviderMark } from '../../../ui/ProviderMark'
import { SettingsSection } from '../../../ui/SettingsSection'

const USAGE_PROVIDERS: { id: ProviderId; name: string }[] = [
  { id: 'claude', name: 'Claude' },
  { id: 'codex', name: 'Codex' }
]

export function UsageVisibility() {
  const hiddenProviders = useUsageVisibilityStore((state) => state.hiddenProviders)
  const toggle = useUsageVisibilityStore((state) => state.toggle)

  return (
    <SettingsSection
      title="Usage in the status bar"
      description="Claude and Codex report how much of your plan you have used (5-hour and weekly). OpenRouter reports money spent and credit left; O-BROS finds its key in OpenCode or in OPENROUTER_API_KEY. Other API keys, such as Google, NVIDIA or Cloudflare, have no usage service, so they cannot show a figure."
    >
      {USAGE_PROVIDERS.map((provider) => (
        <label key={provider.id} className="toggle-row">
          <input
            type="checkbox"
            checked={!hiddenProviders.includes(provider.id)}
            onChange={() => toggle(provider.id)}
          />
          <ProviderMark provider={provider.id} />
          <span>Show {provider.name} usage</span>
        </label>
      ))}
    </SettingsSection>
  )
}
