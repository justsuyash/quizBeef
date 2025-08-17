import type { 
  GetUserAnalytics,
  GetLearningProgress,
  GetPerformanceTrends,
  GetCategoryMetrics,
  GetOptimalLearningTime,
  GetStatsOverview
} from 'wasp/server/operations'
import { HttpError } from 'wasp/server'
import type { GetEnrichedAnalytics } from 'wasp/server/operations'

/**
 * Shared function to calculate user streak consistently across all operations
 */
async function calculateUserStreak(userId: number, context: any) {
  const recentAttempts = await context.entities.QuizAttempt.findMany({
    where: { 
      userId,
      completedAt: { not: null }
    },
    orderBy: { completedAt: 'desc' },
    take: 30,
    select: {
      completedAt: true,
      score: true
    }
  })
  
  // Debug logging
  console.log('🔥 STREAK CALC DEBUG:', {
    userId,
    recentAttemptsCount: recentAttempts.length,
    recentAttempts: recentAttempts.slice(0, 5).map(a => ({
      completedAt: a.completedAt,
      score: a.score
    }))
  })

  let currentStreak = 0
  let bestStreak = 0
  let tempStreak = 0

  // Calculate streaks (consecutive days with quiz activity)
  const today = new Date()
  const recentDays = new Set()
  
  for (const attempt of recentAttempts) {
    if (attempt.completedAt) {
      const attemptDate = new Date(attempt.completedAt).toDateString()
      recentDays.add(attemptDate)
    }
  }

  const sortedDays = Array.from(recentDays).sort((a: any, b: any) => new Date(b).getTime() - new Date(a).getTime())
  
  for (let i = 0; i < sortedDays.length; i++) {
    const daysDiff = Math.floor((today.getTime() - new Date(sortedDays[i] as string).getTime()) / (1000 * 60 * 60 * 24))
    
    if (i === 0 && daysDiff <= 1) {
      currentStreak = 1
      tempStreak = 1
    } else if (daysDiff === i) {
      currentStreak++
      tempStreak++
    } else {
      break
    }
    
    bestStreak = Math.max(bestStreak, tempStreak)
  }

  return { currentStreak, bestStreak }
}

/**
 * Get comprehensive user analytics for dashboard
 */
export const getUserAnalytics: GetUserAnalytics<void, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be authenticated')
  }

  try {
    // Get overall user statistics
    const totalDocuments = await context.entities.Document.count({
      where: { userId: context.user.id }
    })

    const totalQuizAttempts = await context.entities.QuizAttempt.count({
      where: { userId: context.user.id }
    })

    const totalQuestionsAnswered = await context.entities.UserQuestionHistory.count({
      where: { userId: context.user.id }
    })

    const totalCorrectAnswers = await context.entities.UserQuestionHistory.count({
      where: { 
        userId: context.user.id,
        wasCorrect: true
      }
    })

    // Calculate current streak using shared function
    const { currentStreak, bestStreak } = await calculateUserStreak(context.user.id, context)
    
    // Debug logging
    console.log('🔥 STREAK DEBUG - getUserAnalytics:', {
      userId: context.user.id,
      currentStreak,
      bestStreak,
      timestamp: new Date().toISOString()
    })

    // Get average score from recent attempts
    const recentAttempts = await context.entities.QuizAttempt.findMany({
      where: { userId: context.user.id },
      orderBy: { completedAt: 'desc' },
      take: 30,
      select: { score: true }
    })

    const avgScore = recentAttempts.length > 0 
      ? recentAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / recentAttempts.length
      : 0

    // Calculate accuracy rate
    const accuracyRate = totalQuestionsAnswered > 0 
      ? (totalCorrectAnswers / totalQuestionsAnswered) * 100
      : 0

    // Get weekly progress (last 7 days)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const weeklyQuizzes = await context.entities.QuizAttempt.count({
      where: {
        userId: context.user.id,
        completedAt: {
          gte: weekAgo
        }
      }
    })

    const weeklyQuestions = await context.entities.UserQuestionHistory.count({
      where: {
        userId: context.user.id,
        createdAt: {
          gte: weekAgo
        }
      }
    })

    const avgTimeToAnswer = await context.entities.UserQuestionHistory.aggregate({
      where: { 
        userId: context.user.id,
        timeToAnswer: { not: null }
      },
      _avg: {
        timeToAnswer: true
      }
    })

    return {
      totalDocuments,
      totalQuizAttempts,
      totalQuestionsAnswered,
      totalCorrectAnswers,
      accuracyRate: Math.round(accuracyRate * 100) / 100,
      averageScore: Math.round(avgScore * 100) / 100,
      currentStreak,
      bestStreak,
      weeklyQuizzes,
      weeklyQuestions,
      weeklyGrowth: {
        quizzes: weeklyQuizzes,
        questions: weeklyQuestions
      },
      averageLearningSpeed: avgTimeToAnswer._avg.timeToAnswer
    }
  } catch (error) {
    console.error('Error fetching user analytics:', error)
    throw new HttpError(500, 'Failed to fetch analytics')
  }
}

/**
 * Get learning progress data for charts
 */
export const getLearningProgress: GetLearningProgress<void, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be authenticated')
  }

  try {
    // Get daily quiz activity for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const dailyProgress = await context.entities.QuizAttempt.findMany({
      where: {
        userId: context.user.id,
        completedAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        completedAt: true,
        score: true
      },
      orderBy: {
        completedAt: 'asc'
      }
    })

    // Group by date
    const progressByDate: { [key: string]: any } = {}

    for (const attempt of dailyProgress) {
      if (attempt.completedAt) {
        const dateStr = new Date(attempt.completedAt).toISOString().split('T')[0]
        
        if (!progressByDate[dateStr]) {
          progressByDate[dateStr] = {
            date: dateStr,
            quizzes: 0,
            totalScore: 0,
            questionsCorrect: 0,
            questionsTotal: 0,
            easyCorrect: 0,
            mediumCorrect: 0,
            hardCorrect: 0,
            easyTotal: 0,
            mediumTotal: 0,
            hardTotal: 0
          }
        }

        const dayData = progressByDate[dateStr]
        dayData.quizzes++
        dayData.totalScore += attempt.score

        // For now, simplified without question history details
        // Calculate averages
        dayData.averageScore = dayData.totalScore / dayData.quizzes
        dayData.accuracy = 85 // Placeholder until we properly link question history
      }
    }

    return { dailyProgress: Object.values(progressByDate).sort((a: any, b: any) => a.date.localeCompare(b.date)) }
  } catch (error) {
    console.error('Error fetching learning progress:', error)
    throw new HttpError(500, 'Failed to fetch learning progress')
  }
}

/**
 * Get performance trends and insights
 */
export const getPerformanceTrends: GetPerformanceTrends<void, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be authenticated')
  }

  try {
    // Get performance by difficulty over time - simplified for now
    const performanceByDifficulty = [
      { difficulty: 'EASY', accuracy: 85, averageTime: 15, totalQuestions: 45 },
      { difficulty: 'MEDIUM', accuracy: 72, averageTime: 28, totalQuestions: 32 },
      { difficulty: 'HARD', accuracy: 61, averageTime: 45, totalQuestions: 18 }
    ]

    // Get top performing documents
    const documentPerformance = await context.entities.QuizAttempt.findMany({
      where: {
        userId: context.user.id
      },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            sourceType: true
          }
        }
      },
      orderBy: {
        score: 'desc'
      },
      take: 5
    })

    // Get documents that need more practice (lowest avg scores)
    const documentsNeedingPractice = await context.entities.QuizAttempt.groupBy({
      by: ['documentId'],
      where: {
        userId: context.user.id
      },
      _avg: {
        score: true
      },
      _count: {
        _all: true
      },
      having: {
        score: {
          _avg: {
            lt: 80 // Less than 80% average
          }
        }
      },
      orderBy: {
        _avg: {
          score: 'asc'
        }
      },
      take: 5
    })

    // Get the document details for practice recommendations
    const practiceRecommendations: any[] = []
    for (const doc of documentsNeedingPractice) {
      const document = await context.entities.Document.findUnique({
        where: { id: doc.documentId },
        select: {
          id: true,
          title: true,
          sourceType: true,
          _count: {
            select: {
              questions: true
            }
          }
        }
      })
      
      if (document) {
        practiceRecommendations.push({
          ...document,
          averageScore: doc._avg.score,
          attemptCount: doc._count._all
        })
      }
    }

    return {
      difficultyPerformance: performanceByDifficulty,
      topDocuments: documentPerformance.map(attempt => ({
        document: attempt.document,
        score: attempt.score,
        completedAt: attempt.completedAt
      })),
      practiceRecommendations
    }
  } catch (error) {
    console.error('Error fetching performance trends:', error)
    throw new HttpError(500, 'Failed to fetch performance trends')
  }
}

// Phase 1.3: Enriched analytics endpoint
export const getEnrichedAnalytics: GetEnrichedAnalytics<{ userId?: number }, any> = async (args, context) => {
  const userId = args?.userId ?? context.user?.id
  if (!userId) throw new HttpError(401, 'Not authenticated')

  try {
    // Breadth/Depth by category
    const attempts = await context.entities.QuizAttempt.findMany({
      where: { userId },
      include: { document: { select: { category: true } } }
    })

    const byCategory: Record<string, { total: number; score: number }> = {}
    for (const a of attempts) {
      const cat = a.document?.category || 'Uncategorized'
      if (!byCategory[cat]) byCategory[cat] = { total: 0, score: 0 }
      byCategory[cat].total += 1
      byCategory[cat].score += a.score
    }
    const breadth = Object.keys(byCategory).length
    const depth = Object.entries(byCategory).map(([category, agg]) => ({ category, depth: agg.score / agg.total }))

    // Average learning speed
    const speedAgg = await context.entities.UserQuestionHistory.aggregate({
      where: { userId, timeToAnswer: { not: null } },
      _avg: { timeToAnswer: true }
    })

    // Optimal learning time (hour with best avg score)
    const hours: Record<number, { sum: number; c: number }> = {}
    for (const a of attempts) {
      if (!a.completedAt) continue
      const h = new Date(a.completedAt).getHours()
      if (!hours[h]) hours[h] = { sum: 0, c: 0 }
      hours[h].sum += a.score
      hours[h].c += 1
    }
    const optimal = Object.entries(hours).reduce((best, [h, agg]) => {
      const avg = agg.sum / agg.c
      return avg > best.avg ? { hour: Number(h), avg } : best
    }, { hour: -1, avg: -1 })

    return {
      breadth,
      depth,
      averageLearningSpeed: speedAgg._avg.timeToAnswer ?? null,
      optimalHour: optimal.hour
    }
  } catch (e) {
    console.error('getEnrichedAnalytics failed:', e)
    throw new HttpError(500, 'Failed to compute analytics')
  }
}

/**
 * NEW: Get category-based performance metrics
 */
export const getCategoryMetrics: GetCategoryMetrics<void, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be authenticated')
  }

  try {
    const attemptsWithCategory = await context.entities.QuizAttempt.findMany({
      where: {
        userId: context.user.id,
        document: {
          category: { not: null }
        }
      },
      select: {
        score: true,
        document: {
          select: {
            category: true
          }
        }
      }
    })

    const categoryData: { [key: string]: { totalScore: number, count: number } } = {}

    for (const attempt of attemptsWithCategory) {
      const category = attempt.document.category!
      if (!categoryData[category]) {
        categoryData[category] = { totalScore: 0, count: 0 }
      }
      categoryData[category].totalScore += attempt.score
      categoryData[category].count++
    }

    const categoryMetrics = Object.entries(categoryData).map(([category, data]) => ({
      category,
      depth: data.totalScore / data.count, // Average score as depth
      quizzesTaken: data.count
    })).sort((a, b) => b.depth - a.depth)


    return {
      breadth: categoryMetrics.length, // Number of unique categories
      metrics: categoryMetrics
    }
  } catch (error) {
    console.error('Error fetching category metrics:', error)
    throw new HttpError(500, 'Failed to fetch category metrics')
  }
}

/**
 * NEW: Get user's optimal learning time based on performance
 */
export const getOptimalLearningTime: GetOptimalLearningTime<void, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be authenticated')
  }

  try {
    const attempts = await context.entities.QuizAttempt.findMany({
      where: {
        userId: context.user.id,
        completedAt: { not: null }
      },
      select: {
        score: true,
        completedAt: true
      }
    })

    const performanceByHour: { [hour: number]: { totalScore: number, count: number } } = {}

    for (const attempt of attempts) {
      const hour = new Date(attempt.completedAt!).getHours()
      if (!performanceByHour[hour]) {
        performanceByHour[hour] = { totalScore: 0, count: 0 }
      }
      performanceByHour[hour].totalScore += attempt.score
      performanceByHour[hour].count++
    }

    const hourlyAverages = Object.entries(performanceByHour).map(([hour, data]) => ({
      hour: parseInt(hour, 10),
      averageScore: data.totalScore / data.count,
      quizzesTaken: data.count
    }))

    if (hourlyAverages.length === 0) {
      return { optimalTime: 'Not enough data', details: [] }
    }

    const bestHour = hourlyAverages.reduce((prev, current) => (prev.averageScore > current.averageScore) ? prev : current)

    // Format the hour for display
    const formatHour = (h: number) => {
      if (h === 0) return '12 AM'
      if (h < 12) return `${h} AM`
      if (h === 12) return '12 PM'
      return `${h - 12} PM`
    }

    return {
      optimalTime: `${formatHour(bestHour.hour)} - ${formatHour(bestHour.hour + 1)}`,
      details: hourlyAverages.sort((a,b) => a.hour - b.hour)
    }

  } catch (error) {
    console.error('Error fetching optimal learning time:', error)
    throw new HttpError(500, 'Failed to fetch optimal learning time')
  }
}

/**
 * v1.7: Get stats overview for the Stats Pill and analytics
 */
export const getStatsOverview: GetStatsOverview<{ range?: number; periodDays?: number }, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be authenticated')
  }

  try {
    const range = args?.range || 30 // For charts
    const startDate = new Date()
    startDate.setHours(0,0,0,0)
    startDate.setDate(startDate.getDate() - range + 1)
    const prevStartDate = new Date(startDate)
    prevStartDate.setDate(prevStartDate.getDate() - range)
    const prevEndDate = new Date(startDate)
    prevEndDate.setDate(prevEndDate.getDate() - 1)
    prevEndDate.setHours(23, 59, 59, 999) // Include the entire last day

    // Overview KPI period window (optional)
    const periodDays = args?.periodDays
    const periodStart = periodDays && periodDays > 0 ? new Date(new Date().setHours(0,0,0,0)) : null
    if (periodStart && periodDays) {
      periodStart.setDate(periodStart.getDate() - periodDays + 1)
    }
    
    // Calculate previous period: window immediately preceding the current one (works for YTD too)
    let prevPeriodStart: Date | null = null
    let prevPeriodEnd: Date | null = null
    if (periodStart && periodDays) {
      prevPeriodStart = new Date(periodStart)
      prevPeriodEnd = new Date(periodStart)
      prevPeriodStart.setDate(prevPeriodStart.getDate() - periodDays)
      prevPeriodEnd.setDate(prevPeriodEnd.getDate() - 1)
      prevPeriodEnd.setHours(23, 59, 59, 999)
    }
    const nowTs = new Date()

    // Lightweight user fetch for demo assassinsCount via totalBeefWins
    const me = await context.entities.User.findUnique({
      where: { id: context.user.id },
      select: { totalBeefWins: true }
    })

    // All-time totals (for context)
    const totalQuizzes = await context.entities.QuizAttempt.count({ where: { userId: context.user.id } })
    const totalQuestions = await context.entities.UserQuestionHistory.count({ where: { userId: context.user.id } })

    // All-time accuracy
    const correctAnswers = await context.entities.UserQuestionHistory.count({ where: { userId: context.user.id, wasCorrect: true } })
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0

    // Calculate current streak using shared function
    const { currentStreak: streak } = await calculateUserStreak(context.user.id, context)
    
    // Debug logging
    console.log('🔥 STREAK DEBUG - getStatsOverview:', {
      userId: context.user.id,
      streak,
      timestamp: new Date().toISOString()
    })

    // Get medals count (achievements)
    const medalsCount = await context.entities.UserAchievement.count({
      where: { 
        userId: context.user.id,
        isCompleted: true
      }
    })

    // Calculate assassins count (demo): reuse totalBeefWins as a stand-in until rivalry is implemented
    const assassinsCount = me?.totalBeefWins ?? 0

    // Category breadth
    const categories = await context.entities.QuizAttempt.findMany({
      where: { 
        userId: context.user.id,
        document: { category: { not: null } }
      },
      select: { document: { select: { category: true } } },
      distinct: ['documentId']
    })
    const breadth = new Set(categories.map(c => c.document.category)).size

    // Category depth (average performance across categories)
    const categoryPerformance = await context.entities.QuizAttempt.findMany({
      where: { 
        userId: context.user.id,
        document: { category: { not: null } }
      },
      select: { score: true, document: { select: { category: true } } }
    })

    const categoryScores: Record<string, number[]> = {}
    for (const perf of categoryPerformance) {
      const cat = perf.document.category!
      if (!categoryScores[cat]) categoryScores[cat] = []
      categoryScores[cat].push(perf.score)
    }

    const depth = Object.values(categoryScores).length > 0 
      ? Object.values(categoryScores).reduce((sum, scores) => 
          sum + scores.reduce((a, b) => a + b, 0) / scores.length, 0
        ) / Object.values(categoryScores).length
      : 0

    // Average time per question
    const avgTimePerQ = await context.entities.UserQuestionHistory.aggregate({
      where: { 
        userId: context.user.id,
        timeToAnswer: { not: null }
      },
      _avg: { timeToAnswer: true }
    })

    // Generate chart series data (simplified for Phase 1)
    const quizzesOverTime = await context.entities.QuizAttempt.findMany({
      where: {
        userId: context.user.id,
        completedAt: {
          gte: startDate
        }
      },
      select: { completedAt: true },
      orderBy: { completedAt: 'asc' }
    })

    // Current period daily counts (fixed length)
    const dailyQuizzesMap: Record<string, number> = {}
    for (const quiz of quizzesOverTime) {
      if (quiz.completedAt) {
        const dateStr = quiz.completedAt.toISOString().split('T')[0]
        dailyQuizzesMap[dateStr] = (dailyQuizzesMap[dateStr] || 0) + 1
      }
    }
    const quizChartData: { date: string; count: number }[] = []
    const quizPrevCounts: number[] = []
    for (let i = 0; i < range; i++) {
      const d = new Date(startDate)
      d.setDate(startDate.getDate() + i)
      const k = d.toISOString().split('T')[0]
      quizChartData.push({ date: k, count: dailyQuizzesMap[k] || 0 })
    }

    // Previous period daily counts aligned by index
    const prevQuizzes = await context.entities.QuizAttempt.findMany({
      where: {
        userId: context.user.id,
        completedAt: { gte: prevStartDate, lte: prevEndDate }
      },
      select: { completedAt: true }
    })
    const prevDailyMap: Record<string, number> = {}
    for (const qa of prevQuizzes) {
      if (!qa.completedAt) continue
      const k = qa.completedAt.toISOString().split('T')[0]
      prevDailyMap[k] = (prevDailyMap[k] || 0) + 1
    }
    for (let i = 0; i < range; i++) {
      const d = new Date(prevStartDate)
      d.setDate(prevStartDate.getDate() + i)
      const k = d.toISOString().split('T')[0]
      quizPrevCounts.push(prevDailyMap[k] || 0)
    }

    // Topics over time (using categories as topics)
    const topicsOverTime = await context.entities.QuizAttempt.findMany({
      where: {
        userId: context.user.id,
        completedAt: {
          gte: startDate
        },
        document: { category: { not: null } }
      },
      select: { 
        completedAt: true,
        document: { select: { category: true } }
      },
      orderBy: { completedAt: 'asc' }
    })

    const dailyTopicsMap: Record<string, Set<string>> = {}
    for (const topic of topicsOverTime) {
      if (topic.completedAt && topic.document.category) {
        const dateStr = topic.completedAt.toISOString().split('T')[0]
        if (!dailyTopicsMap[dateStr]) dailyTopicsMap[dateStr] = new Set()
        dailyTopicsMap[dateStr].add(topic.document.category)
      }
    }
    const topicsChartData: { date: string; count: number }[] = []
    const topicsPrevCounts: number[] = []
    for (let i = 0; i < range; i++) {
      const d = new Date(startDate)
      d.setDate(startDate.getDate() + i)
      const k = d.toISOString().split('T')[0]
      topicsChartData.push({ date: k, count: (dailyTopicsMap[k]?.size || 0) })
    }

    const prevTopics = await context.entities.QuizAttempt.findMany({
      where: {
        userId: context.user.id,
        completedAt: { gte: prevStartDate, lte: prevEndDate },
        document: { category: { not: null } }
      },
      select: { completedAt: true, document: { select: { category: true } } }
    })
    const prevTopicsMap: Record<string, Set<string>> = {}
    for (const t of prevTopics) {
      if (!t.completedAt || !t.document.category) continue
      const k = t.completedAt.toISOString().split('T')[0]
      if (!prevTopicsMap[k]) prevTopicsMap[k] = new Set()
      prevTopicsMap[k].add(t.document.category)
    }
    for (let i = 0; i < range; i++) {
      const d = new Date(prevStartDate)
      d.setDate(prevStartDate.getDate() + i)
      const k = d.toISOString().split('T')[0]
      topicsPrevCounts.push(prevTopicsMap[k]?.size || 0)
    }

    // Build KPI windows if requested
    let kpi: any = null
    let kpiPrev: any = null
    if (periodStart) {
      const pQuizzes = await context.entities.QuizAttempt.count({ where: { userId: context.user.id, completedAt: { gte: periodStart, lte: nowTs } } })
      const pQAgg = await context.entities.UserQuestionHistory.aggregate({ where: { userId: context.user.id, createdAt: { gte: periodStart, lte: nowTs } }, _count: { _all: true } })
      const pCorrect = await context.entities.UserQuestionHistory.count({ where: { userId: context.user.id, createdAt: { gte: periodStart, lte: nowTs }, wasCorrect: true } })
      const pAcc = pQAgg._count._all > 0 ? (pCorrect / pQAgg._count._all) * 100 : 0
      const pCats = await context.entities.QuizAttempt.findMany({ where: { userId: context.user.id, completedAt: { gte: periodStart, lte: nowTs }, document: { category: { not: null } } }, select: { document: { select: { category: true } } }, distinct: ['documentId'] })
      const pBreadth = new Set(pCats.map(c => c.document.category)).size
      const pAvg = await context.entities.UserQuestionHistory.aggregate({ where: { userId: context.user.id, createdAt: { gte: periodStart, lte: nowTs }, timeToAnswer: { not: null } }, _avg: { timeToAnswer: true } })
      kpi = { quizzes: pQuizzes, questions: pQAgg._count._all, accuracy: pAcc, breadth: pBreadth, avgTimePerQ: pAvg._avg.timeToAnswer || 0 }

      if (prevPeriodStart && prevPeriodEnd) {
        const pvQuizzes = await context.entities.QuizAttempt.count({ where: { userId: context.user.id, completedAt: { gte: prevPeriodStart, lte: prevPeriodEnd } } })
        const pvQAgg = await context.entities.UserQuestionHistory.aggregate({ where: { userId: context.user.id, createdAt: { gte: prevPeriodStart, lte: prevPeriodEnd } }, _count: { _all: true } })
        const pvCorrect = await context.entities.UserQuestionHistory.count({ where: { userId: context.user.id, createdAt: { gte: prevPeriodStart, lte: prevPeriodEnd }, wasCorrect: true } })
        const pvAcc = pvQAgg._count._all > 0 ? (pvCorrect / pvQAgg._count._all) * 100 : 0
        const pvCats = await context.entities.QuizAttempt.findMany({ where: { userId: context.user.id, completedAt: { gte: prevPeriodStart, lte: prevPeriodEnd }, document: { category: { not: null } } }, select: { document: { select: { category: true } } }, distinct: ['documentId'] })
        const pvBreadth = new Set(pvCats.map(c => c.document.category)).size
        const pvAvg = await context.entities.UserQuestionHistory.aggregate({ where: { userId: context.user.id, createdAt: { gte: prevPeriodStart, lte: prevPeriodEnd }, timeToAnswer: { not: null } }, _avg: { timeToAnswer: true } })
        kpiPrev = { quizzes: pvQuizzes, questions: pvQAgg._count._all, accuracy: pvAcc, breadth: pvBreadth, avgTimePerQ: pvAvg._avg.timeToAnswer || 0 }
      }
    }

    // Build daily accuracy and QPM series
    const perDayAccuracy: { date: string; acc: number }[] = []
    const perDayQpm: { date: string; qpm: number }[] = []
    for (const item of quizChartData) {
      const dayStart = new Date(item.date)
      const dayEnd = new Date(item.date)
      dayEnd.setDate(dayEnd.getDate() + 1)
      const answers = await context.entities.UserQuestionHistory.findMany({
        where: { userId: context.user.id, createdAt: { gte: dayStart, lt: dayEnd } },
        select: { wasCorrect: true, timeToAnswer: true }
      })
      if (answers.length === 0) {
        perDayAccuracy.push({ date: item.date, acc: 0 })
        perDayQpm.push({ date: item.date, qpm: 0 })
      } else {
        const correct = answers.filter(a => a.wasCorrect).length
        const acc = Math.round((correct / answers.length) * 100)
        const avgMs = answers.reduce((s, a) => s + (a.timeToAnswer || 0), 0) / answers.length
        const qpm = avgMs > 0 ? +(60000 / avgMs).toFixed(2) : 0
        perDayAccuracy.push({ date: item.date, acc })
        perDayQpm.push({ date: item.date, qpm })
      }
    }

    // QLO over time for the selected range
    // Compute endDate for range upper bound
    const endDate = new Date()
    endDate.setHours(23,59,59,999)
    const qloHistory = await (context.entities as any).QloHistory.findMany({
      where: { userId: context.user.id, changedAt: { gte: startDate, lte: endDate } },
      orderBy: { changedAt: 'asc' }
    })
    const eloOverTime = qloHistory.map((e: any) => ({ date: e.changedAt.toISOString().split('T')[0], value: e.qlo }))

    return {
      periodDays,
      totals: { totalQuizzes, totalQuestions },
      accuracy: Math.round(accuracy * 100) / 100,
      streak,
      medalsCount,
      assassinsCount,
      breadth,
      depth: Math.round(depth * 100) / 100,
      avgTimePerQ: avgTimePerQ._avg.timeToAnswer || 0,
      kpi,
      kpiPrev,
      series: {
        quizzesOverTime: quizChartData,
        quizzesOverTimePrev: quizPrevCounts,
        topicsOverTime: topicsChartData,
        topicsOverTimePrev: topicsPrevCounts,
        eloOverTime,
        accuracyOverTime: perDayAccuracy,
        qpmOverTime: perDayQpm,
        beefsOverTime: [], // TODO: Implement from BeefChallenge
        assassinsOverTime: [], // TODO: Implement
        activityHeatmap: [], // TODO: Implement
        categoryDonuts: [], // TODO: Implement
        subCategoryBars: [], // TODO: Implement
        assassinsDonut: [] // TODO: Implement
      }
    }
  } catch (error) {
    console.error('Error fetching stats overview:', error)
    throw new HttpError(500, 'Failed to fetch stats overview')
  }
}
