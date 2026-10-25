export const RELEASES_URL = 'https://github.com/Lio3307/O-Bros/releases'

const VERSION_CHARACTERS = '0123456789.-abcdefghijklmnopqrstuvwxyz'
const MAX_VERSION_LENGTH = 40

function isSafeVersion(version: string): boolean {
  return (
    version.length > 0 &&
    version.length <= MAX_VERSION_LENGTH &&
    Array.from(version.toLowerCase()).every((character) => VERSION_CHARACTERS.includes(character))
  )
}

export function releaseNotesUrl(version: unknown): string {
  return typeof version === 'string' && isSafeVersion(version) ? `${RELEASES_URL}/tag/v${version}` : RELEASES_URL
}
