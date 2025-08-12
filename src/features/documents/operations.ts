import { type ProcessContent, type GetMyDocuments, type GenerateQuiz, type GetDocumentQuestions } from 'wasp/server/operations'
import { generateQuestionsFromContent } from './aiService'

/**
 * Process content from various sources (PDF, URL, text) and store as structured JSON
 */
export const processContent: ProcessContent<
  { 
    sourceType: 'PDF' | 'YOUTUBE' | 'WEB_ARTICLE' | 'TEXT_INPUT'
    content: string // base64 for PDF, URL for others, raw text for TEXT_INPUT
    title?: string
    sourceUrl?: string
  }, 
  any
> = async (args, context) => {
  if (!context.user) {
    throw new Error('User must be authenticated')
  }

  const { sourceType, content, title, sourceUrl } = args

  try {
    let extractedText = ''
    let metadata: any = {}

    // Process different content types
    switch (sourceType) {
      case 'PDF':
        const pdfResult = await processPDF(content)
        extractedText = pdfResult.text
        metadata = {
          pageCount: pdfResult.numpages,
          wordCount: estimateWordCount(pdfResult.text),
          extractedAt: new Date().toISOString()
        }
        break

      case 'TEXT_INPUT':
        extractedText = content
        metadata = {
          wordCount: estimateWordCount(content),
          extractedAt: new Date().toISOString()
        }
        break

      case 'YOUTUBE':
      case 'WEB_ARTICLE':
        // For now, throw an error - these will be implemented later
        throw new Error(`${sourceType} processing not yet implemented`)

      default:
        throw new Error(`Unsupported source type: ${sourceType}`)
    }

    // Create structured JSON content
    const contentJson = createStructuredContent(extractedText, metadata)

    // Save to database
    const document = await context.entities.Document.create({
      data: {
        title: title || `${sourceType} Document - ${new Date().toLocaleDateString()}`,
        contentJson,
        sourceType,
        sourceUrl,
        wordCount: metadata.wordCount,
        estimatedReadTime: Math.ceil(metadata.wordCount / 200), // ~200 words per minute
        userId: context.user.id,
      },
    })

    return {
      success: true,
      documentId: document.id,
      title: document.title,
      wordCount: document.wordCount,
      estimatedReadTime: document.estimatedReadTime
    }

  } catch (error) {
    console.error('Error processing content:', error)
    throw new Error(`Failed to process content: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get all documents for the authenticated user
 */
export const getMyDocuments: GetMyDocuments<void, any> = async (args, context) => {
  if (!context.user) {
    throw new Error('User must be authenticated')
  }

  try {
    const documents = await context.entities.Document.findMany({
      where: { userId: context.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            quizAttempts: true,
            questions: true
          }
        }
      }
    })

    return documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      sourceType: doc.sourceType,
      sourceUrl: doc.sourceUrl,
      wordCount: doc.wordCount,
      estimatedReadTime: doc.estimatedReadTime,
      createdAt: doc.createdAt,
      quizCount: doc._count.quizAttempts,
      questionCount: doc._count.questions
    }))

  } catch (error) {
    console.error('Error fetching documents:', error)
    throw new Error('Failed to fetch documents')
  }
}

// Helper functions

/**
 * Process PDF content from base64 string
 */
async function processPDF(base64Content: string): Promise<{ text: string; numpages: number }> {
  try {
    // Dynamic import to avoid server startup issues
    const pdf = (await import('pdf-parse')).default
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Content, 'base64')
    
    // Parse PDF
    const data = await pdf(buffer)
    
    return {
      text: data.text,
      numpages: data.numpages
    }
  } catch (error) {
    console.error('PDF processing error:', error)
    throw new Error('Failed to process PDF content')
  }
}

/**
 * Estimate word count from text
 */
function estimateWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length
}

/**
 * Create structured JSON content for AI processing
 */
function createStructuredContent(text: string, metadata: any): any {
  // Clean and normalize text
  const cleanText = text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
    .trim()

  // Split into paragraphs
  const paragraphs = cleanText
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0)

  // Extract key sentences (first and last from each substantial paragraph)
  const keySentences = paragraphs
    .filter(p => p.length > 100) // Only substantial paragraphs
    .flatMap(p => {
      const sentences = p.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0)
      if (sentences.length === 1) return [sentences[0]]
      if (sentences.length === 2) return sentences
      return [sentences[0], sentences[sentences.length - 1]]
    })
    .slice(0, 10) // Limit to 10 key sentences

  // Extract potential keywords (words longer than 4 characters, appearing multiple times)
  const wordFreq: Record<string, number> = {}
  cleanText
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 4)
    .forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1
    })

  const keywords = Object.entries(wordFreq)
    .filter(([, count]) => count > 1)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([word]) => word)

  return {
    fullText: cleanText,
    paragraphs: paragraphs.slice(0, 50), // Limit paragraphs for storage
    keySentences,
    keywords,
    metadata: {
      ...metadata,
      paragraphCount: paragraphs.length,
      avgParagraphLength: Math.round(paragraphs.reduce((sum, p) => sum + p.length, 0) / paragraphs.length),
      keywordDensity: keywords.length / Math.max(cleanText.split(/\s+/).length, 1)
    }
  }
}

/**
 * Generate quiz questions from a document using AI
 */
export const generateQuiz: GenerateQuiz<
  {
    documentId: number
    questionCount?: number
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED'
    questionTypes?: ('MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER')[]
  },
  any
> = async (args, context) => {
  if (!context.user) {
    throw new Error('User must be authenticated')
  }

  const { documentId, questionCount = 10, difficulty = 'MIXED', questionTypes = ['MULTIPLE_CHOICE', 'TRUE_FALSE'] } = args

  try {
    // Get the document
    const document = await context.entities.Document.findUnique({
      where: { 
        id: documentId,
        userId: context.user.id // Ensure user owns the document
      }
    })

    if (!document) {
      throw new Error('Document not found or access denied')
    }

    // Check if we already have questions for this document
    const existingQuestions = await context.entities.Question.findMany({
      where: { documentId }
    })

    if (existingQuestions.length > 0) {
      return {
        success: true,
        message: 'Questions already exist for this document',
        questionCount: existingQuestions.length,
        documentId,
        isNewGeneration: false
      }
    }

    // Generate questions using AI
    const generatedQuiz = await generateQuestionsFromContent(
      document.contentJson,
      { questionCount, difficulty, questionTypes }
    )

    // Save questions and answers to database
    for (const questionData of generatedQuiz.questions) {
      const question = await context.entities.Question.create({
        data: {
          questionText: questionData.questionText,
          questionType: questionData.questionType,
          difficulty: questionData.difficulty,
          explanation: questionData.explanation || '',
          upvotes: 0,
          downvotes: 0,
          timesAsked: 0,
          correctRate: null,
          documentId,
        }
      })

      // Create answers for this question
      for (const answerData of questionData.answers) {
        await context.entities.Answer.create({
          data: {
            answerText: answerData.answerText,
            isCorrect: answerData.isCorrect,
            explanation: answerData.explanation || '',
            orderIndex: answerData.orderIndex,
            questionId: question.id
          }
        })
      }
    }

    return {
      success: true,
      message: 'Quiz questions generated successfully',
      questionCount: generatedQuiz.questions.length,
      documentId,
      isNewGeneration: true,
      metadata: generatedQuiz.metadata
    }

  } catch (error) {
    console.error('Error generating quiz:', error)
    throw new Error(`Failed to generate quiz: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get questions for a specific document
 */
export const getDocumentQuestions: GetDocumentQuestions<
  { documentId: number },
  any
> = async (args, context) => {
  if (!context.user) {
    throw new Error('User must be authenticated')
  }

  const { documentId } = args

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

    // Get questions with their answers
    const questions = await context.entities.Question.findMany({
      where: { documentId },
      include: {
        answers: {
          orderBy: { orderIndex: 'asc' }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return {
      documentId,
      documentTitle: document.title,
      questions: questions.map(q => ({
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        difficulty: q.difficulty,
        explanation: q.explanation,
        upvotes: q.upvotes,
        downvotes: q.downvotes,
        timesAsked: q.timesAsked,
        correctRate: q.correctRate,
        answers: q.answers.map(a => ({
          id: a.id,
          answerText: a.answerText,
          isCorrect: a.isCorrect,
          explanation: a.explanation,
          orderIndex: a.orderIndex
        }))
      }))
    }

  } catch (error) {
    console.error('Error fetching document questions:', error)
    throw new Error('Failed to fetch questions')
  }
}
