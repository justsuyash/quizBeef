import type { 
  GetUserAnalytics,
  GetLearningProgress,
  GetPerformanceTrends,
  GetCategoryMetrics,
  GetOptimalLearningTime
} from 'wasp/server/operations'
import { HttpError } from 'wasp/server'

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

    // Calculate current streak
    const recentAttempts = await context.entities.QuizAttempt.findMany({
      where: { userId: context.user.id },
      orderBy: { completedAt: 'desc' },
      take: 30,
      select: {
        completedAt: true,
        score: true
      }
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

    // Get average score
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

    return Object.values(progressByDate).sort((a: any, b: any) => a.date.localeCompare(b.date))
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
