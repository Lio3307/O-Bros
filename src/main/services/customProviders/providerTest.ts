import {
  describeProviderAnswer,
  isWebAddress,
  parseCustomProviders,
  providerProbe,
  type ProviderTestResult
} from '../../../shared/customProviders'
import { readProviderKey } from './providerKeys'

const TEST_TIMEOUT_MS = 10_000

async function bodyOf(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function testCustomProvider(requested: unknown): Promise<ProviderTestResult> {
  const provider = parseCustomProviders([requested])[0]
  if (provider === undefined || !isWebAddress(provider.baseUrl)) {
    return { kind: 'failed', message: 'The URL must start with https:// or http://.' }
  }
  const probe = providerProbe(provider, await readProviderKey(provider.id))
  try {
    const response = await fetch(probe.url, { headers: probe.headers, signal: AbortSignal.timeout(TEST_TIMEOUT_MS) })
    return describeProviderAnswer(provider, response.status, await bodyOf(response))
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'TimeoutError'
    return {
      kind: 'failed',
      message: isTimeout
        ? `No answer from ${new URL(probe.url).host} within 10 seconds.`
        : `Could not reach ${new URL(probe.url).host}. Check the URL and your connection.`
    }
  }
}
