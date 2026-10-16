export type WotErrorCode = 'bad-request' | 'not-allowed' | 'unknown-agent' | 'not-installed' | 'not-found' | 'limit' | 'disabled' | 'failed'

export class WotError extends Error {
  readonly code: WotErrorCode

  constructor(code: WotErrorCode, message: string) {
    super(message)
    this.code = code
  }
}
