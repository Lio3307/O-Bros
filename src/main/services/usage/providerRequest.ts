import { app } from 'electron'

const REQUEST_TIMEOUT_MS = 10_000

export class UsageRequestError extends Error {}

export async function fetchJson<Payload>(url: string, headers: Record<string, string>): Promise<Payload> {
  const response = await fetch(url, {
    headers: { ...headers, 'User-Agent': `o-bros/${app.getVersion()}` },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  })

  if (response.status === 401 || response.status === 403) {
    throw new UsageRequestError('The saved login was rejected. Open the CLI once to refresh it, then Rescan.')
  }
  if (!response.ok) {
    throw new UsageRequestError(`The usage service answered with status ${response.status}.`)
  }
  return (await response.json()) as Payload
}
