import type { 
  CreateBeef,
  JoinBeef,
  StartBeef,
  SubmitBeefAnswer,
  GetBeefChallenge,
  GetActiveBeefs,
  LeaveBeef
} from 'wasp/server/operations'
import { HttpError } from 'wasp/server'

/**
 * Generate a unique challenge code
 */
function generateChallengeCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `BEEF${result}`
}

/**
 * Calculate points based on correctness and speed
 */
function calculatePoints(isCorrect: boolean, timeSpent: number, timeLimit: number): number {
  if (!isCorrect) return 0
  
  const basePoints = 100
  const speedBonus = Math.max(0, Math.floor((timeLimit * 1000 - timeSpent) / 100)) // Bonus for speed
  
  return basePoints + Math.min(speedBonus, 50) // Max 150 points per question
}

/**
 * Create a new beef challenge
 */
export const createBeef: CreateBeef<
  {
    documentId: number
    title?: string
    questionCount?: number
    timeLimit?: number
    maxParticipants?: number
    difficultyDistribution?: any
    isPrivate?: boolean
  },
  any
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be authenticated')
  }

  const {
    documentId,
    title,
    questionCount = 10,
    timeLimit = 60,
    maxParticipants = 2,
    difficultyDistribution,
    isPrivate = false
  } = args

  try {
    // Verify document exists and user has access
    const document = await context.entities.Document.findFirst({
      where: {
        id: documentId,
        userId: context.user!.id
      },
      include: {
        questions: true
      }
    })

    if (!document) {
      throw new HttpError(404, 'Document not found or access denied')
    }

    if (document.questions.length < questionCount) {
      throw new HttpError(400, `Document only has ${document.questions.length} questions, but ${questionCount} requested`)
    }

    // Generate unique challenge code
    let challengeCode = generateChallengeCode()
    let attempts = 0
    while (attempts < 10) {
      const existingChallenge = await context.entities.BeefChallenge.findUnique({
        where: { challengeCode }
      })
      if (!existingChallenge) break
      challengeCode = generateChallengeCode()
      attempts++
    }

    if (attempts >= 10) {
      throw new HttpError(500, 'Failed to generate unique challenge code')
    }

    // Create challenge
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 30) // Expires in 30 minutes

    const challenge = await context.entities.BeefChallenge.create({
      data: {
        challengeCode,
        title,
        documentId,
        creatorId: context.user!.id,
        questionCount,
        timeLimit,
        maxParticipants,
        difficultyDistribution,
        isPrivate,
        expiresAt,
        status: 'WAITING'
      },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            sourceType: true
          }
        },
        creator: {
          select: {
            id: true,
            handle: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                handle: true
              }
            }
          }
        }
      }
    })

    // Automatically add creator as first participant
    await context.entities.BeefParticipant.create({
      data: {
        userId: context.user!.id,
        challengeId: challenge.id,
        isReady: true // Creator is automatically ready
      }
    })

    return {
      ...challenge,
      participantCount: 1
    }
  } catch (error) {
    console.error('Error creating beef challenge:', error)
    if (error instanceof HttpError) throw error
    throw new HttpError(500, 'Failed to create beef challenge')
  }
}

/**
 * Join an existing beef challenge
 */
export const joinBeef: JoinBeef<{ challengeCode: string }, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be authenticated')
  }

  const { challengeCode } = args

  try {
    // Find the challenge
    const challenge = await context.entities.BeefChallenge.findUnique({
      where: { challengeCode },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                handle: true
              }
            }
          }
        },
        document: {
          select: {
            id: true,
            title: true,
            sourceType: true
          }
        },
        creator: {
          select: {
            id: true,
            handle: true
          }
        }
      }
    })

    if (!challenge) {
      throw new HttpError(404, 'Challenge not found')
    }

    if (challenge.status !== 'WAITING') {
      throw new HttpError(400, 'Challenge is no longer accepting participants')
    }

    if (new Date() > challenge.expiresAt) {
      throw new HttpError(400, 'Challenge has expired')
    }

    if (challenge.participants.length >= challenge.maxParticipants) {
      throw new HttpError(400, 'Challenge is full')
    }

    // Check if user is already a participant
    const existingParticipant = challenge.participants.find(p => p.userId === context.user!.id)
    if (existingParticipant) {
      throw new HttpError(400, 'You are already participating in this challenge')
    }

    // Add user as participant
    await context.entities.BeefParticipant.create({
      data: {
        userId: context.user!.id,
        challengeId: challenge.id,
        isReady: false
      }
    })

    // Get updated challenge data
    const updatedChallenge = await context.entities.BeefChallenge.findUnique({
      where: { challengeCode },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                handle: true
              }
            }
          }
        },
        document: {
          select: {
            id: true,
            title: true,
            sourceType: true
          }
        },
        creator: {
          select: {
            id: true,
            handle: true
          }
        }
      }
    })

    return {
      ...updatedChallenge,
      participantCount: updatedChallenge?.participants.length || 0
    }
  } catch (error) {
    console.error('Error joining beef challenge:', error)
    if (error instanceof HttpError) throw error
    throw new HttpError(500, 'Failed to join beef challenge')
  }
}

/**
 * Start a beef challenge (when all participants are ready)
 */
export const startBeef: StartBeef<{ challengeId: number }, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be authenticated')
  }

  const { challengeId } = args

  try {
    // Verify user is the creator or has permission to start
    const challenge = await context.entities.BeefChallenge.findUnique({
      where: { id: challengeId },
      include: {
        participants: true,
        document: {
          include: {
            questions: {
              include: {
                answers: true
              }
            }
          }
        }
      }
    })

    if (!challenge) {
      throw new HttpError(404, 'Challenge not found')
    }

    if (challenge.creatorId !== context.user!.id) {
      throw new HttpError(403, 'Only the creator can start the challenge')
    }

    if (challenge.status !== 'WAITING') {
      throw new HttpError(400, 'Challenge cannot be started')
    }

    if (challenge.participants.length < 2) {
      throw new HttpError(400, 'Need at least 2 participants to start')
    }

    // Check if all participants are ready
    const allReady = challenge.participants.every(p => p.isReady)
    if (!allReady) {
      throw new HttpError(400, 'All participants must be ready')
    }

    // Select random questions for the challenge
    const availableQuestions = challenge.document.questions.filter(q => q.answers.length >= 2)
    if (availableQuestions.length < challenge.questionCount) {
      throw new HttpError(400, 'Not enough questions available')
    }

    // Shuffle and select questions
    const selectedQuestions = availableQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, challenge.questionCount)

    // Update challenge status
    await context.entities.BeefChallenge.update({
      where: { id: challengeId },
      data: { status: 'STARTING' }
    })

    // Create rounds for each question
    for (let i = 0; i < selectedQuestions.length; i++) {
      await context.entities.BeefRound.create({
        data: {
          challengeId,
          questionId: selectedQuestions[i].id,
          roundNumber: i + 1,
          timeLimit: challenge.timeLimit
        }
      })
    }

    // Start the challenge after a short delay
    setTimeout(async () => {
      try {
        await context.entities.BeefChallenge.update({
          where: { id: challengeId },
          data: { status: 'IN_PROGRESS' }
        })
        
        // Start first round
        const firstRound = await context.entities.BeefRound.findFirst({
          where: { challengeId, roundNumber: 1 }
        })
        
        if (firstRound) {
          await context.entities.BeefRound.update({
            where: { id: firstRound.id },
            data: { startedAt: new Date() }
          })
        }
      } catch (error) {
        console.error('Error starting beef challenge:', error)
      }
    }, 3000) // 3 second countdown

    return { success: true, message: 'Challenge starting in 3 seconds...' }
  } catch (error) {
    console.error('Error starting beef challenge:', error)
    if (error instanceof HttpError) throw error
    throw new HttpError(500, 'Failed to start beef challenge')
  }
}

/**
 * Submit an answer for a beef challenge round
 */
export const submitBeefAnswer: SubmitBeefAnswer<
  {
    challengeId: number
    roundNumber: number
    selectedAnswerId: number
    timeSpent: number
  },
  any
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be authenticated')
  }

  const { challengeId, roundNumber, selectedAnswerId, timeSpent } = args

  try {
    // Find the participant
    const participant = await context.entities.BeefParticipant.findFirst({
      where: {
        challengeId,
        userId: context.user!.id
      }
    })

    if (!participant) {
      throw new HttpError(404, 'Participant not found')
    }

    // Find the round
    const round = await context.entities.BeefRound.findFirst({
      where: {
        challengeId,
        roundNumber
      },
      include: {
        question: {
          include: {
            answers: true
          }
        }
      }
    })

    if (!round) {
      throw new HttpError(404, 'Round not found')
    }

    // Check if already answered
    const existingAnswer = await context.entities.BeefAnswer.findFirst({
      where: {
        participantId: participant.id,
        roundId: round.id
      }
    })

    if (existingAnswer) {
      throw new HttpError(400, 'Already answered this round')
    }

    // Validate answer
    const selectedAnswer = round.question.answers.find(a => a.id === selectedAnswerId)
    if (!selectedAnswer) {
      throw new HttpError(400, 'Invalid answer selection')
    }

    const isCorrect = selectedAnswer.isCorrect
    const pointsEarned = calculatePoints(isCorrect, timeSpent, round.timeLimit)

    // Submit answer
    await context.entities.BeefAnswer.create({
      data: {
        participantId: participant.id,
        roundId: round.id,
        selectedAnswerId,
        timeSpent,
        isCorrect,
        pointsEarned
      }
    })

    // Update participant score
    await context.entities.BeefParticipant.update({
      where: { id: participant.id },
      data: {
        finalScore: {
          increment: pointsEarned
        },
        totalTimeSpent: {
          increment: timeSpent
        }
      }
    })

    return {
      isCorrect,
      pointsEarned,
      correctAnswer: selectedAnswer.isCorrect ? selectedAnswer : round.question.answers.find(a => a.isCorrect)
    }
  } catch (error) {
    console.error('Error submitting beef answer:', error)
    if (error instanceof HttpError) throw error
    throw new HttpError(500, 'Failed to submit answer')
  }
  finally {
    try {
      await maybeFinalizeBeefAndGrantAchievements(challengeId, context)
    } catch (e) {
      console.warn('Finalize beef/achievements check failed:', e)
    }
  }
}

/**
 * Helper: finalize a beef challenge and trigger achievements for winners
 */
async function maybeFinalizeBeefAndGrantAchievements(challengeId: number, context: any) {
  // Determine if all rounds are answered; if so, compute winners
  const challenge = await context.entities.BeefChallenge.findUnique({
    where: { id: challengeId },
    include: {
      participants: true,
      rounds: { include: { answers: true } }
    }
  })

  if (!challenge) return

  const allAnswered = challenge.rounds.every(r => r.answers.length >= challenge.participants.length)
  if (!allAnswered) return

  // Sort participants by finalScore desc
  const participants = await context.entities.BeefParticipant.findMany({
    where: { challengeId },
    orderBy: { finalScore: 'desc' }
  })
  if (participants.length === 0) return

  const winner = participants[0]

  // Persist positions if not set
  for (let i = 0; i < participants.length; i++) {
    if (participants[i].position !== i + 1) {
      await context.entities.BeefParticipant.update({
        where: { id: participants[i].id },
        data: { position: i + 1 }
      })
    }
  }

  // Mark challenge as completed
  if (challenge.status !== 'COMPLETED') {
    await context.entities.BeefChallenge.update({
      where: { id: challengeId },
      data: { status: 'COMPLETED' }
    })
  }

  try {
    const { checkAchievements } = await import('../achievements/operations')
    await checkAchievements({
      userId: winner.userId,
      triggerType: 'BEEF_COMPLETED',
      triggerData: { challengeId, position: 1, finalScore: winner.finalScore }
    }, context as any)

    // Phase 1.4: Update Elo ratings for winner vs next best (simple pair)
    if (participants.length >= 2) {
      try {
        const { updateQloRatings } = await import('./ratings')
        await updateQloRatings(winner.userId, participants[1].userId, context as any)
      } catch (e) {
        console.warn('QLO update failed:', e)
      }
    }
  } catch (e) {
    console.warn('Failed to check achievements for beef winner:', e)
  }
}
/**
 * Get a beef challenge with full details
 */
export const getBeefChallenge: GetBeefChallenge<{ challengeId: number }, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be authenticated')
  }

  const { challengeId } = args

  try {
    const challenge = await context.entities.BeefChallenge.findUnique({
      where: { id: challengeId },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            sourceType: true
          }
        },
        creator: {
          select: {
            id: true,
            handle: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                handle: true
              }
            },
            answers: {
              include: {
                round: {
                  select: {
                    roundNumber: true
                  }
                }
              }
            }
          },
          orderBy: {
            finalScore: 'desc'
          }
        },
        rounds: {
          include: {
            question: {
              include: {
                answers: true
              }
            },
            answers: {
              include: {
                participant: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        handle: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: {
            roundNumber: 'asc'
          }
        }
      }
    })

    if (!challenge) {
      throw new HttpError(404, 'Challenge not found')
    }

    // Verify user is a participant
    const isParticipant = challenge.participants.some(p => p.userId === context.user!.id)
    if (!isParticipant) {
      throw new HttpError(403, 'You are not a participant in this challenge')
    }

    return challenge
  } catch (error) {
    console.error('Error fetching beef challenge:', error)
    if (error instanceof HttpError) throw error
    throw new HttpError(500, 'Failed to fetch challenge')
  }
}

/**
 * Get active beef challenges that can be joined
 */
export const getActiveBeefs: GetActiveBeefs<void, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be authenticated')
  }

  try {
    const challenges = await context.entities.BeefChallenge.findMany({
      where: {
        status: 'WAITING',
        expiresAt: {
          gt: new Date()
        },
        isPrivate: false
      },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            sourceType: true
          }
        },
        creator: {
          select: {
            id: true,
            handle: true
          }
        },
        _count: {
          select: {
            participants: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    })

    return challenges.map(challenge => ({
      ...challenge,
      participantCount: challenge._count.participants
    }))
  } catch (error) {
    console.error('Error fetching active beefs:', error)
    throw new HttpError(500, 'Failed to fetch active challenges')
  }
}

/**
 * Leave a beef challenge (before it starts)
 */
export const leaveBeef: LeaveBeef<{ challengeId: number }, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be authenticated')
  }

  const { challengeId } = args

  try {
    const challenge = await context.entities.BeefChallenge.findUnique({
      where: { id: challengeId }
    })

    if (!challenge) {
      throw new HttpError(404, 'Challenge not found')
    }

    if (challenge.status !== 'WAITING') {
      throw new HttpError(400, 'Cannot leave challenge that has already started')
    }

    // Remove participant
    const participant = await context.entities.BeefParticipant.findFirst({
      where: {
        challengeId,
        userId: context.user!.id
      }
    })

    if (!participant) {
      throw new HttpError(404, 'You are not a participant in this challenge')
    }

    await context.entities.BeefParticipant.delete({
      where: { id: participant.id }
    })

    // If creator leaves, cancel the challenge
    if (challenge.creatorId === context.user!.id) {
      await context.entities.BeefChallenge.update({
        where: { id: challengeId },
        data: { status: 'CANCELLED' }
      })
    }

    return { success: true, message: 'Left challenge successfully' }
  } catch (error) {
    console.error('Error leaving beef challenge:', error)
    if (error instanceof HttpError) throw error
    throw new HttpError(500, 'Failed to leave challenge')
  }
}
