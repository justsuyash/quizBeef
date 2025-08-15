import type { 
  GetUserProfile,
  UpdateUserProfile,
  GetLeaderboard,
  GetEloHistory
} from 'wasp/server/operations'
import { HttpError } from 'wasp/server'

/**
 * Get user profile by ID (for public viewing)
 */
export const getUserProfile: GetUserProfile<{ userId: number }, any> = async (args, context) => {
  const { userId } = args

  try {
    const user = await context.entities.User.findUnique({
      where: { id: userId },
      include: {
        documents: {
          where: {
            // Only include public documents or user's own documents
            OR: [
              { userId: context.user?.id || -1 },
              // Add public documents logic here if needed
            ]
          },
          select: {
            id: true,
            title: true,
            sourceType: true,
            createdAt: true,
            _count: {
              select: {
                questions: true,
                quizAttempts: true
              }
            }
          },
          take: 5, // Show recent 5 documents
          orderBy: { createdAt: 'desc' }
        },
        quizAttempts: {
          select: {
            id: true,
            score: true,
            createdAt: true,
            document: {
              select: {
                title: true
              }
            }
          },
          take: 10, // Recent 10 quiz attempts
          orderBy: { createdAt: 'desc' }
        },
        beefParticipations: {
          where: {
            position: 1 // Only wins
          },
          include: {
            challenge: {
              select: {
                title: true,
                createdAt: true,
                document: {
                  select: {
                    title: true
                  }
                }
              }
            }
          },
          take: 5, // Recent 5 wins
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            documents: true,
            quizAttempts: true,
            createdBeefs: true,
            beefParticipations: true
          }
        }
      }
    })

    if (!user) {
      throw new HttpError(404, 'User not found')
    }

    // Check if profile is public or if it's the user's own profile
    if (!user.isPublicProfile && user.id !== context.user?.id) {
      throw new HttpError(403, 'Profile is private')
    }

    // Calculate additional stats
    const totalBeefParticipations = await context.entities.BeefParticipant.count({
      where: { userId: user.id }
    })

    const beefWins = await context.entities.BeefParticipant.count({
      where: {
        userId: user.id,
        position: 1
      }
    })

    const avgQuizScore = await context.entities.QuizAttempt.aggregate({
      where: { userId: user.id },
      _avg: {
        score: true
      }
    })

    // Remove sensitive information for public profiles
    const publicUser = {
      id: user.id,
      handle: user.handle,
      profileType: user.profileType,
      bio: user.bio,
      location: user.location,
      website: user.website,
      joinedAt: user.joinedAt,
      totalScore: user.totalScore,
      totalQuizzes: user.totalQuizzes,
      totalBeefWins: user.totalBeefWins,
      winStreak: user.winStreak,
      longestWinStreak: user.longestWinStreak,
      averageAccuracy: user.averageAccuracy,
      favoriteSubject: user.favoriteSubject,
      isPublicProfile: user.isPublicProfile,
      
      // Calculated stats
      totalBeefParticipations,
      beefWins,
      beefWinRate: totalBeefParticipations > 0 ? (beefWins / totalBeefParticipations) * 100 : 0,
      averageQuizScore: avgQuizScore._avg.score || 0,
      
      // Related data
      recentDocuments: user.documents,
      recentQuizAttempts: user.quizAttempts,
      recentBeefWins: user.beefParticipations,
      
      // Counts
      stats: {
        totalDocuments: user._count.documents,
        totalQuizAttempts: user._count.quizAttempts,
        totalBeefChallengesCreated: user._count.createdBeefs,
        totalBeefParticipations: user._count.beefParticipations
      },
      
      // Privacy flag
      isOwnProfile: user.id === context.user?.id
    }

    return publicUser
  } catch (error) {
    console.error('Error fetching user profile:', error)
    if (error instanceof HttpError) throw error
    throw new HttpError(500, 'Failed to fetch user profile')
  }
}

/**
 * Update user profile (for own profile only)
 */
export const updateUserProfile: UpdateUserProfile<{
  handle?: string
  email?: string
  name?: string
  dateOfBirth?: Date
  language?: string
  accountType?: string
  bio?: string
  location?: string
  website?: string
  favoriteSubject?: string
  isPublicProfile?: boolean
}, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be authenticated')
  }

  console.log('updateUserProfile called with args:', args)
  console.log('User ID:', context.user.id)

  try {
    const updatedUser = await context.entities.User.update({
      where: { id: context.user.id },
      data: {
        handle: args.handle,
        email: args.email,
        name: args.name,
        dateOfBirth: args.dateOfBirth,
        language: args.language,
        accountType: args.accountType as any,
        bio: args.bio,
        location: args.location,
        website: args.website,
        favoriteSubject: args.favoriteSubject,
        isPublicProfile: args.isPublicProfile
      },
      select: {
        id: true,
        handle: true,
        email: true,
        name: true,
        dateOfBirth: true,
        language: true,
        accountType: true,
        bio: true,
        location: true,
        website: true,
        favoriteSubject: true,
        isPublicProfile: true
      }
    })

    console.log('User profile updated successfully:', updatedUser)
    return updatedUser
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw new HttpError(500, 'Failed to update profile')
  }
}

/**
 * Get leaderboard with top users
 */
export const getLeaderboard: GetLeaderboard<{ 
  type?: 'quiz_score' | 'beef_wins' | 'accuracy' | 'total_quizzes' | 'elo_rating'
  limit?: number 
  country?: string
  county?: string
  city?: string
}, any> = async (args, context) => {
  const { type = 'elo_rating', limit = 50, country, county, city } = args

  try {
    let orderBy: any = { totalScore: 'desc' }
    let where: any = {
        isPublicProfile: true,
        OR: [
          { totalQuizzes: { gt: 0 } },
          { totalBeefWins: { gt: 0 } }
        ]
    }

    if (country && country !== 'all') {
        where.country = country
    }
    if (county && county !== 'all') {
        where.county = county
    }
    if (city && city !== 'all') {
        where.city = city
    }


    switch (type) {
      case 'beef_wins':
        orderBy = { totalBeefWins: 'desc' }
        break
      case 'accuracy':
        orderBy = { averageAccuracy: 'desc' }
        break
      case 'total_quizzes':
        orderBy = { totalQuizzes: 'desc' }
        break
      case 'elo_rating':
        orderBy = { eloRating: 'desc' }
        break
      default:
        orderBy = { eloRating: 'desc' }
    }

    const users = await context.entities.User.findMany({
      where,
      select: {
        id: true,
        handle: true,
        profileType: true,
        totalScore: true,
        totalQuizzes: true,
        totalBeefWins: true,
        averageAccuracy: true,
        winStreak: true,
        longestWinStreak: true,
        joinedAt: true,
        favoriteSubject: true,
        eloRating: true,
        country: true,
        county: true,
        city: true,
        _count: {
          select: {
            beefParticipations: true
          }
        }
      },
      orderBy,
      take: limit
    })

    const leaderboard = users.map((user, index) => ({
      ...user,
      rank: index + 1,
      beefWinRate: user._count?.beefParticipations && user._count.beefParticipations > 0 
        ? (user.totalBeefWins / user._count.beefParticipations) * 100 
        : 0
    }))

    return leaderboard
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    throw new HttpError(500, 'Failed to fetch leaderboard')
  }
}

/**
 * Get Elo history for current user and top users
 */
export const getEloHistory: GetEloHistory<{ limit?: number }, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be authenticated')
  }

  const { limit = 10 } = args || {}

  // Top users by Elo
  const topUsers = await context.entities.User.findMany({
    where: { isPublicProfile: true },
    select: { id: true, handle: true, eloRating: true },
    orderBy: { eloRating: 'desc' },
    take: limit
  })

  // Ensure current user included
  const userIds = Array.from(new Set([context.user.id, ...topUsers.map(u => u.id)]))

  // Fetch history for each user
  const histories = await context.entities.EloHistory.findMany({
    where: { userId: { in: userIds } },
    orderBy: { changedAt: 'asc' }
  })

  // Group by user
  const byUser: Record<number, any[]> = {}
  for (const h of histories) {
    if (!byUser[h.userId]) byUser[h.userId] = []
    byUser[h.userId].push({ t: h.changedAt, elo: h.elo })
  }

  return {
    users: topUsers.map(u => ({ id: u.id, handle: u.handle, elo: u.eloRating })),
    currentUserId: context.user.id,
    series: byUser
  }
}

/**
 * Update user stats after quiz completion
 */
export const updateUserStats = async (
  userId: number, 
  quizScore: number, 
  accuracy: number,
  context: any
) => {
  try {
    const user = await context.entities.User.findUnique({
      where: { id: userId }
    })

    if (!user) return

    const newTotalQuizzes = user.totalQuizzes + 1
    const newTotalScore = user.totalScore + quizScore
    
    // Calculate new average accuracy
    const currentTotalAccuracy = (user.averageAccuracy || 0) * user.totalQuizzes
    const newAverageAccuracy = (currentTotalAccuracy + accuracy) / newTotalQuizzes

    await context.entities.User.update({
      where: { id: userId },
      data: {
        totalQuizzes: newTotalQuizzes,
        totalScore: newTotalScore,
        averageAccuracy: newAverageAccuracy
      }
    })
  } catch (error) {
    console.error('Error updating user stats:', error)
  }
}

/**
 * Update user beef stats after beef completion
 */
export const updateUserBeefStats = async (
  userId: number,
  position: number,
  context: any
) => {
  try {
    const user = await context.entities.User.findUnique({
      where: { id: userId }
    })

    if (!user) return

    const isWin = position === 1
    let updateData: any = {}

    if (isWin) {
      updateData.totalBeefWins = user.totalBeefWins + 1
      updateData.winStreak = user.winStreak + 1
      updateData.longestWinStreak = Math.max(user.longestWinStreak, user.winStreak + 1)
    } else {
      updateData.winStreak = 0 // Reset win streak on loss
    }

    await context.entities.User.update({
      where: { id: userId },
      data: updateData
    })
  } catch (error) {
    console.error('Error updating user beef stats:', error)
  }
}
