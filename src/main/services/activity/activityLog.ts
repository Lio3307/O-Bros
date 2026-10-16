import { app } from 'electron'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { keepNewestActivity, readActivityList, type ActivityEntry, type NewActivity } from '../../../shared/activity'
import { IpcChannel } from '../../../shared/ipc'
import { readJsonIfExists } from '../fileSystem'
import { sendToInterface } from '../wot/rendererBridge'

let entries: ActivityEntry[] = []
let loading: Promise<void> | null = null
let saving: Promise<void> = Promise.resolve()

function activityFilePath(): string {
  return join(app.getPath('userData'), 'activity.json')
}

function ensureLoaded(): Promise<void> {
  loading ??= readJsonIfExists<unknown>(activityFilePath())
    .catch(() => null)
    .then((saved) => {
      entries = keepNewestActivity([...readActivityList(saved), ...entries])
    })
  return loading
}

async function writeEntries(snapshot: ActivityEntry[]): Promise<void> {
  await mkdir(dirname(activityFilePath()), { recursive: true })
  await writeFile(activityFilePath(), JSON.stringify(snapshot), 'utf8')
}

function save(): void {
  const snapshot = entries
  saving = saving.then(() => writeEntries(snapshot)).catch(() => undefined)
}

export async function listActivity(): Promise<ActivityEntry[]> {
  await ensureLoaded()
  return entries
}

export async function recordActivity(activity: NewActivity): Promise<void> {
  const entry: ActivityEntry = { id: randomUUID(), at: Date.now(), ...activity }
  await ensureLoaded()
  entries = keepNewestActivity([...entries, entry])
  save()
  sendToInterface(IpcChannel.activityAdded, entry)
}

export async function clearActivity(): Promise<void> {
  await ensureLoaded()
  entries = []
  save()
}
