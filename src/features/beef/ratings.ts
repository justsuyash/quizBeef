import { HttpError } from 'wasp/server'

// QLO update with new-opponent diminishing bonus and floor at 0
export async function updateQloRatings(winnerId: number, loserId: number, context: any) {
  if (!winnerId || !loserId) throw new HttpError(400, 'winnerId and loserId required')

  const winner = await context.entities.User.findUnique({ where: { id: winnerId } })
  const loser = await context.entities.User.findUnique({ where: { id: loserId } })
  if (!winner || !loser) return

  const K = 24 // stable but responsive
  const Ra = winner.qlo ?? 5000
  const Rb = loser.qlo ?? 5000

  const Ea = 1 / (1 + Math.pow(10, (Rb - Ra) / 400))
  const Eb = 1 / (1 + Math.pow(10, (Ra - Rb) / 400))

  // Base update
  let newRa = Math.round(Ra + K * (1 - Ea))
  let newRb = Math.round(Rb + K * (0 - Eb))

  // New-opponent bonus (applies to winner only), diminishing very slowly
  // Compute matches played between this pair from BeefParticipant/Challenge
  try {
    const pairMatches = await context.entities.BeefParticipant.count({
      where: {
        userId: { in: [winnerId, loserId] },
        challenge: {
          participants: {
            some: { userId: winnerId }
          }
        }
      }
    })
    const matchesPlayed = Math.max(0, Math.floor(pairMatches / 2))
    const B0 = 12
    const beta = 0.15 // very slow decay
    let bonus = B0 / (1 + beta * matchesPlayed)
    // Anti-abuse: reduce if rating gap extreme and cap bonus
    const gap = Math.abs(Ra - Rb)
    if (gap > 1000) bonus *= 0.5
    bonus = Math.min(bonus, 15)
    newRa += Math.round(bonus)
  } catch {}

  // Floor at 0, no cap
  newRa = Math.max(0, newRa)
  newRb = Math.max(0, newRb)

  await context.entities.User.update({ where: { id: winnerId }, data: { qlo: newRa } })
  await context.entities.User.update({ where: { id: loserId }, data: { qlo: newRb } })

  // Record history for comparative analytics
  try {
    await context.entities.QloHistory.create({ data: { userId: winnerId, qlo: newRa, source: 'beef', note: 'Win' } })
    await context.entities.QloHistory.create({ data: { userId: loserId, qlo: newRb, source: 'beef', note: 'Loss' } })
  } catch (e) {
    // Non-fatal
    console.warn('Failed to record QloHistory:', e)
  }

  return { winner: newRa, loser: newRb }
}


