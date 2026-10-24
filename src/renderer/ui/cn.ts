export type ClassName = string | false | null | undefined

export function cn(...names: ClassName[]): string | undefined {
  const joined = names.filter((name) => typeof name === 'string' && name !== '').join(' ')
  return joined === '' ? undefined : joined
}
