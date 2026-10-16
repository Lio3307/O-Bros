import { randomBytes, timingSafeEqual } from 'node:crypto'
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { writeLog } from '../logging/logFile'
import { setWotConnection } from './wotConnection'
import { WotError } from './wotError'
import { makeWotCommandRunnable } from './wotPaths'
import { locateRealGit } from './realGit'
import { refreshWotInstalled } from './skillInstaller'
import { loadAcpRegistry } from '../agents/acpRegistryClient'
import { WOT_ROUTES } from './wotRoutes'

const HOST = '127.0.0.1'
const TOKEN_HEADER = 'x-wot-token'
const MAX_BODY_BYTES = 256 * 1024
const TOKEN_BYTES = 24

let server: Server | null = null
let token = ''

function reply(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.writeHead(statusCode, { 'content-type': 'application/json' })
  response.end(JSON.stringify(payload))
}

function hasValidToken(request: IncomingMessage): boolean {
  const sent = request.headers[TOKEN_HEADER]
  if (typeof sent !== 'string' || sent.length !== token.length) {
    return false
  }
  return timingSafeEqual(Buffer.from(sent), Buffer.from(token))
}

function readBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let text = ''
    request.setEncoding('utf8')
    request.on('data', (chunk: string) => {
      text += chunk
      if (text.length > MAX_BODY_BYTES) {
        reject(new WotError('bad-request', 'The request is too large.'))
        request.destroy()
      }
    })
    request.on('end', () => {
      try {
        const parsed: unknown = text === '' ? {} : JSON.parse(text)
        const isObject = typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
        resolve(isObject ? (parsed as Record<string, unknown>) : {})
      } catch {
        reject(new WotError('bad-request', 'The request is not valid JSON.'))
      }
    })
    request.on('error', reject)
  })
}

async function handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
  if (request.method !== 'POST') {
    reply(response, 405, { ok: false, code: 'bad-request', message: 'Only POST is accepted.' })
    return
  }
  if (!hasValidToken(request)) {
    reply(response, 401, { ok: false, code: 'not-allowed', message: 'The wot token is missing or wrong.' })
    return
  }
  const route = WOT_ROUTES[request.url ?? '']
  if (route === undefined) {
    reply(response, 404, { ok: false, code: 'bad-request', message: `Unknown wot action ${request.url}.` })
    return
  }
  try {
    reply(response, 200, { ok: true, result: await route(await readBody(request)) })
  } catch (error) {
    const code = error instanceof WotError ? error.code : 'failed'
    const message = error instanceof Error ? error.message : 'Something went wrong in O-BROS.'
    reply(response, 200, { ok: false, code, message })
  }
}

export function startWotServer(): void {
  void makeWotCommandRunnable()
  void locateRealGit()
  void refreshWotInstalled()
  void loadAcpRegistry()
  token = randomBytes(TOKEN_BYTES).toString('hex')
  const createdServer = createServer((request, response) => void handle(request, response))
  createdServer.on('error', (error) => writeLog('warning', 'The wot server stopped: ' + error.message))
  createdServer.listen(0, HOST, () => {
    const { port } = createdServer.address() as AddressInfo
    setWotConnection({ url: `http://${HOST}:${port}`, token })
  })
  server = createdServer
}

export function stopWotServer(): void {
  setWotConnection(null)
  server?.close()
  server = null
}
