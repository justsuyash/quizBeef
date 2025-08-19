import { HttpError } from 'wasp/server'
import type {
  FollowUser,
  UnfollowUser,
  GetUserFeed,
  GetFollowSuggestions,
  GetUserFollowStats,
  CreateFeedActivity
} from 'wasp/server/operations'
import type { 
  User, 
  UserFollow, 
  FeedActivity,
  Document,
  QuizAttempt
} from 'wasp/entities'
import { ActivityType } from '@prisma/client'

// --- New: Trending / Related / Revise / Search operations ---
import type {
  GetTrending,
  GetRelatedToUserTopics,
  GetReviseList,
  SearchFeedSuggestions,
} from 'wasp/server/operations'

// Follow a user
export const followUser: FollowUser<
  { userId: number },
  { success: boolean; isFollowing: boolean; followersCount: number }
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized')
  }

  const { userId } = args
  const followerId = context.user.id

  // Can't follow yourself
  if (followerId === userId) {
    throw new HttpError(400, 'Cannot follow yourself')
  }

  // Check if target user exists
  const targetUser = await context.entities.User.findUnique({
    where: { id: userId }
  })

  if (!targetUser) {
    throw new HttpError(404, 'User not found')
  }

  // Check if already following
  const existingFollow = await context.entities.UserFollow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId: userId
      }
    }
  })

  if (existingFollow) {
    throw new HttpError(400, 'Already following this user')
  }

  // Create follow relationship
  await context.entities.UserFollow.create({
    data: {
      followerId,
      followingId: userId
    }
  })

  // Create feed activity
  await context.entities.FeedActivity.create({
    data: {
      type: 'FOLLOW_USER',
      userId: followerId,
      data: {
        followedUserId: userId,
        followedUserName: targetUser.name || 'Anonymous User'
      }
    }
  })

  // Get updated followers count
  const followersCount = await context.entities.UserFollow.count({
    where: { followingId: userId }
  })

  return { success: true, isFollowing: true, followersCount }
}

// Unfollow a user
export const unfollowUser: UnfollowUser<
  { userId: number },
  { success: boolean; isFollowing: boolean; followersCount: number }
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized')
  }

  const { userId } = args
  const followerId = context.user.id

  // Find existing follow relationship
  const existingFollow = await context.entities.UserFollow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId: userId
      }
    }
  })

  if (!existingFollow) {
    throw new HttpError(400, 'Not following this user')
  }

  // Remove follow relationship
  await context.entities.UserFollow.delete({
    where: { id: existingFollow.id }
  })

  // Get updated followers count
  const followersCount = await context.entities.UserFollow.count({
    where: { followingId: userId }
  })

  return { success: true, isFollowing: false, followersCount }
}

// Get user's social feed
export const getUserFeed: GetUserFeed<
  { limit?: number; offset?: number },
  {
    activities: Array<FeedActivity & {
      user: Pick<User, 'id' | 'name' | 'avatarUrl'>
      document?: Pick<Document, 'id' | 'title'> | null
      quizAttempt?: Pick<QuizAttempt, 'id' | 'score' | 'totalQuestions'> | null
    }>
    hasMore: boolean
    total: number
  }
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized')
  }

  const { limit = 20, offset = 0 } = args
  const userId = context.user.id

  // Get list of users the current user is following
  const following = await context.entities.UserFollow.findMany({
    where: { followerId: userId },
    select: { followingId: true }
  })

  const followingIds = following.map(f => f.followingId)
  
  // Include current user's activities in their own feed
  const userIds = [...followingIds, userId]

  if (userIds.length === 0) {
    return { activities: [], hasMore: false, total: 0 }
  }

  // Get activities from followed users + own activities
  const activities = await context.entities.FeedActivity.findMany({
    where: {
      userId: { in: userIds }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true
        }
      },
      document: {
        select: {
          id: true,
          title: true
        }
      },
      quizAttempt: {
        select: {
          id: true,
          score: true,
          totalQuestions: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset
  })

  // Get total count for pagination
  const total = await context.entities.FeedActivity.count({
    where: {
      userId: { in: userIds }
    }
  })

  const hasMore = offset + limit < total

  return { activities, hasMore, total }
}

// Get follow suggestions
export const getFollowSuggestions: GetFollowSuggestions<
  { limit?: number },
  Array<User & {
    followersCount: number
    isFollowing: boolean
    mutualFollowsCount: number
    recentActivity?: {
      quizzesCompleted: number
      documentsUploaded: number
    }
  }>
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized')
  }

  const { limit = 10 } = args
  const userId = context.user.id

  // Get users the current user is already following
  const currentFollowing = await context.entities.UserFollow.findMany({
    where: { followerId: userId },
    select: { followingId: true }
  })

  const followingIds = currentFollowing.map(f => f.followingId)

  // Get users with recent activity, excluding current user and already followed users
  const users = await context.entities.User.findMany({
    where: {
      id: {
        not: userId,
        notIn: followingIds
      }
    },
    include: {
      followers: true,
      following: true,
      _count: {
        select: {
          followers: true,
          quizAttempts: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
              }
            }
          },
          documents: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
              }
            }
          }
        }
      }
    },
    take: limit * 2 // Get more to calculate suggestions
  })

  // Calculate suggestion scores and format response
  const suggestions = users.map(user => {
    // Calculate mutual follows
    const userFollowingIds = user.following.map(f => f.followingId)
    const mutualFollowsCount = followingIds.filter(id => userFollowingIds.includes(id)).length

    // Calculate suggestion score based on:
    // - Mutual follows (highest weight)
    // - Recent activity
    // - Follower count (popularity)
    const suggestionScore = 
      (mutualFollowsCount * 10) +
      (user._count.quizAttempts * 2) +
      (user._count.documents * 3) +
      (user._count.followers * 0.1)

    return {
      ...user,
      followersCount: user._count.followers,
      isFollowing: false, // Already filtered out
      mutualFollowsCount,
      recentActivity: {
        quizzesCompleted: user._count.quizAttempts,
        documentsUploaded: user._count.documents
      },
      suggestionScore
    }
  })

  // Sort by suggestion score and return top suggestions
  const topSuggestions = suggestions
    .sort((a, b) => b.suggestionScore - a.suggestionScore)
    .slice(0, limit)
    .map(({ suggestionScore, _count, followers, following, ...user }) => user)

  return topSuggestions
}

// Trending documents based on engagement in recent window
export const getTrending: GetTrending<{ range?: '7d' | '30d' }, Array<{ id: number; title: string; category: string | null; score: number }>> = async (args, context) => {
  const range = args.range || '7d'
  const now = new Date()
  const days = range === '30d' ? 30 : 7
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  // Fetch docs with engagement counts
  const docs = await context.entities.Document.findMany({
    where: { updatedAt: { gte: since } },
    select: {
      id: true,
      title: true,
      category: true,
      likeCount: true,
      commentCount: true,
      viewCount: true,
      shareCount: true,
      updatedAt: true,
      _count: { select: { quizAttempts: true } },
    },
    take: 50,
    orderBy: { updatedAt: 'desc' },
  })

  const scored = docs.map((d) => {
    const ageDays = Math.max(0, (now.getTime() - d.updatedAt.getTime()) / (1000 * 60 * 60 * 24))
    const decay = 1 - Math.min(0.08 * ageDays, 0.9)
    const score = (
      3 * d.likeCount +
      4 * d.commentCount +
      1 * d.viewCount +
      2 * d.shareCount +
      5 * (d._count as any).quizAttempts
    ) * decay
    return { id: d.id, title: d.title, category: d.category, score }
  })

  scored.sort((a, b) => b.score - a.score)
  // De-duplicate by simplistic fairness: cap one per title per 5
  const uniqueByTitle = new Map<string, typeof scored[0]>()
  for (const s of scored) {
    if (!uniqueByTitle.has(s.title)) uniqueByTitle.set(s.title, s)
    if (uniqueByTitle.size >= 10) break
  }
  return Array.from(uniqueByTitle.values())
}

// Related to user's recent topics (up to 5)
export const getRelatedToUserTopics: GetRelatedToUserTopics<{ limit?: number }, Array<{ id: number; title: string; category: string | null }>> = async (args, context) => {
  if (!context.user) throw new HttpError(401, 'Not authorized')
  const limit = args.limit ?? 5
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const recent = await context.entities.QuizAttempt.findMany({
    where: { userId: context.user.id, completedAt: { gte: thirtyDaysAgo } },
    select: { document: { select: { category: true } } },
    distinct: ['documentId'],
    take: 100,
  })
  const cats = Array.from(new Set(recent.map((r) => r.document?.category).filter(Boolean))) as string[]
  if (cats.length === 0) return []

  const docs = await context.entities.Document.findMany({
    where: { category: { in: cats } },
    select: { id: true, title: true, category: true },
    take: limit,
    orderBy: { updatedAt: 'desc' },
  })
  return docs
}

// Revise list from user’s history (errors/older first)
export const getReviseList: GetReviseList<{ limit?: number }, Array<{ attemptId: number; documentId: number; title: string; score: number; createdAt: Date }>> = async (args, context) => {
  if (!context.user) throw new HttpError(401, 'Not authorized')
  const limit = args.limit ?? 5

  const attempts = await context.entities.QuizAttempt.findMany({
    where: { userId: context.user.id },
    select: {
      id: true,
      score: true,
      createdAt: true,
      documentId: true,
      document: { select: { title: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const ranked = attempts
    .map((a) => ({
      attemptId: a.id,
      documentId: a.documentId,
      title: a.document?.title || 'Untitled',
      score: a.score,
      createdAt: a.createdAt,
      weight: (100 - a.score) + Math.min(30, (Date.now() - a.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
    }))
    .sort((x, y) => y.weight - x.weight)
    .slice(0, limit)
    .map(({ weight, ...rest }) => rest)

  return ranked
}

// Typeahead search for followers and quiz names
export const searchFeedSuggestions: SearchFeedSuggestions<{ q: string; limit?: number }, { users: Array<Pick<User, 'id' | 'name' | 'handle' | 'avatarUrl'>>; documents: Array<{ id: number; title: string }> }> = async (args, context) => {
  if (!context.user) throw new HttpError(401, 'Not authorized')
  const q = (args.q || '').trim()
  const limit = args.limit ?? 6
  if (!q) return { users: [], documents: [] }

  // Users that the current user follows matching q
  const following = await context.entities.UserFollow.findMany({
    where: { followerId: context.user.id },
    select: { followingId: true },
    take: 500,
  })
  const followingIds = following.map((f) => f.followingId)

  const users = followingIds.length
    ? await context.entities.User.findMany({
        where: {
          id: { in: followingIds },
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { handle: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, handle: true, avatarUrl: true },
        take: limit,
      })
    : []

  // Documents by title from current user or followed users
  const documents = await context.entities.Document.findMany({
    where: {
      OR: [
        { userId: context.user.id },
        { userId: { in: followingIds } },
      ],
      title: { contains: q, mode: 'insensitive' },
    },
    select: { id: true, title: true },
    take: limit,
  })

  return { users, documents }
}

// Get user follow stats
export const getUserFollowStats: GetUserFollowStats<
  { userId?: number },
  {
    followersCount: number
    followingCount: number
    isFollowing: boolean
    isFollowedBy: boolean
  }
> = async (args, context) => {
  const { userId: targetUserId } = args
  const currentUserId = context.user?.id

  // Default to current user if no userId provided
  const userId = targetUserId || currentUserId

  if (!userId) {
    throw new HttpError(401, 'Not authorized')
  }

  // Get follower and following counts
  const [followersCount, followingCount] = await Promise.all([
    context.entities.UserFollow.count({
      where: { followingId: userId }
    }),
    context.entities.UserFollow.count({
      where: { followerId: userId }
    })
  ])

  let isFollowing = false
  let isFollowedBy = false

  // Check relationship with current user (if different from target user)
  if (currentUserId && currentUserId !== userId) {
    const [followingRelation, followerRelation] = await Promise.all([
      context.entities.UserFollow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: userId
          }
        }
      }),
      context.entities.UserFollow.findUnique({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: currentUserId
          }
        }
      })
    ])

    isFollowing = !!followingRelation
    isFollowedBy = !!followerRelation
  }

  return {
    followersCount,
    followingCount,
    isFollowing,
    isFollowedBy
  }
}

// Create feed activity (helper function for other operations)
export const createFeedActivity: CreateFeedActivity<
  {
    type: ActivityType
    data: any
    documentId?: number
    quizAttemptId?: number
  },
  { success: boolean; activityId: number }
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized')
  }

  const { type, data, documentId, quizAttemptId } = args

  const activity = await context.entities.FeedActivity.create({
    data: {
      type,
      data,
      userId: context.user.id,
      documentId,
      quizAttemptId
    }
  })

  return { success: true, activityId: activity.id }
}
