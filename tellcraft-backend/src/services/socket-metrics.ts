type ErrorCounter = Record<string, number>

const MAX_ERROR_KEYS = 20

const metrics = {
  currentConnections: 0,
  peakConnections: 0,
  totalConnections: 0,
  totalDisconnects: 0,
  engineConnectionErrors: {} as ErrorCounter,
}

function incrementErrorCounter(reason: string) {
  const key = reason.slice(0, 120) || 'unknown'
  if (!metrics.engineConnectionErrors[key]) {
    const keys = Object.keys(metrics.engineConnectionErrors)
    if (keys.length >= MAX_ERROR_KEYS) return
    metrics.engineConnectionErrors[key] = 0
  }
  metrics.engineConnectionErrors[key] += 1
}

export function recordSocketConnected() {
  metrics.currentConnections += 1
  metrics.totalConnections += 1
  if (metrics.currentConnections > metrics.peakConnections) {
    metrics.peakConnections = metrics.currentConnections
  }
}

export function recordSocketDisconnected() {
  if (metrics.currentConnections > 0) {
    metrics.currentConnections -= 1
  }
  metrics.totalDisconnects += 1
}

export function recordSocketEngineError(reason: string) {
  incrementErrorCounter(reason)
}

export function getSocketMetrics() {
  return {
    ...metrics,
    engineConnectionErrors: { ...metrics.engineConnectionErrors },
  }
}
