export interface WotConnection {
  url: string
  token: string
}

let connection: WotConnection | null = null

export function setWotConnection(next: WotConnection | null): void {
  connection = next
}

export function currentWotConnection(): WotConnection | null {
  return connection
}
