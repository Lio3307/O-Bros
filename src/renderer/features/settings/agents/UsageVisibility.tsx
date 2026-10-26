import type { ReactNode } from 'react'
import type { PlanUsage } from '../../../../shared/planUsage'
import type { UsageFacts } from '../../../../shared/usageSupport'
import { useUsageStore } from '../../../state/usageStore'
import { useUsageVisibilityStore } from '../../../state/usageVisibilityStore'
import { AgentIcon } from '../../../ui/AgentIcon'
import { ProviderMark } from '../../../ui/ProviderMark'
import { SettingsSection } from '../../../ui/SettingsSection'

interface PlanSourceOption {
  id: string
  name: string
  icon: ReactNode
  noteOf: (facts: UsageFacts, plans: PlanUsage[]) => string | null
}

const PLAN_SOURCES: PlanSourceOption[] = [
  {
    id: 'claude',
    name: 'Claude',
    icon: <ProviderMark provider="claude" />,
    noteOf: (facts) => (facts.claudeHasLoginFile ? null : 'Not signed in · run claude and sign in with your Claude plan')
  },
  {
    id: 'codex',
    name: 'Codex',
    icon: <ProviderMark provider="codex" />,
    noteOf: (facts) =>
      facts.codexLoginMode === 'chatgpt'
        ? null
        : facts.codexLoginMode === 'api-key'
          ? 'Signed in with an API key · no plan limit to show'
          : 'Not signed in · run codex and sign in with your ChatGPT plan'
  },
  {
    id: 'grok',
    name: 'Grok',
    icon: <AgentIcon command="grok" size={14} />,
    noteOf: (facts) => (facts.grokHasLogin ? null : 'Not signed in · run grok login')
  },
  {
    id: 'clinepass',
    name: 'ClinePass',
    icon: <AgentIcon command="cline" size={14} />,
    noteOf: (facts, plans) =>
      !facts.clineHasLogin
        ? 'Not signed in · run cline auth'
        : plans.some((plan) => plan.id === 'clinepass')
          ? null
          : 'This Cline account has no ClinePass plan'
  }
]

export function UsageVisibility() {
  const hiddenSources = useUsageVisibilityStore((state) => state.hiddenSources)
  const toggle = useUsageVisibilityStore((state) => state.toggle)
  const plans = useUsageStore((state) => state.plans)
  const facts = useUsageStore((state) => state.facts)

  return (
    <SettingsSection
      title="Usage in the status bar"
      description="Plan limits from agents you sign in to with an account, read from the sign-in each agent keeps on this computer: Claude and Codex (5-hour and weekly), Grok (SuperGrok or X Premium) and ClinePass (5-hour, weekly and monthly). Choose which ones the status bar and the usage popover show. Agents you use with an API key are paid per use, so they have no limit to show."
    >
      {PLAN_SOURCES.map((source) => {
        const note = facts === null ? null : source.noteOf(facts, plans)
        return (
          <label key={source.id} className="toggle-row">
            <input type="checkbox" role="switch" checked={!hiddenSources.includes(source.id)} onChange={() => toggle(source.id)} />
            {source.icon}
            <span>Show {source.name} plan usage</span>
            {note !== null && <span className="muted">{note}</span>}
          </label>
        )
      })}
    </SettingsSection>
  )
}
