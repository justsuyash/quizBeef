import { type ProcessContent, type GetMyDocuments, type GenerateQuiz, type GetDocumentQuestions, type GenerateQuestionsForDocument, type GenerateQuestionsForMultipleDocuments, type DeleteDocument } from 'wasp/server/operations'
import { HttpError } from 'wasp/server'
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

    // Generate AI-powered title if not provided
    let finalTitle = title
    
    // Process different content types
    switch (sourceType) {
      case 'PDF':
        try {
          const pdfResult = await processPDF(content)
          extractedText = pdfResult.text
          metadata = {
            pageCount: pdfResult.numpages,
            wordCount: estimateWordCount(pdfResult.text),
            extractedAt: new Date().toISOString()
          }
        } catch (pdfError) {
          console.error('PDF processing failed, creating placeholder:', pdfError)
          // Create a placeholder document for failed PDF processing
          extractedText = `[PDF Processing Failed] 
          
This PDF could not be processed automatically. You can:
1. Try uploading a different PDF file
2. Copy and paste the text content directly using the "Text Input" tab
3. Check if the PDF is password protected or corrupted

Original error: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`
          
          metadata = {
            pageCount: 0,
            wordCount: estimateWordCount(extractedText),
            extractedAt: new Date().toISOString(),
            processingFailed: true
          }
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

    // Generate AI-powered title if not provided
    if (!finalTitle && extractedText.trim()) {
      try {
        finalTitle = await generateAITitle(extractedText, sourceType)
      } catch (error) {
        console.error('AI title generation failed:', error)
        finalTitle = `${sourceType} Document - ${new Date().toLocaleDateString()}`
      }
    }

    // Save to database
    const document = await context.entities.Document.create({
      data: {
        title: finalTitle || `${sourceType} Document - ${new Date().toLocaleDateString()}`,
        contentJson,
        sourceType,
        sourceUrl,
        wordCount: metadata.wordCount,
        estimatedReadTime: Math.ceil(metadata.wordCount / 200), // ~200 words per minute
        userId: context.user.id,
      },
    })

    // Automatically generate questions for the document
    let questionCount = 0
    try {
      // Generate questions using AI if content is substantial enough
      if (extractedText.trim().length > 100) {
        const generatedQuiz = await generateQuestionsFromContent(
          contentJson,
          { questionCount: 10, difficulty: 'MIXED', questionTypes: ['MULTIPLE_CHOICE', 'TRUE_FALSE'] }
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
              documentId: document.id,
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
        
        questionCount = generatedQuiz.questions.length
      }
    } catch (error) {
      console.error('Failed to auto-generate questions during upload:', error)
      // Continue without questions - user can generate them manually later
    }

    return {
      success: true,
      documentId: document.id,
      title: document.title,
      wordCount: document.wordCount,
      estimatedReadTime: document.estimatedReadTime,
      questionsGenerated: questionCount
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
        questions: true, // Include actual questions array
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
      folderId: doc.folderId, // Include folder assignment
      quizCount: doc._count.quizAttempts,
      questionCount: doc._count.questions,
      questions: doc.questions // Include the actual questions array!
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
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      bufferSize: base64Content.length
    })
    throw new Error(`Failed to process PDF content: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
 * Generate questions for an existing document that doesn't have questions
 */
export const generateQuestionsForDocument: GenerateQuestionsForDocument<
  { documentId: number },
  { success: boolean; questionCount: number; message: string }
> = async (args, context) => {
  if (!context.user) {
    throw new Error('User must be authenticated')
  }

  const { documentId } = args

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
        questionCount: existingQuestions.length,
        message: 'Questions already exist for this document'
      }
    }

    // Generate questions using AI
    const generatedQuiz = await generateQuestionsFromContent(
      document.contentJson,
      { questionCount: 10, difficulty: 'MIXED', questionTypes: ['MULTIPLE_CHOICE', 'TRUE_FALSE'] }
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
      questionCount: generatedQuiz.questions.length,
      message: `Successfully generated ${generatedQuiz.questions.length} questions`
    }

  } catch (error) {
    console.error('Error generating questions for document:', error)
    throw new Error(`Failed to generate questions: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate questions for multiple documents at once
 */
export const generateQuestionsForMultipleDocuments: GenerateQuestionsForMultipleDocuments<
  { documentIds: number[] },
  { 
    success: boolean
    totalDocuments: number
    documentsProcessed: number
    totalQuestionsGenerated: number
    results: Array<{
      documentId: number
      documentTitle: string
      success: boolean
      questionCount: number
      error?: string
    }>
  }
> = async (args, context) => {
  if (!context.user) {
    throw new Error('User must be authenticated')
  }

  const { documentIds } = args

  if (!documentIds || documentIds.length === 0) {
    throw new Error('At least one document ID must be provided')
  }

  try {
    // Get all documents and verify ownership
    const documents = await context.entities.Document.findMany({
      where: {
        id: { in: documentIds },
        userId: context.user.id
      }
    })

    if (documents.length !== documentIds.length) {
      throw new Error('One or more documents not found or not owned by user')
    }

    const results: Array<{
      documentId: number
      documentTitle: string
      success: boolean
      questionCount: number
      error?: string
    }> = []

    let totalQuestionsGenerated = 0
    let documentsProcessed = 0

    // Process each document
    for (const document of documents) {
      try {
        // Check if questions already exist
        const existingQuestions = await context.entities.Question.findMany({
          where: { documentId: document.id }
        })

        if (existingQuestions.length > 0) {
          results.push({
            documentId: document.id,
            documentTitle: document.title,
            success: true,
            questionCount: existingQuestions.length,
            error: 'Questions already exist'
          })
          totalQuestionsGenerated += existingQuestions.length
          documentsProcessed++
          continue
        }

        // Generate questions using AI
        const generatedQuiz = await generateQuestionsFromContent(
          document.contentJson,
          { questionCount: 10, difficulty: 'MIXED', questionTypes: ['MULTIPLE_CHOICE', 'TRUE_FALSE'] }
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
              documentId: document.id,
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

        results.push({
          documentId: document.id,
          documentTitle: document.title,
          success: true,
          questionCount: generatedQuiz.questions.length
        })

        totalQuestionsGenerated += generatedQuiz.questions.length
        documentsProcessed++

      } catch (error) {
        console.error(`Error generating questions for document ${document.id}:`, error)
        results.push({
          documentId: document.id,
          documentTitle: document.title,
          success: false,
          questionCount: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return {
      success: true,
      totalDocuments: documents.length,
      documentsProcessed,
      totalQuestionsGenerated,
      results
    }

  } catch (error) {
    console.error('Error in bulk question generation:', error)
    throw new Error(`Failed to generate questions: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

/**
 * Generate an AI-powered title for document content
 */
async function generateAITitle(content: string, sourceType: string): Promise<string> {
  try {
    // Get the first 1000 characters for title generation
    const contentPreview = content.slice(0, 1000).trim()
    
    if (!contentPreview) {
      return `${sourceType} Document - ${new Date().toLocaleDateString()}`
    }

    // Use Gemini API for title generation
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.warn('Gemini API key not configured, using fallback title')
      return `${sourceType} Document - ${new Date().toLocaleDateString()}`
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `Based on the following content, generate a concise, descriptive title (maximum 8 words) that captures the main topic or subject matter. The title should be professional and suitable for academic or educational content.

Content:
${contentPreview}

Instructions:
- Generate only the title, no additional text
- Maximum 8 words
- Be specific about the subject matter
- Avoid generic words like "document", "content", "text"
- Make it suitable for educational/academic context

Title:`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let aiTitle = response.text().trim()

    // Clean up the response
    aiTitle = aiTitle.replace(/^Title:\s*/i, '')
    aiTitle = aiTitle.replace(/['"]/g, '')
    aiTitle = aiTitle.split('\n')[0].trim()

    // Validate title length and content
    if (aiTitle && aiTitle.length > 0 && aiTitle.length <= 100) {
      return aiTitle
    } else {
      throw new Error('Generated title is invalid')
    }

  } catch (error) {
    console.error('AI title generation error:', error)
    
    // Fallback: Extract first meaningful sentence/phrase
    const sentences = content.split(/[.!?]+/)
    if (sentences.length > 0) {
      const firstSentence = sentences[0].trim()
      if (firstSentence.length > 0 && firstSentence.length <= 80) {
        return firstSentence.length > 50 
          ? firstSentence.substring(0, 47) + '...'
          : firstSentence
      }
    }
    
    return `${sourceType} Document - ${new Date().toLocaleDateString()}`
  }
}

/**
 * Delete a document and all its associated questions and answers
 */
export const deleteDocument: DeleteDocument<
  { documentId: number },
  { success: boolean; message: string }
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be authenticated')
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
      throw new HttpError(404, 'Document not found or access denied')
    }

    // Delete in the correct order (foreign key constraints)
    // 1. Delete answers first
    await context.entities.Answer.deleteMany({
      where: {
        question: {
          documentId: documentId
        }
      }
    })

    // 2. Delete questions
    await context.entities.Question.deleteMany({
      where: { documentId: documentId }
    })

    // 3. Finally delete the document
    await context.entities.Document.delete({
      where: { id: documentId }
    })

    return {
      success: true,
      message: `Document "${document.title}" has been deleted successfully`
    }

  } catch (error) {
    console.error('Error deleting document:', error)
    
    if (error instanceof HttpError) {
      throw error
    }
    
    throw new HttpError(500, `Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
