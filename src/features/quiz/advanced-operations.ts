import { HttpError } from 'wasp/server'
import type { GenerateQuizFromFolder, GetSuggestedQuestionCount } from 'wasp/server/operations'
import type { Document, Folder, Question, Answer, QuizAttempt } from 'wasp/entities'

/**
 * Generate a quiz from multiple documents in a folder
 */
export const generateQuizFromFolder: GenerateQuizFromFolder<
  {
    documentIds: number[]
    folderId?: number
    questionCount?: number
    quizMode?: string
  },
  { quizAttemptId: number; questionCount: number }
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be authenticated')
  }

  const { documentIds, folderId, questionCount = 10, quizMode = 'PRACTICE' } = args

  if (!documentIds || documentIds.length === 0) {
    throw new HttpError(400, 'At least one document must be selected')
  }

  try {
    // Verify user owns all selected documents
    const documents = await context.entities.Document.findMany({
      where: {
        id: { in: documentIds },
        userId: context.user.id
      },
      include: {
        questions: true,
        folder: true
      }
    })

    if (documents.length !== documentIds.length) {
      throw new HttpError(403, 'One or more documents not found or not owned by user')
    }

    // Get folder for style guide if provided
    let folder: Folder | null = null
    if (folderId) {
      folder = await context.entities.Folder.findFirst({
        where: {
          id: folderId,
          userId: context.user.id
        }
      })
    }

    // Collect all questions from selected documents
    const allQuestions: Question[] = []
    documents.forEach(doc => {
      if (doc.questions && doc.questions.length > 0) {
        allQuestions.push(...doc.questions)
      }
    })

    if (allQuestions.length === 0) {
      throw new HttpError(400, 'Selected documents have no questions available for quiz generation')
    }

    // Apply folder style guide if available
    let selectedQuestions = allQuestions
    if (folder?.sampleQuestion) {
      // TODO: In future, use AI to filter questions that match the style guide
      // For now, just use all available questions
      selectedQuestions = allQuestions
    }

    // Shuffle and limit questions
    const shuffledQuestions = selectedQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(questionCount, selectedQuestions.length))

    if (shuffledQuestions.length === 0) {
      throw new HttpError(400, 'No questions available after filtering')
    }

    // Create quiz attempt
    const quizAttempt = await context.entities.QuizAttempt.create({
      data: {
        userId: context.user.id,
        documentId: documents[0].id, // Primary document
        quizMode: quizMode as any,
        totalQuestions: shuffledQuestions.length,
        score: 0,
        correctAnswers: 0,
        timeSpent: 0,
        timeLimit: getTimeLimitForMode(quizMode),
        difficultyDistribution: {
          multiDocument: true,
          documentIds: documentIds,
          folderId: folderId,
          folderStyleGuide: folder?.sampleQuestion || null,
          documentTitles: documents.map(d => d.title),
          questionIds: shuffledQuestions.map(q => q.id)
        }
      }
    })

    return {
      quizAttemptId: quizAttempt.id,
      questionCount: shuffledQuestions.length
    }

  } catch (error) {
    console.error('Error generating quiz from folder:', error)
    if (error instanceof HttpError) {
      throw error
    }
    throw new HttpError(500, 'Failed to generate quiz from selected documents')
  }
}

/**
 * Get suggested question count based on content length of multiple documents
 */
export const getSuggestedQuestionCount: GetSuggestedQuestionCount<
  { documentIds: number[] },
  { suggested: number; min: number; max: number; totalQuestions: number }
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be authenticated')
  }

  const { documentIds } = args

  if (!documentIds || documentIds.length === 0) {
    throw new HttpError(400, 'At least one document must be provided')
  }

  try {
    // Get documents with their questions and word counts
    const documents = await context.entities.Document.findMany({
      where: {
        id: { in: documentIds },
        userId: context.user.id
      },
      include: {
        questions: true,
        _count: {
          select: {
            questions: true
          }
        }
      }
    })

    if (documents.length !== documentIds.length) {
      throw new HttpError(403, 'One or more documents not found or not owned by user')
    }

    // Calculate total metrics
    const totalWordCount = documents.reduce((sum, doc) => sum + (doc.wordCount || 0), 0)
    const totalQuestions = documents.reduce((sum, doc) => sum + doc._count.questions, 0)

    // Calculate suggested question count based on content
    let suggested = 10 // Default
    
    if (totalWordCount > 0) {
      // Base suggestion on word count: roughly 1 question per 200-300 words
      suggested = Math.ceil(totalWordCount / 250)
    } else if (totalQuestions > 0) {
      // If no word count, base on existing questions
      suggested = Math.min(totalQuestions, 15)
    }

    // Apply reasonable bounds
    const min = Math.max(5, Math.ceil(suggested * 0.5))
    const max = Math.min(50, Math.max(suggested * 2, totalQuestions))
    
    // Ensure suggested is within bounds
    suggested = Math.max(min, Math.min(max, suggested))

    return {
      suggested,
      min,
      max,
      totalQuestions
    }

  } catch (error) {
    console.error('Error getting suggested question count:', error)
    if (error instanceof HttpError) {
      throw error
    }
    throw new HttpError(500, 'Failed to calculate suggested question count')
  }
}

/**
 * Helper function to get time limit based on quiz mode
 */
function getTimeLimitForMode(mode: string): number | null {
  switch (mode) {
    case 'RAPID_FIRE':
      return 30 // 30 seconds per question
    case 'TIME_ATTACK':
      return 15 // 15 seconds per question
    case 'FLASHCARD_FRENZY':
      return 45 // 45 seconds per question
    case 'PRECISION':
      return null // No time limit for precision mode
    case 'STUDY_MODE':
      return null // No time limit for study mode
    default:
      return null // No time limit for practice mode
  }
}
