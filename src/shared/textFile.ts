const NUL_BYTE = 0

export function decodeEditableText(bytes: Uint8Array): string | null {
  if (bytes.includes(NUL_BYTE)) {
    return null
  }
  try {
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes)
  } catch {
    return null
  }
}
