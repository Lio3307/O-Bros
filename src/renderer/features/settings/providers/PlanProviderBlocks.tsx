import { isPlanProviderOnComputer, planProviderNote, PLAN_PROVIDERS, type PlanProviderInfo } from '../../../../shared/planProviders'
import type { PlanUsage } from '../../../../shared/planUsage'
import { useInstalledCommandsStore } from '../../../state/installedCommandsStore'
import { useUsageStore } from '../../../state/usageStore'
import { AgentIcon } from '../../../ui/AgentIcon'
import { UsageCell } from '../../../ui/UsageCell'
import { useNow } from '../../../ui/useNow'

const USAGE_TEXT_REFRESH_MS = 30_000
const WINDOW_NAMES: Record<string, string> = { '5h': '5 hours', wk: 'Weekly', mo: 'Monthly' }

interface PlanCardProps {
  provider: PlanProviderInfo
  usage: PlanUsage | undefined
  note: string | null
  now: number
}

function PlanCard({ provider, usage, note, now }: PlanCardProps) {
  const message = usage?.errorMessage ?? note
  return (
    <div className="account-card">
      <div className="account-card-main">
        <div className="account-card-title">
          <span className="account-label">{usage?.plan ?? `${provider.name} plan`}</span>
          {usage !== undefined && usage.errorMessage === null && <span className="chip chip-current">Signed in</span>}
        </div>
        <span className="muted account-card-subtitle">{message ?? `Your ${provider.name} sign-in on this computer.`}</span>
      </div>
      {usage?.windows.map((window) => (
        <UsageCell key={window.label} label={WINDOW_NAMES[window.label] ?? window.label} window={window.window} now={now} />
      ))}
    </div>
  )
}

export function PlanProviderBlocks() {
  const plans = useUsageStore((state) => state.plans)
  const facts = useUsageStore((state) => state.facts)
  const installedCommands = useInstalledCommandsStore((state) => state.commands) ?? []
  const now = useNow(USAGE_TEXT_REFRESH_MS)
  const readPlanIds = plans.map((plan) => plan.id)
  const providers = PLAN_PROVIDERS.filter((provider) => provider.kind === 'plan' && isPlanProviderOnComputer(provider, installedCommands, facts))

  return (
    <>
      {providers.map((provider) => (
        <section key={provider.id} className="provider-block">
          <header className="provider-header">
            <span className="provider-title">
              <AgentIcon command={provider.logoCommand} size={18} /> {provider.name}
            </span>
            <p className="muted">
              How much of your {provider.name} plan you have used ({provider.limits}), read from the {provider.cliCommand} sign-in on this computer. {provider.name} has one
              login, so there are no accounts to switch.
            </p>
          </header>
          <div className="account-list">
            <PlanCard provider={provider} usage={plans.find((plan) => plan.id === provider.id)} note={planProviderNote(provider, facts, readPlanIds)} now={now} />
          </div>
        </section>
      ))}
    </>
  )
}
