import { setHiddenErrorReporter } from '../shared/friendlyError'

function describeFailure(failure: unknown): string {
  return failure instanceof Error ? (failure.stack ?? failure.message) : String(failure)
}

export function installDiagnostics(): void {
  window.addEventListener('error', (event) => {
    window.api.app.log('error', 'Script error: ' + describeFailure(event.error ?? event.message))
  })
  window.addEventListener('unhandledrejection', (event) => {
    window.api.app.log('error', 'Unhandled rejection: ' + describeFailure(event.reason))
  })
  setHiddenErrorReporter((rawMessage) => {
    window.api.app.log('warning', 'An error was hidden behind a friendly message: ' + rawMessage)
  })
}
