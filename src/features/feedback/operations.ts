import { HttpError } from 'wasp/server'
import type {
  ToggleDocumentLike,
  AddDocumentComment,
  GetDocumentComments,
  ToggleQuestionFeedback,
  IncrementDocumentViews,
  GetDocumentEngagement
} from 'wasp/server/operations'
import type { 
  Document, 
  DocumentLike, 
  DocumentComment, 
  QuestionFeedback,
  User 
} from 'wasp/entities'

// Toggle like on a document (quiz)
export const toggleDocumentLike: ToggleDocumentLike<
  { documentId: number },
  { isLiked: boolean; likeCount: number }
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized')
  }

  const { documentId } = args
  const userId = context.user.id

  // Check if document exists
  const document = await context.entities.Document.findUnique({
    where: { id: documentId }
  })

  if (!document) {
    throw new HttpError(404, 'Document not found')
  }

  // Check if user already liked this document
  const existingLike = await context.entities.DocumentLike.findUnique({
    where: {
      userId_documentId: {
        userId,
        documentId
      }
    }
  })

  let isLiked: boolean
  let likeCount: number

  if (existingLike) {
    // Unlike: Remove the like
    await context.entities.DocumentLike.delete({
      where: { id: existingLike.id }
    })
    
    // Decrement like count
    const updatedDocument = await context.entities.Document.update({
      where: { id: documentId },
      data: { likeCount: { decrement: 1 } }
    })
    
    isLiked = false
    likeCount = updatedDocument.likeCount
  } else {
    // Like: Create new like
    await context.entities.DocumentLike.create({
      data: {
        userId,
        documentId
      }
    })
    
    // Increment like count
    const updatedDocument = await context.entities.Document.update({
      where: { id: documentId },
      data: { likeCount: { increment: 1 } }
    })
    
    isLiked = true
    likeCount = updatedDocument.likeCount
  }

  return { isLiked, likeCount }
}

// Add comment to a document
export const addDocumentComment: AddDocumentComment<
  { documentId: number; content: string },
  DocumentComment
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized')
  }

  const { documentId, content } = args
  const userId = context.user.id

  if (!content.trim()) {
    throw new HttpError(400, 'Comment content cannot be empty')
  }

  if (content.length > 1000) {
    throw new HttpError(400, 'Comment too long (max 1000 characters)')
  }

  // Check if document exists
  const document = await context.entities.Document.findUnique({
    where: { id: documentId }
  })

  if (!document) {
    throw new HttpError(404, 'Document not found')
  }

  // Create comment
  const comment = await context.entities.DocumentComment.create({
    data: {
      content: content.trim(),
      userId,
      documentId
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true
        }
      }
    }
  })

  // Increment comment count
  await context.entities.Document.update({
    where: { id: documentId },
    data: { commentCount: { increment: 1 } }
  })

  return comment
}

// Get comments for a document
export const getDocumentComments: GetDocumentComments<
  { documentId: number; limit?: number; offset?: number },
  { comments: (DocumentComment & { user: Pick<User, 'id' | 'name' | 'avatarUrl'> })[]; total: number }
> = async (args, context) => {
  const { documentId, limit = 20, offset = 0 } = args

  // Check if document exists
  const document = await context.entities.Document.findUnique({
    where: { id: documentId }
  })

  if (!document) {
    throw new HttpError(404, 'Document not found')
  }

  // Get comments with user info
  const comments = await context.entities.DocumentComment.findMany({
    where: { documentId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset
  })

  // Get total count
  const total = await context.entities.DocumentComment.count({
    where: { documentId }
  })

  return { comments, total }
}

// Toggle question feedback (like/dislike)
export const toggleQuestionFeedback: ToggleQuestionFeedback<
  { questionId: number; isLike: boolean },
  { success: boolean; currentFeedback: boolean | null }
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized')
  }

  const { questionId, isLike } = args
  const userId = context.user.id

  // Check if question exists
  const question = await context.entities.Question.findUnique({
    where: { id: questionId }
  })

  if (!question) {
    throw new HttpError(404, 'Question not found')
  }

  // Check existing feedback
  const existingFeedback = await context.entities.QuestionFeedback.findUnique({
    where: {
      userId_questionId: {
        userId,
        questionId
      }
    }
  })

  let currentFeedback: boolean | null = null

  if (existingFeedback) {
    if (existingFeedback.isLike === isLike) {
      // Remove feedback (toggle off)
      await context.entities.QuestionFeedback.delete({
        where: { id: existingFeedback.id }
      })
      
      // Update question counters
      if (isLike) {
        await context.entities.Question.update({
          where: { id: questionId },
          data: { upvotes: { decrement: 1 } }
        })
      } else {
        await context.entities.Question.update({
          where: { id: questionId },
          data: { downvotes: { decrement: 1 } }
        })
      }
      
      currentFeedback = null
    } else {
      // Change feedback (like to dislike or vice versa)
      await context.entities.QuestionFeedback.update({
        where: { id: existingFeedback.id },
        data: { isLike }
      })
      
      // Update question counters
      if (isLike) {
        // Changed from dislike to like
        await context.entities.Question.update({
          where: { id: questionId },
          data: { 
            upvotes: { increment: 1 },
            downvotes: { decrement: 1 }
          }
        })
      } else {
        // Changed from like to dislike
        await context.entities.Question.update({
          where: { id: questionId },
          data: { 
            upvotes: { decrement: 1 },
            downvotes: { increment: 1 }
          }
        })
      }
      
      currentFeedback = isLike
    }
  } else {
    // Create new feedback
    await context.entities.QuestionFeedback.create({
      data: {
        userId,
        questionId,
        isLike
      }
    })
    
    // Update question counters
    if (isLike) {
      await context.entities.Question.update({
        where: { id: questionId },
        data: { upvotes: { increment: 1 } }
      })
    } else {
      await context.entities.Question.update({
        where: { id: questionId },
        data: { downvotes: { increment: 1 } }
      })
    }
    
    currentFeedback = isLike
  }

  return { success: true, currentFeedback }
}

// Increment document view count
export const incrementDocumentViews: IncrementDocumentViews<
  { documentId: number },
  { success: boolean; viewCount: number }
> = async (args, context) => {
  const { documentId } = args

  // Check if document exists
  const document = await context.entities.Document.findUnique({
    where: { id: documentId }
  })

  if (!document) {
    throw new HttpError(404, 'Document not found')
  }

  // Increment view count
  const updatedDocument = await context.entities.Document.update({
    where: { id: documentId },
    data: { viewCount: { increment: 1 } }
  })

  return { success: true, viewCount: updatedDocument.viewCount }
}

// Get document engagement stats
export const getDocumentEngagement: GetDocumentEngagement<
  { documentId: number },
  {
    viewCount: number
    likeCount: number
    commentCount: number
    shareCount: number
    userHasLiked: boolean
  }
> = async (args, context) => {
  const { documentId } = args

  // Get document with engagement stats
  const document = await context.entities.Document.findUnique({
    where: { id: documentId },
    select: {
      viewCount: true,
      likeCount: true,
      commentCount: true,
      shareCount: true
    }
  })

  if (!document) {
    throw new HttpError(404, 'Document not found')
  }

  let userHasLiked = false

  // Check if current user has liked this document
  if (context.user) {
    const userLike = await context.entities.DocumentLike.findUnique({
      where: {
        userId_documentId: {
          userId: context.user.id,
          documentId
        }
      }
    })
    userHasLiked = !!userLike
  }

  return {
    viewCount: document.viewCount,
    likeCount: document.likeCount,
    commentCount: document.commentCount,
    shareCount: document.shareCount,
    userHasLiked
  }
}


