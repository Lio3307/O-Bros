import { describe, expect, it } from 'vitest'
import { createClickCooldown } from './clickCooldown'
import { createSingleFlight } from './singleFlight'

describe('createClickCooldown', () => {
  it('allows the first click and blocks the ones inside the cooldown', () => {
    let time = 1000
    const canClick = createClickCooldown(300, () => time)

    expect(canClick()).toBe(true)
    time = 1100
    expect(canClick()).toBe(false)
    time = 1299
    expect(canClick()).toBe(false)
  })

  it('allows a click again after the cooldown has passed', () => {
    let time = 1000
    const canClick = createClickCooldown(300, () => time)

    canClick()
    time = 1300
    expect(canClick()).toBe(true)
  })
})

describe('createSingleFlight', () => {
  it('runs a task once while an earlier call is still running', async () => {
    const runOnce = createSingleFlight()
    let calls = 0
    let release: () => void = () => undefined
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const slowTask = async () => {
      calls += 1
      await gate
      return 'done'
    }

    const first = runOnce(slowTask)
    const second = await runOnce(slowTask)
    release()

    expect(second).toBeUndefined()
    expect(await first).toBe('done')
    expect(calls).toBe(1)
  })

  it('lets the next call run once the first has finished, even if it failed', async () => {
    const runOnce = createSingleFlight()

    await expect(runOnce(async () => Promise.reject(new Error('failed')))).rejects.toThrow('failed')
    expect(await runOnce(async () => 'again')).toBe('again')
  })
})
