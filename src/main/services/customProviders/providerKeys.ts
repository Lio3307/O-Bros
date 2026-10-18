import { app, safeStorage } from 'electron'
import { rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { isWebAddress, keyHintOf, parseCustomProviders, providerEnvironment } from '../../../shared/customProviders'
import { readJsonIfExists } from '../fileSystem'

const KEYS_FILE_NAME = 'provider-keys.json'

interface StoredKey {
  encrypted: string
  hint: string
}

type StoredKeys = Record<string, StoredKey>

function keysFilePath(): string {
  return join(app.getPath('userData'), KEYS_FILE_NAME)
}

function isStoredKey(value: unknown): value is StoredKey {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const entry = value as Record<string, unknown>
  return typeof entry.encrypted === 'string' && typeof entry.hint === 'string'
}

async function readStoredKeys(): Promise<StoredKeys> {
  const raw = await readJsonIfExists<Record<string, unknown>>(keysFilePath())
  const keys: StoredKeys = {}
  for (const [providerId, entry] of Object.entries(raw ?? {})) {
    if (isStoredKey(entry)) {
      keys[providerId] = entry
    }
  }
  return keys
}

async function writeStoredKeys(keys: StoredKeys): Promise<void> {
  const temporaryPath = `${keysFilePath()}.tmp`
  await writeFile(temporaryPath, JSON.stringify(keys), 'utf8')
  await rename(temporaryPath, keysFilePath())
}

export async function providerKeyHints(): Promise<Record<string, string>> {
  const keys = await readStoredKeys()
  return Object.fromEntries(Object.entries(keys).map(([providerId, entry]) => [providerId, entry.hint]))
}

export async function saveProviderKey(providerId: string, apiKey: string | null): Promise<void> {
  const keys = await readStoredKeys()
  const trimmed = apiKey?.trim() ?? ''
  if (trimmed === '') {
    delete keys[providerId]
  } else {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('This computer cannot encrypt the key, so it was not saved. Set it in an environment variable instead.')
    }
    keys[providerId] = { encrypted: safeStorage.encryptString(trimmed).toString('base64'), hint: keyHintOf(trimmed) }
  }
  await writeStoredKeys(keys)
}

export async function readProviderKey(providerId: string): Promise<string | null> {
  const entry = (await readStoredKeys())[providerId]
  if (entry === undefined || !safeStorage.isEncryptionAvailable()) {
    return null
  }
  try {
    return safeStorage.decryptString(Buffer.from(entry.encrypted, 'base64'))
  } catch {
    return null
  }
}

export async function customProviderEnvironment(requested: unknown): Promise<Record<string, string>> {
  const provider = parseCustomProviders([requested])[0]
  if (provider === undefined || !isWebAddress(provider.baseUrl)) {
    return {}
  }
  return providerEnvironment(provider, await readProviderKey(provider.id))
}
