export function createSingleFlight(): <Result>(task: () => Promise<Result>) => Promise<Result | undefined> {
  let isRunning = false

  return async (task) => {
    if (isRunning) {
      return undefined
    }
    isRunning = true
    try {
      return await task()
    } finally {
      isRunning = false
    }
  }
}
