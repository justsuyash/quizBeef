import { 
  type GrantAchievement, 
  type CheckAchievements, 
  type GetUserAchievements, 
  type GetAllAchievements,
  type SeedAchievements 
} from 'wasp/server/operations'
import { HttpError } from 'wasp/server'
import { AchievementCategory, AchievementRarity } from '@prisma/client'

/**
 * Grant an achievement to a user
 */
export const grantAchievement: GrantAchievement<
  { userId: number; achievementKey: string; unlockData?: any },
  { success: boolean; achievement?: any; alreadyUnlocked?: boolean }
> = async (args, context) => {
  const { userId, achievementKey, unlockData } = args

  try {
    // Find the achievement by key
    const achievement = await context.entities.Achievement.findUnique({
      where: { key: achievementKey, isActive: true }
    })

    if (!achievement) {
      console.warn(`Achievement with key ${achievementKey} not found or inactive`)
      return { success: false }
    }

    // Check if user already has this achievement
    const existingUserAchievement = await context.entities.UserAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id
        }
      }
    })

    if (existingUserAchievement) {
      return { 
        success: true, 
        achievement, 
        alreadyUnlocked: true 
      }
    }

    // Grant the achievement
    const userAchievement = await context.entities.UserAchievement.create({
      data: {
        userId,
        achievementId: achievement.id,
        unlockData: unlockData || {},
        isCompleted: true,
        currentProgress: 1
      },
      include: {
        achievement: true
      }
    })

    console.log(`🏆 Achievement unlocked: ${achievement.name} for user ${userId}`)

    return {
      success: true,
      achievement: userAchievement.achievement,
      alreadyUnlocked: false
    }

  } catch (error) {
    console.error('Error granting achievement:', error)
    return { success: false }
  }
}

/**
 * Check and award applicable achievements for a user based on their current activity
 */
export const checkAchievements: CheckAchievements<
  { userId: number; triggerType: string; triggerData?: any },
  { achievementsGranted: string[] }
> = async (args, context) => {
  const { userId, triggerType, triggerData } = args

  try {
    const achievementsGranted: string[] = []

    // Get user's current quiz attempts and beef participations for checking criteria
    const userStats = await getUserStats(userId, context)

    // Get all active achievements
    const achievements = await context.entities.Achievement.findMany({
      where: { isActive: true }
    })

    // Check each achievement against current user stats
    for (const achievement of achievements) {
      const shouldGrant = await checkAchievementCriteria(
        achievement, 
        userStats, 
        triggerType, 
        triggerData
      )

      if (shouldGrant) {
        const result = await grantAchievement({
          userId,
          achievementKey: achievement.key,
          unlockData: { trigger: triggerType, ...triggerData }
        }, context)

        if (result.success && !result.alreadyUnlocked) {
          achievementsGranted.push(achievement.key)
        }
      }
    }

    return { achievementsGranted }

  } catch (error) {
    console.error('Error checking achievements:', error)
    return { achievementsGranted: [] }
  }
}

/**
 * Get all achievements for a user (both unlocked and locked)
 */
export const getUserAchievements: GetUserAchievements<
  { userId?: number },
  any
> = async (args, context) => {
  if (!context.user && !args.userId) {
    throw new HttpError(401, 'User must be authenticated')
  }

  const targetUserId = args.userId || context.user!.id

  try {
    // Get all achievements
    const allAchievements = await context.entities.Achievement.findMany({
      where: { isActive: true },
      orderBy: [
        { category: 'asc' },
        { rarity: 'asc' },
        { name: 'asc' }
      ]
    })

    // Get user's unlocked achievements
    const userAchievements = await context.entities.UserAchievement.findMany({
      where: { userId: targetUserId },
      include: { achievement: true }
    })

    // Create a map for quick lookup
    const unlockedMap = new Map(
      userAchievements.map(ua => [ua.achievementId, ua])
    )

    // Combine data
    const achievements = allAchievements.map(achievement => ({
      ...achievement,
      isUnlocked: unlockedMap.has(achievement.id),
      unlockedAt: unlockedMap.get(achievement.id)?.unlockedAt,
      unlockData: unlockedMap.get(achievement.id)?.unlockData
    }))

    return {
      achievements,
      totalCount: allAchievements.length,
      unlockedCount: userAchievements.length
    }

  } catch (error) {
    console.error('Error getting user achievements:', error)
    throw new HttpError(500, 'Failed to fetch achievements')
  }
}

/**
 * Get all available achievements (admin/system use)
 */
export const getAllAchievements: GetAllAchievements<void, any> = async (args, context) => {
  try {
    const achievements = await context.entities.Achievement.findMany({
      orderBy: [
        { category: 'asc' },
        { rarity: 'asc' },
        { name: 'asc' }
      ]
    })

    return { achievements }

  } catch (error) {
    console.error('Error getting all achievements:', error)
    throw new HttpError(500, 'Failed to fetch achievements')
  }
}

/**
 * Seed initial achievements (for development/setup)
 */
export const seedAchievements: SeedAchievements<{}, { created: number }> = async (args, context) => {
  try {
    const existingCount = await context.entities.Achievement.count()
    
    if (existingCount > 0) {
      console.log('Achievements already seeded, skipping...')
      return { created: 0 }
    }

    const achievements = [
      // Quiz Category
      {
        key: 'FIRST_QUIZ_COMPLETED',
        name: 'Quiz Rookie',
        description: 'Complete your first quiz',
        category: 'QUIZ' as AchievementCategory,
        iconName: 'graduation-cap',
        iconColor: '#10B981',
        rarity: 'COMMON' as AchievementRarity,
        criteria: { type: 'QUIZ_COUNT', target: 1 },
        pointsReward: 10
      },
      {
        key: 'QUIZ_PERFECTIONIST',
        name: 'Perfectionist',
        description: 'Score 100% on a quiz',
        category: 'QUIZ' as AchievementCategory,
        iconName: 'star',
        iconColor: '#F59E0B',
        rarity: 'UNCOMMON' as AchievementRarity,
        criteria: { type: 'PERFECT_SCORE', target: 1 },
        pointsReward: 25
      },
      {
        key: 'QUIZ_MASTER_100',
        name: 'Quiz Master',
        description: 'Complete 100 quizzes',
        category: 'QUIZ' as AchievementCategory,
        iconName: 'trophy',
        iconColor: '#8B5CF6',
        rarity: 'RARE' as AchievementRarity,
        criteria: { type: 'QUIZ_COUNT', target: 100 },
        pointsReward: 100
      },

      // Beef Category
      {
        key: 'FIRST_BEEF_WON',
        name: 'Beef Champion',
        description: 'Win your first Beef challenge',
        category: 'BEEF' as AchievementCategory,
        iconName: 'sword',
        iconColor: '#EF4444',
        rarity: 'UNCOMMON' as AchievementRarity,
        criteria: { type: 'BEEF_WINS', target: 1 },
        pointsReward: 50
      },
      {
        key: 'BEEF_STREAK_5',
        name: 'Beef Streak',
        description: 'Win 5 Beef challenges in a row',
        category: 'BEEF' as AchievementCategory,
        iconName: 'flame',
        iconColor: '#F97316',
        rarity: 'RARE' as AchievementRarity,
        criteria: { type: 'BEEF_WIN_STREAK', target: 5 },
        pointsReward: 150
      },

      // Learning Category  
      {
        key: 'SPEED_DEMON',
        name: 'Speed Demon',
        description: 'Complete a quiz in under 30 seconds',
        category: 'LEARNING' as AchievementCategory,
        iconName: 'zap',
        iconColor: '#06B6D4',
        rarity: 'UNCOMMON' as AchievementRarity,
        criteria: { type: 'QUIZ_TIME', target: 30, operator: 'less_than' },
        pointsReward: 30
      },

      // Streak Category
      {
        key: 'DAILY_STREAK_7',
        name: 'Week Warrior',
        description: 'Maintain a 7-day activity streak',
        category: 'STREAK' as AchievementCategory,
        iconName: 'calendar',
        iconColor: '#84CC16',
        rarity: 'UNCOMMON' as AchievementRarity,
        criteria: { type: 'DAILY_STREAK', target: 7 },
        pointsReward: 75
      },

      // Collection Category
      {
        key: 'FIRST_DOCUMENT_UPLOADED',
        name: 'Content Creator',
        description: 'Upload your first document',
        category: 'COLLECTION' as AchievementCategory,
        iconName: 'upload',
        iconColor: '#6366F1',
        rarity: 'COMMON' as AchievementRarity,
        criteria: { type: 'DOCUMENT_COUNT', target: 1 },
        pointsReward: 15
      },
      {
        key: 'FOLDER_ORGANIZER',
        name: 'Organizer',
        description: 'Create your first folder',
        category: 'COLLECTION' as AchievementCategory,
        iconName: 'folder',
        iconColor: '#8B5CF6',
        rarity: 'COMMON' as AchievementRarity,
        criteria: { type: 'FOLDER_COUNT', target: 1 },
        pointsReward: 10
      },

      // Special Category
      {
        key: 'EARLY_ADOPTER',
        name: 'Early Adopter',
        description: 'One of the first 100 users',
        category: 'SPECIAL' as AchievementCategory,
        iconName: 'sparkles',
        iconColor: '#EC4899',
        rarity: 'LEGENDARY' as AchievementRarity,
        criteria: { type: 'USER_ID', target: 100, operator: 'less_than_or_equal' },
        pointsReward: 500,
        isHidden: true
      }
    ]

    let created = 0
    for (const achievementData of achievements) {
      try {
        await context.entities.Achievement.create({
          data: achievementData
        })
        created++
      } catch (error) {
        console.error(`Failed to create achievement ${achievementData.key}:`, error)
      }
    }

    console.log(`✅ Seeded ${created} achievements`)
    return { created }

  } catch (error) {
    console.error('Error seeding achievements:', error)
    throw new HttpError(500, 'Failed to seed achievements')
  }
}

// Helper Functions

async function getUserStats(userId: number, context: any) {
  const [quizAttempts, beefParticipations, documents, folders, correctHistory] = await Promise.all([
    context.entities.QuizAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    }),
    context.entities.BeefParticipant.findMany({
      where: { userId },
      include: { challenge: true }
    }),
    context.entities.Document.count({ where: { userId } }),
    context.entities.Folder.count({ where: { userId } }),
    context.entities.UserQuestionHistory.findMany({
      where: { userId, wasCorrect: true },
      include: { question: { select: { difficulty: true } } }
    })
  ])

  // Compute beef wins by position
  const beefWins = beefParticipations.filter(bp => bp.position === 1).length

  // Daily streak calculation (based on quiz attempts and beef activity days)
  const daySet = new Set<string>()
  quizAttempts.forEach((qa: any) => daySet.add(new Date(qa.createdAt).toISOString().slice(0,10)))
  beefParticipations.forEach((bp: any) => {
    if (bp.challenge?.createdAt) {
      daySet.add(new Date(bp.challenge.createdAt).toISOString().slice(0,10))
    }
  })
  let dailyStreakDays = 0
  const today = new Date()
  for (let i = 0; ; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toISOString().slice(0,10)
    if (daySet.has(key)) {
      dailyStreakDays++
    } else {
      break
    }
  }

  // Difficulty-based correct counts
  const hardCorrect = correctHistory.filter((h: any) => h.question?.difficulty === 'HARD').length

  return {
    quizCount: quizAttempts.length,
    perfectScores: quizAttempts.filter(qa => qa.score === qa.totalQuestions).length,
    fastestQuiz: Math.min(...quizAttempts.map(qa => qa.timeSpent)),
    beefWins,
    documentCount: documents,
    folderCount: folders,
    dailyStreakDays,
    hardCorrect,
    userId
  }
}

async function checkAchievementCriteria(
  achievement: any, 
  userStats: any, 
  triggerType: string, 
  triggerData: any
): Promise<boolean> {
  const criteria = achievement.criteria as any

  switch (criteria.type) {
    case 'QUIZ_COUNT':
      return userStats.quizCount >= criteria.target

    case 'PERFECT_SCORE':
      return userStats.perfectScores >= criteria.target

    case 'QUIZ_TIME':
      if (criteria.operator === 'less_than') {
        return triggerType === 'QUIZ_COMPLETED' && 
               triggerData?.timeSpent && 
               triggerData.timeSpent < criteria.target * 1000 // Convert to milliseconds
      }
      return false

    case 'BEEF_WINS':
      return userStats.beefWins >= criteria.target

    case 'DOCUMENT_COUNT':
      return userStats.documentCount >= criteria.target

    case 'FOLDER_COUNT':
      return userStats.folderCount >= criteria.target

    case 'USER_ID':
      if (criteria.operator === 'less_than_or_equal') {
        return userStats.userId <= criteria.target
      }
      return false

    case 'DAILY_STREAK':
      return userStats.dailyStreakDays >= criteria.target

    case 'HARD_CORRECT':
      return userStats.hardCorrect >= criteria.target

    default:
      return false
  }
}
