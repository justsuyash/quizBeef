import type { LogRivalsVisit } from 'wasp/server/operations'
import { HttpError } from 'wasp/server'

export const logRivalsVisit: LogRivalsVisit<{ path?: string }, { ok: true }> = async (args, context) => {
  if (!context.user) throw new HttpError(401, 'Not authorized')
  // Lightweight server-side telemetry for now (console). Future: persist to PageVisit table.
  console.info('[analytics] rivals_page_view', {
    userId: context.user.id,
    path: args?.path || '/rivals',
    ts: new Date().toISOString(),
  })
  return { ok: true }
}


