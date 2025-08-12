import { type StartQuiz, type SubmitQuizAnswer, type CompleteQuiz, type GetQuizAttempt, type GetQuizHistory } from 'wasp/server/operations'

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

    return {
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
    totalTimeSpent: number
  },
  any
> = async (args, context) => {
  if (!context.user) {
    throw new Error('User must be authenticated')
  }

  const { quizAttemptId, totalTimeSpent } = args

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
