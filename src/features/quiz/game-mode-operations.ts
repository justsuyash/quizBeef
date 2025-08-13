import { HttpError } from 'wasp/server'
import type { StartGameMode } from 'wasp/server/operations'

export const startGameMode: StartGameMode<
  {
    mode: 'RAPID_FIRE' | 'FLASHCARD_FRENZY' | 'TIME_ATTACK' | 'PRECISION' | 'STUDY_MODE' | 'TEST_MODE'
    documentId?: number
  },
  any
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized')
  }

  const { mode, documentId } = args

  try {
    let targetDocumentId = documentId

    // If no document provided, use the demo document or create it
    if (!targetDocumentId) {
      let demoDoc = await context.entities.Document.findFirst({
        where: { 
          title: 'Demo Quiz Content',
          userId: context.user.id 
        }
      })

      if (!demoDoc) {
        // Create demo document if it doesn't exist
        demoDoc = await context.entities.Document.create({
          data: {
            title: 'Demo Quiz Content',
            contentJson: {
              sections: [
                {
                  title: 'General Knowledge',
                  content: 'A collection of general knowledge questions for testing different quiz modes.'
                }
              ]
            },
            sourceType: 'TEXT_INPUT',
            wordCount: 500,
            estimatedReadTime: 5,
            userId: context.user.id
          }
        })

        // Create some basic questions if none exist
        const questionCount = await context.entities.Question.count({
          where: { documentId: demoDoc.id }
        })

        if (questionCount === 0) {
          // Create a few basic questions
          const basicQuestions = [
            {
              text: 'What is 2 + 2?',
              answers: [
                { text: '3', correct: false },
                { text: '4', correct: true },
                { text: '5', correct: false },
                { text: '6', correct: false }
              ]
            },
            {
              text: 'What color is the sky?',
              answers: [
                { text: 'Red', correct: false },
                { text: 'Blue', correct: true },
                { text: 'Green', correct: false },
                { text: 'Yellow', correct: false }
              ]
            },
            {
              text: 'How many days are in a week?',
              answers: [
                { text: '5', correct: false },
                { text: '6', correct: false },
                { text: '7', correct: true },
                { text: '8', correct: false }
              ]
            }
          ]

          for (const q of basicQuestions) {
            const question = await context.entities.Question.create({
              data: {
                questionText: q.text,
                difficulty: 'EASY',
                documentId: demoDoc.id
              }
            })

            for (let i = 0; i < q.answers.length; i++) {
              await context.entities.Answer.create({
                data: {
                  answerText: q.answers[i].text,
                  isCorrect: q.answers[i].correct,
                  orderIndex: i,
                  questionId: question.id
                }
              })
            }
          }
        }
      }

      targetDocumentId = demoDoc.id
    }

    // Get questions for this document
    const questions = await context.entities.Question.findMany({
      where: { documentId: targetDocumentId },
      include: {
        answers: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    })

    if (questions.length === 0) {
      throw new HttpError(400, 'No questions available for this document')
    }

    // Determine quiz settings based on mode
    let quizSettings = getQuizSettings(mode)
    
    // Shuffle and limit questions based on mode
    const selectedQuestions = selectQuestionsForMode(questions, mode)

    // Create quiz attempt with the specific mode
    const quizAttempt = await context.entities.QuizAttempt.create({
      data: {
        score: 0,
        totalQuestions: selectedQuestions.length,
        correctAnswers: 0,
        timeSpent: 0,
        quizMode: mode,
        timeLimit: quizSettings.timeLimit,
        userId: context.user.id,
        documentId: targetDocumentId,
        completedAt: null
      }
    })

    // Create user question history entries
    for (const question of selectedQuestions) {
      await context.entities.UserQuestionHistory.create({
        data: {
          userId: context.user.id,
          questionId: question.id,
          quizAttemptId: quizAttempt.id,
          wasCorrect: false, // Will be updated when answered
          timeSpent: 0,
          selectedAnswerId: null,
          confidenceLevel: null
        }
      })
    }

    return {
      success: true,
      quizAttemptId: quizAttempt.id,
      documentId: targetDocumentId,
      questionCount: selectedQuestions.length,
      mode,
      settings: quizSettings
    }

  } catch (error) {
    console.error('Error starting game mode:', error)
    throw new HttpError(500, `Failed to start ${mode}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

function getQuizSettings(mode: string) {
  switch (mode) {
    case 'RAPID_FIRE':
      return {
        timeLimit: 300, // 5 minutes total
        questionTimeLimit: 15, // 15 seconds per question
        features: ['speed_bonus', 'streak_multiplier']
      }
    case 'FLASHCARD_FRENZY':
      return {
        timeLimit: null, // No time limit
        features: ['confidence_rating', 'explanations']
      }
    case 'TIME_ATTACK':
      return {
        timeLimit: 180, // 3 minutes total
        questionTimeLimit: 10, // 10 seconds per question
        features: ['extreme_speed', 'multipliers', 'pressure']
      }
    case 'PRECISION':
      return {
        timeLimit: 600, // 10 minutes
        features: ['accuracy_focus', 'no_speed_pressure']
      }
    case 'STUDY_MODE':
      return {
        timeLimit: null, // No time limit
        features: ['detailed_explanations', 'learning_focus', 'references']
      }
    case 'TEST_MODE':
      return {
        timeLimit: 1800, // 30 minutes
        features: ['formal_exam', 'final_results_only', 'no_immediate_feedback']
      }
    default:
      return {
        timeLimit: null,
        features: []
      }
  }
}

function selectQuestionsForMode(questions: any[], mode: string) {
  // Shuffle questions
  const shuffled = [...questions].sort(() => Math.random() - 0.5)
  
  switch (mode) {
    case 'RAPID_FIRE':
      // 10-15 questions for rapid fire
      return shuffled.slice(0, Math.min(12, questions.length))
    case 'FLASHCARD_FRENZY':
      // 8-12 questions for flashcard mode
      return shuffled.slice(0, Math.min(10, questions.length))
    case 'TIME_ATTACK':
      // 15-20 questions for time attack
      return shuffled.slice(0, Math.min(15, questions.length))
    case 'PRECISION':
      // 12-15 questions focusing on accuracy
      return shuffled.slice(0, Math.min(12, questions.length))
    case 'STUDY_MODE':
      // All questions for thorough learning
      return shuffled
    case 'TEST_MODE':
      // 20-25 questions for formal test
      return shuffled.slice(0, Math.min(20, questions.length))
    default:
      return shuffled.slice(0, Math.min(10, questions.length))
  }
}
