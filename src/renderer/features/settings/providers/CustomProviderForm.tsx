import { useState } from 'react'
import { friendlyErrorMessage } from '../../../../shared/friendlyError'
import {
  draftProblem,
  parseTokenCount,
  type CustomProvider,
  type CustomProviderDraft,
  type ProviderProtocol
} from '../../../../shared/customProviders'
import { useCustomProvidersStore } from '../../../state/customProvidersStore'
import { Button } from '../../../ui/Button'
import { SegmentedControl } from '../../../ui/SegmentedControl'

const PROTOCOL_OPTIONS: { value: ProviderProtocol; label: string }[] = [
  { value: 'anthropic', label: 'Anthropic-compatible' },
  { value: 'openai', label: 'OpenAI-compatible' }
]

const URL_EXAMPLES: Record<ProviderProtocol, string> = {
  anthropic: 'https://api.example.com/anthropic',
  openai: 'https://api.example.com/v1'
}

function tokensText(tokens: number | null): string {
  return tokens === null ? '' : String(tokens)
}

interface CustomProviderFormProps {
  provider: CustomProvider | null
  onDone: () => void
}

export function CustomProviderForm({ provider, onDone }: CustomProviderFormProps) {
  const save = useCustomProvidersStore((state) => state.save)
  const keyHint = useCustomProvidersStore((state) => (provider === null ? undefined : state.keyHints[provider.id]))
  const [name, setName] = useState(provider?.name ?? '')
  const [protocol, setProtocol] = useState<ProviderProtocol>(provider?.protocol ?? 'anthropic')
  const [baseUrl, setBaseUrl] = useState(provider?.baseUrl ?? '')
  const [modelId, setModelId] = useState(provider?.modelId ?? '')
  const [contextText, setContextText] = useState(tokensText(provider?.contextTokens ?? null))
  const [outputText, setOutputText] = useState(tokensText(provider?.outputTokens ?? null))
  const [apiKey, setApiKey] = useState('')
  const [problem, setProblem] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  async function submit(): Promise<void> {
    const draft: CustomProviderDraft = {
      name,
      protocol,
      baseUrl,
      modelId,
      contextTokens: parseTokenCount(contextText),
      outputTokens: parseTokenCount(outputText)
    }
    const found = draftProblem(draft)
    if (found !== null) {
      setProblem(found)
      return
    }
    setIsSaving(true)
    try {
      await save(provider?.id ?? null, draft, apiKey === '' ? null : apiKey)
      onDone()
    } catch (error) {
      setProblem(friendlyErrorMessage(error, 'Could not save the provider.'))
    } finally {
      setIsSaving(false)
    }
  }

  const keyPlaceholder =
    keyHint === undefined ? 'Paste the API key (optional)' : `Saved key ending in ${keyHint || '…'}. Paste a new one to replace it.`

  return (
    <form
      className="provider-form"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <h3 className="settings-subtitle">{provider === null ? 'Add a custom provider' : `Edit ${provider.name}`}</h3>
      <label className="provider-form-field">
        <span>Name</span>
        <input className="field" placeholder="My proxy" value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <div className="provider-form-field">
        <span>Type</span>
        <SegmentedControl options={PROTOCOL_OPTIONS} value={protocol} onChange={setProtocol} className="provider-protocol" />
      </div>
      <label className="provider-form-field">
        <span>URL</span>
        <input
          className="field mono"
          placeholder={URL_EXAMPLES[protocol]}
          spellCheck={false}
          value={baseUrl}
          onChange={(event) => setBaseUrl(event.target.value)}
        />
      </label>
      <label className="provider-form-field">
        <span>Model ID</span>
        <input
          className="field mono"
          placeholder={protocol === 'anthropic' ? 'claude-sonnet-4-5' : 'gpt-4.1'}
          spellCheck={false}
          value={modelId}
          onChange={(event) => setModelId(event.target.value)}
        />
      </label>
      <div className="provider-form-pair">
        <label className="provider-form-field">
          <span>Context window (input tokens)</span>
          <input
            className="field mono"
            placeholder="200000"
            inputMode="numeric"
            value={contextText}
            onChange={(event) => setContextText(event.target.value)}
          />
        </label>
        <label className="provider-form-field">
          <span>Max output tokens</span>
          <input
            className="field mono"
            placeholder="32000"
            inputMode="numeric"
            value={outputText}
            onChange={(event) => setOutputText(event.target.value)}
          />
        </label>
      </div>
      <label className="provider-form-field">
        <span>API key</span>
        <input
          className="field mono"
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder={keyPlaceholder}
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
        />
        <span className="muted provider-form-note">
          Encrypted on this computer and given only to the agents that use this provider. It is never shown again and
          never included in a settings export.
        </span>
      </label>
      {problem !== null && <p className="provider-form-problem">{problem}</p>}
      <div className="provider-form-actions">
        <Button variant="primary" type="submit" disabled={isSaving}>
          {provider === null ? 'Add provider' : 'Save'}
        </Button>
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
