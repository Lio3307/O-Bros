import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { devServerUrl } from '../runMode'

const APP_PAGE_URL = pathToFileURL(join(__dirname, '../renderer/index.html')).href

export function isTrustedSender(frameUrl: string | null | undefined): boolean {
  if (frameUrl === null || frameUrl === undefined) {
    return false
  }
  const sourceUrl = devServerUrl()
  if (sourceUrl !== null && frameUrl.startsWith(sourceUrl)) {
    return true
  }
  return frameUrl.split('#')[0].split('?')[0] === APP_PAGE_URL
}
