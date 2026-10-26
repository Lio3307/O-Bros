import { parentPort, workerData } from 'node:worker_threads'
import { historySources } from './historySources'
import { syncHistory } from './historySync'
import type { HistorySyncJob, HistorySyncResult } from './historySyncJob'

async function run(job: HistorySyncJob): Promise<HistorySyncResult> {
  try {
    return { savedCount: await syncHistory(job.folder, await historySources(), job.keepDays, job.now, job.waitForQuietMs) }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

void run(workerData as HistorySyncJob).then((result) => parentPort?.postMessage(result))
