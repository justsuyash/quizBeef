import { HttpError } from 'wasp/server'

// Simple Elo update with K=32
export async function updateEloRatings(winnerId: number, loserId: number, context: any) {
  if (!winnerId || !loserId) throw new HttpError(400, 'winnerId and loserId required')

  const winner = await context.entities.User.findUnique({ where: { id: winnerId } })
  const loser = await context.entities.User.findUnique({ where: { id: loserId } })
  if (!winner || !loser) return

  const K = 32
  const Ra = winner.eloRating ?? 1200
  const Rb = loser.eloRating ?? 1200

  const Ea = 1 / (1 + Math.pow(10, (Rb - Ra) / 400))
  const Eb = 1 / (1 + Math.pow(10, (Ra - Rb) / 400))

  const newRa = Math.round(Ra + K * (1 - Ea))
  const newRb = Math.round(Rb + K * (0 - Eb))

  await context.entities.User.update({ where: { id: winnerId }, data: { eloRating: newRa } })
  await context.entities.User.update({ where: { id: loserId }, data: { eloRating: newRb } })

  // Record history for comparative analytics
  try {
    await context.entities.EloHistory.create({ data: { userId: winnerId, elo: newRa, source: 'beef', note: 'Win' } })
    await context.entities.EloHistory.create({ data: { userId: loserId, elo: newRb, source: 'beef', note: 'Loss' } })
  } catch (e) {
    // Non-fatal
    console.warn('Failed to record EloHistory:', e)
  }

  return { winner: newRa, loser: newRb }
}


