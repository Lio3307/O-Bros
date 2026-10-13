import { useRefreshStore } from '../state/refreshStore'
import { RefreshButton } from './RefreshButton'

interface AccountsRefreshButtonProps {
  variant: 'icon' | 'labeled'
  label?: string
  iconSize?: number
}

export function AccountsRefreshButton({ variant, label, iconSize }: AccountsRefreshButtonProps) {
  const isRefreshing = useRefreshStore((state) => state.isRefreshing)
  const hasFailed = useRefreshStore((state) => state.hasFailed)
  const refresh = useRefreshStore((state) => state.refresh)

  return (
    <RefreshButton
      variant={variant}
      label={label}
      iconSize={iconSize}
      isBusy={isRefreshing}
      hasFailed={hasFailed}
      title="Rescan accounts and refresh usage"
      onRefresh={() => void refresh()}
    />
  )
}
