import { type StartQuiz, type SubmitQuizAnswer, type CompleteQuiz, type GetQuizAttempt, type GetQuizHistory, type GetPlaySuggestions, type StartRandomQuiz, type StartCategoryPractice } from 'wasp/server/operations'

export interface QuizSettings {
  [key: string]: any  // Add index signature for SuperJSON compatibility
  questionCount: number
  difficultyDistribution: {
    easy: number    // percentage 0-100
    medium: number  // percentage 0-100  
    hard: number    // percentage 0-100
  }
  timeLimit?: number // minutes, optional
}

/**
 * Start a new quiz attempt with custom settings
 */
export const startQuiz: StartQuiz<
  {
    documentId: number
    settings: QuizSettings
  },
  any
> = async (args, context) => {
  if (!context.user) {
    throw new Error('User must be authenticated')
  }

  const { documentId, settings } = args

  try {
    // Verify user owns the document
    const document = await context.entities.Document.findUnique({
      where: { 
        id: documentId,
        userId: context.user.id
      }
    })

    if (!document) {
      throw new Error('Document not found or access denied')
    }

    // Get available questions for this document
    const allQuestions = await context.entities.Question.findMany({
      where: { documentId },
      include: {
        answers: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    })

    if (allQuestions.length === 0) {
      throw new Error('No questions available for this document. Please generate questions first.')
    }

    // Select questions based on difficulty distribution
    const selectedQuestions = selectQuestionsByDifficulty(allQuestions, settings)
    
    if (selectedQuestions.length === 0) {
      throw new Error('No questions match the selected difficulty criteria')
    }

    // Create quiz attempt
    const quizAttempt = await context.entities.QuizAttempt.create({
      data: {
        score: 0,
        totalQuestions: selectedQuestions.length,
        correctAnswers: 0,
        timeSpent: 0,
        quizMode: 'PRACTICE',
        userId: context.user.id,
        documentId,
        completedAt: null // Will be set when quiz is completed
      }
    })

    // Create user question history entries for selected questions
    for (const question of selectedQuestions) {
      await context.entities.UserQuestionHistory.create({
        data: {
          wasCorrect: false, // Will be updated when answered
          timeSpent: 0,
          selectedAnswerId: null,
          confidenceLevel: null,
          userId: context.user.id,
          questionId: question.id,
          quizAttemptId: quizAttempt.id
        }
      })
    }

    return {
      success: true,
      quizAttemptId: quizAttempt.id,
      questionCount: selectedQuestions.length,
      documentTitle: document.title,
      timeLimit: settings.timeLimit,
      questions: selectedQuestions.map(q => ({
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        difficulty: q.difficulty,
        answers: q.answers.map(a => ({
          id: a.id,
          answerText: a.answerText,
          orderIndex: a.orderIndex
          // Note: not sending isCorrect to prevent cheating
        }))
      }))
    }

  } catch (error) {
    console.error('Error starting quiz:', error)
    throw new Error(`Failed to start quiz: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Submit an answer for a quiz question
 */
export const submitQuizAnswer: SubmitQuizAnswer<
  {
    quizAttemptId: number
    questionId: number
    selectedAnswerId: number
    timeSpent: number
    confidenceLevel?: number
  },
  any
> = async (args, context) => {
  if (!context.user) {
    throw new Error('User must be authenticated')
  }

  const { quizAttemptId, questionId, selectedAnswerId, timeSpent, confidenceLevel } = args

  try {
    // Verify quiz attempt belongs to user
    const quizAttempt = await context.entities.QuizAttempt.findUnique({
      where: { 
        id: quizAttemptId,
        userId: context.user.id
      }
    })

    if (!quizAttempt || quizAttempt.completedAt) {
      throw new Error('Quiz attempt not found or already completed')
    }

    // Get the selected answer and the question with all answers
    const answer = await context.entities.Answer.findUnique({
      where: { id: selectedAnswerId }
    })

    const questionWithAnswers = await context.entities.Question.findUnique({
      where: { id: questionId },
      include: {
        answers: true
      }
    })

    if (!answer || !questionWithAnswers || answer.questionId !== questionId) {
      throw new Error('Invalid answer selection')
    }

    const isCorrect = answer.isCorrect
    const correctAnswer = questionWithAnswers.answers.find(a => a.isCorrect)

    // Update user question history
    await context.entities.UserQuestionHistory.updateMany({
      where: {
        quizAttemptId,
        questionId,
        userId: context.user.id
      },
      data: {
        wasCorrect: isCorrect,
        timeSpent,
        selectedAnswerId,
        confidenceLevel
      }
    })

    // Update question statistics
    await context.entities.Question.update({
      where: { id: questionId },
      data: {
        timesAsked: { increment: 1 }
      }
    })

    const result = {
      success: true,
      isCorrect,
      correctAnswerId: correctAnswer?.id,
      explanation: answer.explanation
    }

  } catch (error) {
    console.error('Error submitting quiz answer:', error)
    throw new Error(`Failed to submit answer: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Complete a quiz and calculate final results
 */
export const completeQuiz: CompleteQuiz<
  {
    quizAttemptId: number
    totalTimeSpent?: number
    bonusPoints?: number
    perfectStreak?: number
    averageConfidence?: number
  },
  any
> = async (args, context) => {
  if (!context.user) {
    throw new Error('User must be authenticated')
  }

  const { 
    quizAttemptId, 
    totalTimeSpent = 0, 
    bonusPoints = 0, 
    perfectStreak = 0, 
    averageConfidence 
  } = args

  try {
    // Get quiz attempt and question history
    const quizAttempt = await context.entities.QuizAttempt.findUnique({
      where: { 
        id: quizAttemptId,
        userId: context.user.id
      },
      include: {
        questionHistory: {
          include: {
            question: true
          }
        },
        document: true
      }
    })

    if (!quizAttempt || quizAttempt.completedAt) {
      throw new Error('Quiz attempt not found or already completed')
    }

    // Calculate results
    const correctAnswers = quizAttempt.questionHistory.filter(h => h.wasCorrect).length
    const totalQuestions = quizAttempt.questionHistory.length
    const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0

    // Update quiz attempt with final results
    const completedQuiz = await context.entities.QuizAttempt.update({
      where: { id: quizAttemptId },
      data: {
        score,
        correctAnswers,
        totalQuestions,
        timeSpent: totalTimeSpent,
        bonusPoints,
        longestStreak: perfectStreak,
        averageConfidence,
        completedAt: new Date()
      }
    })

    // Update question correct rates
    for (const history of quizAttempt.questionHistory) {
      const allAnswers = await context.entities.UserQuestionHistory.findMany({
        where: { questionId: history.questionId }
      })

      const correctAnswers = allAnswers.filter(a => a.wasCorrect).length
      const totalAnswers = allAnswers.length
      const correctRate = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0

      await context.entities.Question.update({
        where: { id: history.questionId },
        data: { correctRate }
      })
    }

    // Update QLO based on performance and diversification
    try {
      const user = await context.entities.User.findUnique({ where: { id: context.user.id } })
      if (user) {
        const K = 24
        const expected = 0.6 // baseline expectation
        const deltaBase = K * ((score / 100) - expected)

        // Diversification bonus: first few sessions in a category grant extra, then decay
        const category = quizAttempt.document?.category
        let bonus = 0
        if (category) {
          const playsInTopic = await context.entities.QuizAttempt.count({
            where: {
              userId: context.user.id,
              document: { category },
              completedAt: { not: null }
            }
          })
          const B = 25
          const seen = Math.max(0, playsInTopic - 1)
          bonus = B / Math.max(1, Math.log(1 + seen + 1)) // slowly diminishing
          // Require meaningful quiz length
          if (totalQuestions < 5) bonus *= 0.5
        }

        const newQlo = Math.max(0, Math.round((user.qlo ?? 5000) + deltaBase + bonus))
        await context.entities.User.update({ where: { id: context.user.id }, data: { qlo: newQlo } })
        try {
          await (context.entities as any).QloHistory.create({ data: { userId: context.user.id, qlo: newQlo, changedAt: new Date(), source: 'quiz', note: category || undefined } })
        } catch {}
      }
    } catch (e) {
      console.warn('QLO update after quiz failed:', e)
    }

    // After completing the quiz, check for achievements
    try {
      await (async () => {
        const triggerData: any = {
          timeSpent: totalTimeSpent,
          score,
          totalQuestions,
          documentId: quizAttempt.document.id
        }
        // Use the achievements checker if available
        // Import lazily to avoid circular deps at build time
        const { checkAchievements } = await import('../achievements/operations')
        // Call with context by binding since our ops expect (args, context)
        await checkAchievements({
          userId: context.user!.id,
          triggerType: 'QUIZ_COMPLETED',
          triggerData
        }, context as any)
      })()
    } catch (achErr) {
      console.warn('Achievement check failed after quiz completion:', achErr)
    }

    // Emit a lightweight stats refresh for this user (SSE)
    try {
      const { emitStatsUpdate } = await import('../../server/events/stats')
      emitStatsUpdate(context.user.id, { type: 'quiz_completed' })
    } catch (e) {
      // Non-fatal if events module not available
    }

    return {
      success: true,
      score,
      correctAnswers,
      totalQuestions,
      timeSpent: totalTimeSpent,
      grade: getGradeFromScore(score),
      documentTitle: quizAttempt.document.title,
      performance: {
        byDifficulty: calculatePerformanceByDifficulty(quizAttempt.questionHistory),
        averageTimePerQuestion: totalTimeSpent / totalQuestions,
        confidenceAccuracy: calculateConfidenceAccuracy(quizAttempt.questionHistory)
      }
    }

  } catch (error) {
    console.error('Error completing quiz:', error)
    throw new Error(`Failed to complete quiz: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get a specific quiz attempt for review/replay
 */
export const getQuizAttempt: GetQuizAttempt<
  { quizAttemptId: number },
  any
> = async (args, context) => {
  if (!context.user) {
    throw new Error('User must be authenticated')
  }

  try {
    const quizAttempt = await context.entities.QuizAttempt.findUnique({
      where: { 
        id: args.quizAttemptId,
        userId: context.user.id
      },
      include: {
        document: true,
        questionHistory: {
          include: {
            question: {
              include: {
                answers: {
                  orderBy: { orderIndex: 'asc' }
                }
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!quizAttempt) {
      throw new Error('Quiz attempt not found')
    }

    return {
      id: quizAttempt.id,
      score: quizAttempt.score,
      correctAnswers: quizAttempt.correctAnswers,
      totalQuestions: quizAttempt.totalQuestions,
      timeSpent: quizAttempt.timeSpent,
      completedAt: quizAttempt.completedAt,
      document: {
        id: quizAttempt.document.id,
        title: quizAttempt.document.title
      },
      questions: quizAttempt.questionHistory.map(h => ({
        id: h.question.id,
        questionText: h.question.questionText,
        questionType: h.question.questionType,
        difficulty: h.question.difficulty,
        userAnswer: h.selectedAnswerId,
        wasCorrect: h.wasCorrect,
        timeSpent: h.timeSpent,
        confidenceLevel: h.confidenceLevel,
        answers: h.question.answers.map(a => ({
          id: a.id,
          answerText: a.answerText,
          isCorrect: a.isCorrect,
          explanation: a.explanation,
          orderIndex: a.orderIndex
        }))
      }))
    }

  } catch (error) {
    console.error('Error fetching quiz attempt:', error)
    throw new Error('Failed to fetch quiz attempt')
  }
}

/**
 * Get user's quiz history
 */
export const getQuizHistory: GetQuizHistory<void, any> = async (args, context) => {
  if (!context.user) {
    throw new Error('User must be authenticated')
  }

  try {
    const quizAttempts = await context.entities.QuizAttempt.findMany({
      where: { 
        userId: context.user.id,
        completedAt: { not: null }
      },
      include: {
        document: true,
        _count: {
          select: {
            questionHistory: true
          }
        }
      },
      orderBy: { completedAt: 'desc' }
    })

    return quizAttempts.map(attempt => ({
      id: attempt.id,
      documentId: attempt.documentId,
      documentTitle: attempt.document.title,
      score: attempt.score,
      correctAnswers: attempt.correctAnswers,
      totalQuestions: attempt.totalQuestions,
      timeSpent: attempt.timeSpent,
      completedAt: attempt.completedAt,
      grade: getGradeFromScore(attempt.score),
      questionCount: attempt._count.questionHistory
    }))

  } catch (error) {
    console.error('Error fetching quiz history:', error)
    throw new Error('Failed to fetch quiz history')
  }
}

// Helper functions

function selectQuestionsByDifficulty(questions: any[], settings: QuizSettings) {
  const { questionCount, difficultyDistribution } = settings
  
  // Group questions by difficulty
  const questionsByDifficulty = {
    EASY: questions.filter(q => q.difficulty === 'EASY'),
    MEDIUM: questions.filter(q => q.difficulty === 'MEDIUM'),
    HARD: questions.filter(q => q.difficulty === 'HARD')
  }

  const selected: any[] = []
  
  // Calculate how many questions of each difficulty to select
  const easyCount = Math.round((difficultyDistribution.easy / 100) * questionCount)
  const mediumCount = Math.round((difficultyDistribution.medium / 100) * questionCount)
  const hardCount = Math.round((difficultyDistribution.hard / 100) * questionCount)

  // Select questions from each difficulty level
  selected.push(...selectRandomQuestions(questionsByDifficulty.EASY, easyCount))
  selected.push(...selectRandomQuestions(questionsByDifficulty.MEDIUM, mediumCount))
  selected.push(...selectRandomQuestions(questionsByDifficulty.HARD, hardCount))

  // If we need more questions to reach the target count, fill from available questions
  const remaining = questionCount - selected.length
  if (remaining > 0) {
    const availableQuestions = questions.filter(q => !selected.find(s => s.id === q.id))
    selected.push(...selectRandomQuestions(availableQuestions, remaining))
  }

  return selected.slice(0, questionCount) // Ensure we don't exceed the requested count
}

function selectRandomQuestions(questions: any[], count: number) {
  if (count <= 0 || questions.length === 0) return []
  
  const shuffled = [...questions].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, questions.length))
}

function getGradeFromScore(score: number): string {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

function calculatePerformanceByDifficulty(questionHistory: any[]) {
  const performance = {
    EASY: { correct: 0, total: 0 },
    MEDIUM: { correct: 0, total: 0 },
    HARD: { correct: 0, total: 0 }
  }

  questionHistory.forEach(h => {
    const difficulty = h.question.difficulty
    if (performance[difficulty]) {
      performance[difficulty].total++
      if (h.wasCorrect) performance[difficulty].correct++
    }
  })

  return {
    easy: performance.EASY.total > 0 ? (performance.EASY.correct / performance.EASY.total) * 100 : 0,
    medium: performance.MEDIUM.total > 0 ? (performance.MEDIUM.correct / performance.MEDIUM.total) * 100 : 0,
    hard: performance.HARD.total > 0 ? (performance.HARD.correct / performance.HARD.total) * 100 : 0
  }
}

function calculateConfidenceAccuracy(questionHistory: any[]) {
  const withConfidence = questionHistory.filter(h => h.confidenceLevel !== null)
  if (withConfidence.length === 0) return null

  const accurateConfident = withConfidence.filter(h => 
    (h.confidenceLevel >= 4 && h.wasCorrect) || (h.confidenceLevel <= 2 && !h.wasCorrect)
  ).length

  return (accurateConfident / withConfidence.length) * 100
}

/**
 * v1.7: Get smart suggestions for play again overlay
 */
export const getPlaySuggestions: GetPlaySuggestions<void, any> = async (args, context) => {
  if (!context.user) {
    throw new Error('User must be authenticated')
  }

  try {
    // Get recent quiz performance to identify weak areas
    const recentAttempts = await context.entities.QuizAttempt.findMany({
      where: { userId: context.user.id },
      include: {
        document: { select: { id: true, title: true, category: true, folderId: true } }
      },
      orderBy: { completedAt: 'desc' },
      take: 20
    })

    // Identify categories with lower performance for targeted practice
    const categoryPerformance: Record<string, { total: number, avgScore: number }> = {}
    for (const attempt of recentAttempts) {
      if (attempt.document.category) {
        const cat = attempt.document.category
        if (!categoryPerformance[cat]) {
          categoryPerformance[cat] = { total: 0, avgScore: 0 }
        }
        categoryPerformance[cat].total++
        categoryPerformance[cat].avgScore += attempt.score
      }
    }

    // Calculate average scores and find weak categories
    const weakCategories = Object.entries(categoryPerformance)
      .map(([category, data]) => ({
        category,
        avgScore: data.avgScore / data.total
      }))
      .filter(c => c.avgScore < 75) // Below 75% average
      .map(c => c.category)

    // Get suggested folders (user's folders with weak categories)
    const suggestedFolders = await context.entities.Folder.findMany({
      where: { 
        userId: context.user.id,
        documents: {
          some: {
            category: { in: weakCategories }
          }
        }
      },
      include: {
        _count: { select: { documents: true } }
      },
      take: 5
    })

    // Get suggested documents (from weak categories or recently active)
    const suggestedDocuments = await context.entities.Document.findMany({
      where: {
        userId: context.user.id,
        OR: [
          { category: { in: weakCategories } },
          { 
            quizAttempts: {
              some: {
                userId: context.user.id,
                completedAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                }
              }
            }
          }
        ]
      },
      include: {
        _count: { select: { questions: true } }
      },
      take: 8,
      orderBy: { updatedAt: 'desc' }
    })

    return {
      folders: suggestedFolders,
      documents: suggestedDocuments
    }
  } catch (error) {
    console.error('Error getting play suggestions:', error)
    throw new Error('Failed to get play suggestions')
  }
}

/**
 * v1.7: Start a random quiz for immediate play
 */
export const startRandomQuiz: StartRandomQuiz<{ mode?: string, settings?: QuizSettings }, any> = async (args, context) => {
  if (!context.user) {
    throw new Error('User must be authenticated')
  }

  try {
    // Get user's documents with questions
    const documents = await context.entities.Document.findMany({
      where: { 
        userId: context.user.id,
        questions: { some: {} } // Only documents with questions
      },
      include: {
        _count: { select: { questions: true } }
      }
    })

    if (documents.length === 0) {
      throw new Error('No documents with questions available')
    }

    // Pick a random document
    const randomDocument = documents[Math.floor(Math.random() * documents.length)]

    // Use default settings if none provided
    const settings: QuizSettings = args.settings || {
      questionCount: Math.min(10, randomDocument._count.questions),
      difficultyDistribution: {
        easy: 40,
        medium: 40,
        hard: 20
      }
    }

    // Start quiz with the random document
    return await startQuiz(
      { documentId: randomDocument.id, settings },
      context
    )
  } catch (error) {
    console.error('Error starting random quiz:', error)
    throw new Error('Failed to start random quiz')
  }
}

/**
 * v1.7: Start targeted practice by category (optionally filter by difficulty)
 */
export const startCategoryPractice: StartCategoryPractice<{ category: string, difficulty?: 'EASY'|'MEDIUM'|'HARD', questionCount?: number }, any> = async (args, context) => {
  if (!context.user) { throw new Error('User must be authenticated') }
  const { category, difficulty, questionCount } = args

  // Find a document for this user in the given category with questions
  const doc = await context.entities.Document.findFirst({
    where: {
      userId: context.user.id,
      category: category,
      questions: { some: difficulty ? { difficulty } : {} }
    },
    include: { _count: { select: { questions: true } } }
  })
  if (!doc) { throw new Error('No content found for selected category.') }

  const settings: QuizSettings = {
    questionCount: Math.min(questionCount ?? 10, doc._count.questions),
    difficultyDistribution: difficulty
      ? (difficulty === 'EASY' ? { easy: 100, medium: 0, hard: 0 }
        : difficulty === 'MEDIUM' ? { easy: 0, medium: 100, hard: 0 }
        : { easy: 0, medium: 0, hard: 100 })
      : { easy: 40, medium: 40, hard: 20 }
  }

  return startQuiz({ documentId: doc.id, settings }, context)
}
