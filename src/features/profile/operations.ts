import type { 
  GetUserProfile,
  UpdateUserProfile,
  GetLeaderboard,
  GetGroupLeaderboard,
  GetUserGroups,
  GetQloHistory,
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
            category: true,
            tags: true,
            contentJson: true,
            likeCount: true,
            commentCount: true,
            viewCount: true,
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
      // If querying own id, return a minimal shell without creating anything
      if (context.user?.id === userId) {
        return { id: userId, handle: null, profileType: 'ADULT', joinedAt: new Date().toISOString(), totalScore: 0, totalQuizzes: 0, totalBeefWins: 0, winStreak: 0, longestWinStreak: 0, averageAccuracy: 0, isPublicProfile: true, totalBeefParticipations: 0, beefWins: 0, beefWinRate: 0, averageQuizScore: 0, recentDocuments: [], recentQuizAttempts: [], recentBeefWins: [], stats: { totalDocuments: 0, totalQuizAttempts: 0, totalBeefChallengesCreated: 0, totalBeefParticipations: 0, followers: 0, following: 0 }, isOwnProfile: true }
      }
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

    // Profile snapshot: avg QLO 30d, avg streak 30d, rivals summary
    const now = new Date()
    const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const since90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    // Avg QLO 30d from QloHistory (fallback to current QLO if none)
    const qloHistory = await context.entities.QloHistory.findMany({
      where: { userId: user.id, changedAt: { gte: since30 } },
      select: { qlo: true }
    })
    const avgQlo30d = qloHistory.length > 0
      ? Math.round(qloHistory.reduce((s, h) => s + h.qlo, 0) / qloHistory.length)
      : user.qlo

    // Avg Streak 30d: compute daily streak progression over last 30d
    const attempts30 = await context.entities.QuizAttempt.findMany({
      where: { userId: user.id, completedAt: { gte: since30, lte: now } },
      select: { completedAt: true }
    })
    const activityDays = new Set<string>(
      attempts30.map(a => new Date(a.completedAt as any).toISOString().slice(0, 10))
    )
    let curStreak = 0
    let streakSum = 0
    for (let d = 0; d < 30; d++) {
      const day = new Date(now.getTime() - d * 24 * 60 * 60 * 1000)
      const key = day.toISOString().slice(0, 10)
      if (activityDays.has(key)) curStreak += 1
      else curStreak = 0
      streakSum += curStreak
    }
    const avgStreak30d = Math.round((streakSum / 30) * 10) / 10

    // Rivals summary (approximate: wins vs losses in last 90d)
    const recentBeefs = await context.entities.BeefParticipant.findMany({
      where: { userId: user.id, createdAt: { gte: since90, lte: now } },
      select: { position: true }
    })
    const wins = recentBeefs.filter(b => b.position === 1).length
    const losses = recentBeefs.filter(b => b.position !== 1).length

    // Remove sensitive information for public profiles
    const followersCount = await (context.entities as any).UserFollow.count({ where: { followingId: user.id } })
    const followingCount = await (context.entities as any).UserFollow.count({ where: { followerId: user.id } })

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
      profileSnapshot: {
        avgQlo30d,
        avgStreak30d,
        rivalsSummary: { outstanding: losses, avenged: wins }
      },
      
      // Related data
      recentDocuments: user.documents,
      recentQuizAttempts: user.quizAttempts,
      recentBeefWins: user.beefParticipations,
      
      // Counts
      stats: {
        totalDocuments: user._count.documents,
        totalQuizAttempts: user._count.quizAttempts,
        totalBeefChallengesCreated: user._count.createdBeefs,
        totalBeefParticipations: user._count.beefParticipations,
        followers: followersCount,
        following: followingCount,
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
 * Get group leaderboard with 9+1 user display logic
 */
export const getGroupLeaderboard: GetGroupLeaderboard<{
  groupId: number
  type?: 'quiz_score' | 'beef_wins' | 'accuracy' | 'total_quizzes' | 'qlo'
}, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be authenticated')
  }

  const { groupId, type = 'qlo' } = args

  try {
    let orderBy: any = { qlo: 'desc' }

    switch (type) {
      case 'quiz_score':
        orderBy = { totalScore: 'desc' }
        break
      case 'beef_wins':
        orderBy = { totalBeefWins: 'desc' }
        break
      case 'accuracy':
        orderBy = { averageAccuracy: 'desc' }
        break
      case 'total_quizzes':
        orderBy = { totalQuizzes: 'desc' }
        break
      case 'qlo':
        orderBy = { qlo: 'desc' }
        break
    }

    // Get all group members sorted by the selected metric
    const allGroupMembers = await context.entities.User.findMany({
      where: {
        groupMemberships: { some: { groupId } },
        isPublicProfile: true
      },
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
        qlo: true,
        avatarUrl: true,
        _count: { select: { beefParticipations: true } }
      },
      orderBy
    })

    // Find current user's position
    const currentUserIndex = allGroupMembers.findIndex(user => user.id === context.user!.id)
    
    let displayUsers: any[] = []
    
    if (allGroupMembers.length <= 10) {
      // If 10 or fewer members, show all
      displayUsers = allGroupMembers
    } else if (currentUserIndex < 9) {
      // If current user is in top 9, show top 10
      displayUsers = allGroupMembers.slice(0, 10)
    } else {
      // Show top 9 + current user
      displayUsers = [
        ...allGroupMembers.slice(0, 9),
        allGroupMembers[currentUserIndex]
      ]
    }

    // Add rank and additional stats
    const leaderboard = displayUsers.map((user, index) => {
      const actualRank = allGroupMembers.findIndex(u => u.id === user.id) + 1
      return {
        ...user,
        rank: actualRank,
        displayIndex: index,
        beefWinRate: user._count?.beefParticipations && user._count.beefParticipations > 0 
          ? (user.totalBeefWins / user._count.beefParticipations) * 100 
          : 0,
        isCurrentUser: user.id === context.user!.id
      }
    })

    // Get group info
    const group = await context.entities.Group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        description: true,
        _count: { select: { memberships: true } }
      }
    })

    return {
      group,
      leaderboard,
      totalMembers: allGroupMembers.length,
      currentUserRank: currentUserIndex + 1
    }
  } catch (error) {
    console.error('Error fetching group leaderboard:', error)
    throw new HttpError(500, 'Failed to fetch group leaderboard')
  }
}

/**
 * Get user's groups for leaderboard selection
 */
export const getUserGroups: GetUserGroups<{}, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be authenticated')
  }

  try {
    const userGroups = await context.entities.GroupMembership.findMany({
      where: { userId: context.user.id },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            _count: { select: { memberships: true } }
          }
        }
      },
      orderBy: { joinedAt: 'desc' }
    })

    return userGroups.map(membership => ({
      ...membership.group,
      joinedAt: membership.joinedAt,
      memberCount: membership.group._count.memberships
    }))
  } catch (error) {
    console.error('Error fetching user groups:', error)
    throw new HttpError(500, 'Failed to fetch user groups')
  }
}

/**
 * Get leaderboard with top users
 */
export const getLeaderboard: GetLeaderboard<{ 
  type?: 'quiz_score' | 'beef_wins' | 'accuracy' | 'total_quizzes' | 'qlo'
  limit?: number 
  country?: string
  county?: string
  city?: string
  groupId?: number
}, any> = async (args, context) => {
  const { type = 'qlo', limit = 50, country, county, city, groupId } = args

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
      case 'qlo':
        orderBy = { qlo: 'desc' }
        break
      default:
        orderBy = { qlo: 'desc' }
    }

    // If group specified, limit to group members
    const users = groupId ? await context.entities.User.findMany({
      where: {
        ...where,
        groupMemberships: { some: { groupId } }
      },
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
        qlo: true,
        avatarUrl: true,
        country: true,
        county: true,
        city: true,
        _count: { select: { beefParticipations: true } }
      },
      orderBy,
      take: limit
    }) : await context.entities.User.findMany({
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
        qlo: true,
        avatarUrl: true,
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

// Deprecated legacy Elo history removed in favor of QLO
/**
 * Get QLO history for current user and top users
 */
export const getQloHistory: GetQloHistory<{ limit?: number }, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be authenticated')
  }

  const { limit = 10 } = args || {}

  // Top users by QLO
  const topUsers = await context.entities.User.findMany({
    where: { isPublicProfile: true },
    select: { id: true, handle: true, qlo: true },
    orderBy: { qlo: 'desc' },
    take: limit
  })

  const me = await context.entities.User.findUnique({ where: { id: context.user.id }, select: { qlo: true } })

  // Ensure current user included
  const userIds = Array.from(new Set([context.user.id, ...topUsers.map(u => u.id)]))

  // Fetch history for each user
  const histories = await context.entities.QloHistory.findMany({
    where: { userId: { in: userIds } },
    orderBy: { changedAt: 'asc' }
  })

  // Group by user
  const byUser: Record<number, any[]> = {}
  for (const h of histories) {
    if (!byUser[h.userId]) byUser[h.userId] = []
    byUser[h.userId].push({ t: h.changedAt, qlo: h.qlo })
  }

  // Rank & percentile
  const total = await context.entities.User.count({ where: { isPublicProfile: true } })
  const higher = await context.entities.User.count({ where: { isPublicProfile: true, qlo: { gt: me?.qlo ?? 0 } } })
  const rank = higher + 1
  const percentile = total > 0 ? Math.round((1 - higher / total) * 100) : 0

  return {
    users: topUsers.map(u => ({ id: u.id, handle: u.handle, qlo: u.qlo })),
    currentUserId: context.user.id,
    series: byUser,
    rank,
    percentile,
    currentQlo: me?.qlo ?? 0
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
