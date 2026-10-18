import { KeyRound, Pencil, PlugZap, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { friendlyErrorMessage } from '../../../../shared/friendlyError'
import type { CustomProvider, ProviderTestResult } from '../../../../shared/customProviders'
import { useAgentLaunchersStore } from '../../../state/agentLaunchersStore'
import { askToConfirm } from '../../../state/confirmStore'
import { useCustomProvidersStore } from '../../../state/customProvidersStore'
import { toast } from '../../../state/toastStore'
import { Button } from '../../../ui/Button'
import { Chip } from '../../../ui/Chip'
import { SettingsSection } from '../../../ui/SettingsSection'
import { Spinner } from '../../../ui/Spinner'
import { StatusDot } from '../../../ui/StatusDot'
import { CustomProviderForm } from './CustomProviderForm'

const PROTOCOL_LABELS: Record<CustomProvider['protocol'], string> = {
  anthropic: 'Anthropic-compatible',
  openai: 'OpenAI-compatible'
}

const NEW_PROVIDER = 'new'

function tokenText(label: string, tokens: number | null): string | null {
  return tokens === null ? null : `${label} ${tokens.toLocaleString('en-US')} tokens`
}

function ProviderRow({ provider, onEdit }: { provider: CustomProvider; onEdit: () => void }) {
  const keyHint = useCustomProvidersStore((state) => state.keyHints[provider.id])
  const remove = useCustomProvidersStore((state) => state.remove)
  const removeKey = useCustomProvidersStore((state) => state.removeKey)
  const launchers = useAgentLaunchersStore((state) => state.launchers)
  const [testResult, setTestResult] = useState<ProviderTestResult | null>(null)
  const [isTesting, setIsTesting] = useState(false)
  const usedBy = launchers.filter((launcher) => launcher.providerId === provider.id)
  const limits = [tokenText('Context', provider.contextTokens), tokenText('Output', provider.outputTokens)].filter(
    (text): text is string => text !== null
  )

  async function testConnection(): Promise<void> {
    setIsTesting(true)
    try {
      setTestResult(await window.api.accounts.testProvider(provider))
    } catch (error) {
      setTestResult({ kind: 'failed', message: friendlyErrorMessage(error, 'Could not test the provider.') })
    } finally {
      setIsTesting(false)
    }
  }

  async function confirmRemove(): Promise<void> {
    const isConfirmed = await askToConfirm({
      title: `Delete ${provider.name}?`,
      message: 'The provider and its saved key are deleted. Agent buttons that used it go back to their normal login.',
      confirmLabel: 'Delete provider'
    })
    if (isConfirmed) {
      await remove(provider.id).catch((error: unknown) =>
        toast.error(friendlyErrorMessage(error, 'Could not delete the provider.'))
      )
    }
  }

  return (
    <div className="table-row table-row-stacked">
      <div className="cell cell-account provider-row-body">
        <span className="provider-row-title">
          <span className="account-label">{provider.name}</span>
          <Chip>{PROTOCOL_LABELS[provider.protocol]}</Chip>
        </span>
        <span className="mono muted">{provider.baseUrl}</span>
        <span>
          Model <span className="mono">{provider.modelId}</span>
          {limits.length > 0 && <span className="muted"> · {limits.join(' · ')}</span>}
        </span>
        <span className="status-label">
          <StatusDot tone={keyHint === undefined ? 'neutral' : 'success'} />
          {keyHint === undefined ? 'No key saved' : `Key saved, ends in ${keyHint === '' ? '…' : keyHint}`}
          {keyHint !== undefined && (
            <Button variant="link" onClick={() => removeKey(provider.id)}>
              Forget key
            </Button>
          )}
        </span>
        {testResult !== null && (
          <span className="status-label provider-test-result">
            <StatusDot tone={testResult.kind === 'works' ? 'success' : 'danger'} />
            {testResult.message}
          </span>
        )}
        <span className="muted">
          {usedBy.length === 0
            ? 'Not used yet. Pick it for an agent in Settings → Agents.'
            : `Used by ${usedBy.map((launcher) => launcher.name).join(', ')}`}
        </span>
      </div>
      <div className="provider-row-actions">
        <Button variant="outline" disabled={isTesting} onClick={testConnection}>
          {isTesting ? <Spinner size={14} /> : <PlugZap size={14} />} Test connection
        </Button>
        <Button variant="outline" onClick={onEdit}>
          <Pencil size={14} /> Edit
        </Button>
        <Button variant="outline" className="hover-danger" onClick={confirmRemove}>
          <Trash2 size={14} /> Delete
        </Button>
      </div>
    </div>
  )
}

export function CustomProviders() {
  const providers = useCustomProvidersStore((state) => state.providers)
  const loadKeyHints = useCustomProvidersStore((state) => state.loadKeyHints)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    void loadKeyHints().catch(() => undefined)
  }, [loadKeyHints])

  function closeForm(): void {
    setEditingId(null)
  }

  return (
    <SettingsSection
      title="Custom providers"
      description={
        <>
          Your own model endpoint, such as a company proxy, OpenRouter or a local server. Pick it for an agent in Settings
          → Agents and that agent starts with it: Anthropic-compatible providers set ANTHROPIC_BASE_URL,
          ANTHROPIC_AUTH_TOKEN and ANTHROPIC_MODEL (Claude Code reads these), OpenAI-compatible ones set OPENAI_BASE_URL,
          OPENAI_API_KEY and OPENAI_MODEL. Agents that read neither keep their own settings. The context window is for
          your reference; the max output is passed to Claude Code. Providers are part of the settings export, their keys
          are not.
        </>
      }
      actions={
        editingId === null ? (
          <Button variant="outline" onClick={() => setEditingId(NEW_PROVIDER)}>
            <Plus size={14} /> Add provider
          </Button>
        ) : undefined
      }
    >
      {editingId === NEW_PROVIDER && <CustomProviderForm provider={null} onDone={closeForm} />}
      {providers.length === 0 && editingId !== NEW_PROVIDER && (
        <p className="muted provider-empty">
          <KeyRound size={14} /> No custom providers yet.
        </p>
      )}
      {providers.length > 0 && (
        <div className="table">
          {providers.map((provider) =>
            editingId === provider.id ? (
              <div key={provider.id} className="table-row table-row-stacked">
                <CustomProviderForm provider={provider} onDone={closeForm} />
              </div>
            ) : (
              <ProviderRow key={provider.id} provider={provider} onEdit={() => setEditingId(provider.id)} />
            )
          )}
        </div>
      )}
    </SettingsSection>
  )
}
