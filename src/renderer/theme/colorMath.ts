type Rgb = [number, number, number]

const CHANNEL_MAX = 255
const DARK_LUMINANCE_LIMIT = 0.179
const READABLE_STEPS = 10
const LINEAR_THRESHOLD = 0.03928
const LINEAR_DIVISOR = 12.92
const GAMMA_OFFSET = 0.055
const GAMMA_DIVISOR = 1.055
const GAMMA = 2.4
const LUMINANCE_WEIGHTS: Rgb = [0.2126, 0.7152, 0.0722]
const CONTRAST_OFFSET = 0.05

function rgbOf(hex: string): Rgb {
  return [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16)) as Rgb
}

function hexOf(rgb: Rgb): string {
  return `#${rgb.map((channel) => Math.round(Math.min(CHANNEL_MAX, Math.max(0, channel))).toString(16).padStart(2, '0')).join('')}`
}

export function mixColors(from: string, to: string, amount: number): string {
  const start = rgbOf(from)
  const end = rgbOf(to)
  return hexOf(start.map((channel, index) => channel + (end[index] - channel) * amount) as Rgb)
}

function linearChannel(channel: number): number {
  const scaled = channel / CHANNEL_MAX
  return scaled <= LINEAR_THRESHOLD ? scaled / LINEAR_DIVISOR : ((scaled + GAMMA_OFFSET) / GAMMA_DIVISOR) ** GAMMA
}

function luminanceOf(hex: string): number {
  return rgbOf(hex).reduce((total, channel, index) => total + linearChannel(channel) * LUMINANCE_WEIGHTS[index], 0)
}

export function contrastRatio(first: string, second: string): number {
  const [lighter, darker] = [luminanceOf(first), luminanceOf(second)].sort((a, b) => b - a)
  return (lighter + CONTRAST_OFFSET) / (darker + CONTRAST_OFFSET)
}

export function isDarkColor(hex: string): boolean {
  return luminanceOf(hex) < DARK_LUMINANCE_LIMIT
}

export function readableOn(color: string, background: string, minimumRatio: number): string {
  const towards = isDarkColor(background) ? '#ffffff' : '#000000'
  let candidate = color
  for (let step = 1; step <= READABLE_STEPS && contrastRatio(candidate, background) < minimumRatio; step += 1) {
    candidate = mixColors(color, towards, step / READABLE_STEPS)
  }
  return candidate
}
