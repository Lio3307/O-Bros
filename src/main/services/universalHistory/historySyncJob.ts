import createHistoryWorker from './historyWorker?nodeWorker'

export interface HistorySyncJob {
  folder: string
  keepDays: number | null
  now: number
  waitForQuietMs: number
}

export type HistorySyncResult = { savedCount: number } | { error: string }

export function syncHistoryInWorker(job: HistorySyncJob): Promise<number> {
  return new Promise((resolve, reject) => {
    const worker = createHistoryWorker({ workerData: job })
    let result: HistorySyncResult | null = null
    worker.once('message', (message: HistorySyncResult) => {
      result = message
    })
    worker.once('error', reject)
    worker.once('exit', () => {
      if (result === null) {
        reject(new Error('The history worker stopped without an answer.'))
      } else if ('error' in result) {
        reject(new Error(result.error))
      } else {
        resolve(result.savedCount)
      }
    })
  })
}
