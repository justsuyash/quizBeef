import { EventEmitter } from 'events'

// Singleton emitter for stats updates
const emitter = new EventEmitter()
emitter.setMaxListeners(1000)

export type StatsPayload = {
  type: 'quiz_completed' | 'achievement_granted' | 'streak_updated' | 'elo_updated' | 'medals_updated' | 'refresh'
  value?: number
}

export function emitStatsUpdate(userId: number, payload: StatsPayload): void {
  emitter.emit(getChannel(userId), payload)
}

function getChannel(userId: number): string {
  return `stats:${userId}`
}

// API handler for SSE; Wasp API functions receive (req, res, context)
export async function statsEvents(req: any, res: any, context: any) {
  if (!context.user) {
    res.status(401).end()
    return
  }

  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  const channel = getChannel(context.user.id)
  const listener = (payload: StatsPayload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`)
  }

  emitter.on(channel, listener)

  // Send an initial event so client knows it is connected
  res.write(`data: ${JSON.stringify({ type: 'refresh' })}\n\n`)

  // Heartbeat to keep connection alive
  const interval = setInterval(() => res.write(': keep-alive\n\n'), 25000)

  req.on('close', () => {
    clearInterval(interval)
    emitter.off(channel, listener)
    res.end()
  })
}


