export interface ContentBlock {
  type?: string
  text?: string
}

export function extractText(content: string | ContentBlock[] | undefined, textBlockTypes: string[]): string {
  if (content === undefined) {
    return ''
  }
  if (typeof content === 'string') {
    return content
  }
  return content
    .filter((block) => block.type !== undefined && textBlockTypes.includes(block.type))
    .map((block) => block.text ?? '')
    .join('\n')
}

export function isReadableUserText(text: string, ignoredPrefixes: string[]): boolean {
  return text.length > 0 && !ignoredPrefixes.some((prefix) => text.startsWith(prefix))
}
