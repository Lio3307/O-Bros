import type { ProviderId } from '../../shared/types'
import { AgentIcon } from './AgentIcon'

interface ProviderMarkProps {
  provider: ProviderId
  size?: number
}

export function ProviderMark({ provider, size = 14 }: ProviderMarkProps) {
  return <AgentIcon command={provider} size={size} />
}
