import { fileExtension } from './paths'

const IMAGE_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  svg: 'image/svg+xml'
}

export function imageTypeOf(path: string): string | null {
  return IMAGE_TYPES[fileExtension(path)] ?? null
}

export function imageExtensions(): string[] {
  return Object.keys(IMAGE_TYPES)
}

const IMAGE_SIGNATURES: { type: string; offset: number; bytes: number[] }[] = [
  { type: 'image/jpeg', offset: 0, bytes: [0xff, 0xd8, 0xff] },
  { type: 'image/png', offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47] },
  { type: 'image/gif', offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] },
  { type: 'image/bmp', offset: 0, bytes: [0x42, 0x4d] },
  { type: 'image/webp', offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }
]

export function imageTypeOfBytes(content: Uint8Array): string | null {
  const signature = IMAGE_SIGNATURES.find(({ offset, bytes }) => bytes.every((byte, index) => content[offset + index] === byte))
  return signature?.type ?? null
}
