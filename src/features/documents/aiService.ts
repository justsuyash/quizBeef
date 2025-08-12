import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize the Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

export interface QuestionData {
  questionText: string
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER'
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  explanation?: string
  answers: {
    answerText: string
    isCorrect: boolean
    explanation?: string
    orderIndex: number
  }[]
}

export interface GeneratedQuiz {
  questions: QuestionData[]
  metadata: {
    totalQuestions: number
    difficultyDistribution: Record<string, number>
    questionTypes: Record<string, number>
    generatedAt: string
  }
}

/**
 * Generate quiz questions from structured content using Google Gemini
 */
export async function generateQuestionsFromContent(
  contentJson: any,
  options: {
    questionCount?: number
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED'
    questionTypes?: ('MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER')[]
  } = {}
): Promise<GeneratedQuiz> {
  const {
    questionCount = 10,
    difficulty = 'MIXED',
    questionTypes = ['MULTIPLE_CHOICE', 'TRUE_FALSE']
  } = options

  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    // Prepare the content for AI processing
    const contentForAI = prepareContentForAI(contentJson)

    // Create the prompt for question generation
    const prompt = createQuestionGenerationPrompt(contentForAI, {
      questionCount,
      difficulty,
      questionTypes
    })

    // Generate content using Gemini
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse the AI response into structured questions
    const questions = parseAIResponse(text)

    // Create metadata
    const metadata = createQuizMetadata(questions)

    return {
      questions,
      metadata
    }

  } catch (error) {
    console.error('Error generating questions with Gemini:', error)
    throw new Error(`Failed to generate questions: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Prepare structured content for AI processing
 */
function prepareContentForAI(contentJson: any): string {
  const { fullText, keySentences, keywords, paragraphs } = contentJson

  // Create a focused summary for the AI
  let preparedContent = ''

  // Add key sentences for context
  if (keySentences && keySentences.length > 0) {
    preparedContent += 'KEY POINTS:\n'
    keySentences.forEach((sentence: string, index: number) => {
      preparedContent += `${index + 1}. ${sentence}\n`
    })
    preparedContent += '\n'
  }

  // Add keywords for focus
  if (keywords && keywords.length > 0) {
    preparedContent += `IMPORTANT TERMS: ${keywords.join(', ')}\n\n`
  }

  // Add first few paragraphs for detailed context
  if (paragraphs && paragraphs.length > 0) {
    preparedContent += 'CONTENT DETAIL:\n'
    paragraphs.slice(0, 5).forEach((paragraph: string) => {
      if (paragraph.trim().length > 50) { // Only include substantial paragraphs
        preparedContent += `${paragraph.trim()}\n\n`
      }
    })
  }

  // Fallback to full text if structured content is minimal
  if (preparedContent.length < 200 && fullText) {
    preparedContent = fullText.slice(0, 3000) // Limit to reasonable size
  }

  return preparedContent
}

/**
 * Create the prompt for question generation
 */
function createQuestionGenerationPrompt(
  content: string,
  options: {
    questionCount: number
    difficulty: string
    questionTypes: string[]
  }
): string {
  return `You are an expert educator creating quiz questions from educational content. Generate exactly ${options.questionCount} high-quality quiz questions based on the following content.

CONTENT TO ANALYZE:
${content}

REQUIREMENTS:
- Generate exactly ${options.questionCount} questions
- Difficulty level: ${options.difficulty}
- Question types: ${options.questionTypes.join(', ')}
- Focus on key concepts and important details
- Questions should test understanding, not just memorization
- Each question must have clear, unambiguous answers

FORMAT YOUR RESPONSE AS JSON:
{
  "questions": [
    {
      "questionText": "What is the main concept discussed?",
      "questionType": "MULTIPLE_CHOICE",
      "difficulty": "MEDIUM",
      "explanation": "This tests understanding of the core concept",
      "answers": [
        {
          "answerText": "Correct answer text",
          "isCorrect": true,
          "explanation": "Why this is correct",
          "orderIndex": 0
        },
        {
          "answerText": "Incorrect answer 1",
          "isCorrect": false,
          "explanation": "Why this is incorrect",
          "orderIndex": 1
        },
        {
          "answerText": "Incorrect answer 2",
          "isCorrect": false,
          "explanation": "Why this is incorrect", 
          "orderIndex": 2
        },
        {
          "answerText": "Incorrect answer 3",
          "isCorrect": false,
          "explanation": "Why this is incorrect",
          "orderIndex": 3
        }
      ]
    }
  ]
}

QUESTION TYPE GUIDELINES:
- MULTIPLE_CHOICE: 4 answer options, 1 correct
- TRUE_FALSE: 2 answer options (True/False), 1 correct
- SHORT_ANSWER: 1 correct answer with key terms

Generate thoughtful, educational questions that promote active recall and deep understanding.`
}

/**
 * Parse AI response into structured question data
 */
function parseAIResponse(aiResponse: string): QuestionData[] {
  try {
    // Clean the response to extract JSON
    let jsonText = aiResponse.trim()
    
    // Remove code block markers if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    // Parse the JSON response
    const parsed = JSON.parse(jsonText)
    
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Invalid AI response format: missing questions array')
    }

    // Validate and clean each question
    return parsed.questions.map((q: any, index: number) => {
      // Validate required fields
      if (!q.questionText || !q.questionType || !q.answers) {
        throw new Error(`Invalid question format at index ${index}`)
      }

      // Ensure answers is an array
      if (!Array.isArray(q.answers)) {
        throw new Error(`Invalid answers format at question ${index}`)
      }

      // Validate that there's at least one correct answer
      const hasCorrectAnswer = q.answers.some((a: any) => a.isCorrect === true)
      if (!hasCorrectAnswer) {
        // Make the first answer correct as fallback
        q.answers[0].isCorrect = true
      }

      return {
        questionText: q.questionText,
        questionType: q.questionType,
        difficulty: q.difficulty || 'MEDIUM',
        explanation: q.explanation || '',
        answers: q.answers.map((a: any, answerIndex: number) => ({
          answerText: a.answerText || `Answer ${answerIndex + 1}`,
          isCorrect: Boolean(a.isCorrect),
          explanation: a.explanation || '',
          orderIndex: answerIndex
        }))
      }
    })

  } catch (error) {
    console.error('Error parsing AI response:', error)
    console.error('AI Response was:', aiResponse)
    
    // Return fallback questions if parsing fails
    return createFallbackQuestions()
  }
}

/**
 * Create fallback questions if AI generation fails
 */
function createFallbackQuestions(): QuestionData[] {
  return [
    {
      questionText: "What is the main topic of this content?",
      questionType: "MULTIPLE_CHOICE",
      difficulty: "EASY",
      explanation: "This question tests basic comprehension of the content.",
      answers: [
        {
          answerText: "The primary subject discussed in the material",
          isCorrect: true,
          explanation: "This represents the main focus of the content",
          orderIndex: 0
        },
        {
          answerText: "A secondary topic mentioned briefly",
          isCorrect: false,
          explanation: "This would be a supporting detail, not the main topic",
          orderIndex: 1
        },
        {
          answerText: "An unrelated subject",
          isCorrect: false,
          explanation: "This would not be relevant to the content",
          orderIndex: 2
        },
        {
          answerText: "Background information only",
          isCorrect: false,
          explanation: "This would be contextual, not the main focus",
          orderIndex: 3
        }
      ]
    }
  ]
}

/**
 * Create metadata for the generated quiz
 */
function createQuizMetadata(questions: QuestionData[]) {
  const difficultyDistribution: Record<string, number> = {}
  const questionTypes: Record<string, number> = {}

  questions.forEach(q => {
    difficultyDistribution[q.difficulty] = (difficultyDistribution[q.difficulty] || 0) + 1
    questionTypes[q.questionType] = (questionTypes[q.questionType] || 0) + 1
  })

  return {
    totalQuestions: questions.length,
    difficultyDistribution,
    questionTypes,
    generatedAt: new Date().toISOString()
  }
}
