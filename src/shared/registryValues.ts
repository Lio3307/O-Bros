const REGISTRY_TYPE_MARKER = ' REG_'

export function parseRegistryValues(output: string): Record<string, string> {
  const values: Record<string, string> = {}
  for (const line of output.split('\n')) {
    const typeStart = line.indexOf(REGISTRY_TYPE_MARKER)
    if (typeStart === -1) {
      continue
    }
    const name = line.slice(0, typeStart).trim().toLowerCase()
    const typeAndValue = line.slice(typeStart + 1).trim()
    const valueStart = typeAndValue.indexOf(' ')
    values[name] = valueStart === -1 ? '' : typeAndValue.slice(valueStart).trim()
  }
  return values
}
