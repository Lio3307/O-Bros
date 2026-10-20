import { isRecord } from './isRecord'
export interface CreditBalance {
  id: string
  name: string
  viaTool: string
  logoCommand: string
  spentDollars: number
  limitDollars: number | null
  remainingDollars: number | null
  isFreeTier: boolean
  errorMessage: string | null
}

function dollarsOf(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export interface OpenRouterKeyNumbers {
  spentDollars: number
  limitDollars: number | null
  remainingDollars: number | null
  isFreeTier: boolean
}

export function parseOpenRouterKey(raw: unknown): OpenRouterKeyNumbers | null {
  const data = isRecord(raw) && isRecord(raw.data) ? raw.data : null
  if (data === null) {
    return null
  }
  return {
    spentDollars: dollarsOf(data.usage) ?? 0,
    limitDollars: dollarsOf(data.limit),
    remainingDollars: dollarsOf(data.limit_remaining),
    isFreeTier: data.is_free_tier === true
  }
}

export function formatDollars(amount: number): string {
  if (amount > 0 && amount < 0.01) {
    return 'under $0.01'
  }
  return `$${amount.toFixed(2)}`
}

export function describeCredit(balance: CreditBalance): string {
  if (balance.errorMessage !== null) {
    return 'unavailable'
  }
  const spent = `${formatDollars(balance.spentDollars)} used`
  if (balance.limitDollars !== null && balance.remainingDollars !== null) {
    return `${spent} · ${formatDollars(balance.remainingDollars)} of ${formatDollars(balance.limitDollars)} left`
  }
  return balance.isFreeTier ? `${spent} · free tier` : `${spent} · no limit set`
}
