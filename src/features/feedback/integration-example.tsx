/**
 * Integration Example: How to add feedback components to existing quiz pages
 * 
 * This file shows examples of how to integrate the feedback system components
 * into existing quiz pages like results, take, and document pages.
 */

import React, { useEffect } from 'react'
import { useQuery } from 'wasp/client/operations'
import { 
  LikeButton, 
  QuestionFeedback, 
  CommentSection, 
  EngagementStats 
} from './components'
import { 
  getDocumentEngagement, 
  incrementDocumentViews 
} from 'wasp/client/operations'

// Example 1: Quiz Results Page Integration
export function QuizResultsWithFeedback({ 
  quizAttemptId, 
  documentId, 
  questions 
}: {
  quizAttemptId: number
  documentId: number
  questions: Array<{ id: number; upvotes: number; downvotes: number }>
}) {
  // Get engagement stats
  const { data: engagement } = useQuery(getDocumentEngagement, { documentId })

  // Track view when component mounts
  useEffect(() => {
    incrementDocumentViews({ documentId }).catch(console.error)
  }, [documentId])

  return (
    <div className="space-y-6">
      {/* Existing quiz results content */}
      <div className="quiz-results-content">
        {/* Your existing results UI */}
      </div>

      {/* Engagement Stats */}
      {engagement && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <EngagementStats
            viewCount={engagement.viewCount}
            likeCount={engagement.likeCount}
            commentCount={engagement.commentCount}
            shareCount={engagement.shareCount}
            layout="horizontal"
            size="md"
            showLabels={true}
          />
          <LikeButton
            documentId={documentId}
            initialLiked={engagement.userHasLiked}
            initialCount={engagement.likeCount}
            size="lg"
          />
        </div>
      )}

      {/* Question Feedback (for each question in review) */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Question Feedback</h3>
        {questions.map((question) => (
          <div key={question.id} className="p-4 border rounded-lg">
            {/* Question content */}
            <div className="question-content mb-3">
              {/* Your existing question display */}
            </div>
            
            {/* Question feedback */}
            <QuestionFeedback
              questionId={question.id}
              initialUpvotes={question.upvotes}
              initialDownvotes={question.downvotes}
              size="md"
            />
          </div>
        ))}
      </div>

      {/* Comments Section */}
      <CommentSection
        documentId={documentId}
        initialCommentCount={engagement?.commentCount || 0}
      />
    </div>
  )
}

// Example 2: Quiz Taking Page Integration (for question feedback)
export function QuizQuestionWithFeedback({ 
  question,
  onAnswer 
}: {
  question: { id: number; upvotes: number; downvotes: number; questionText: string }
  onAnswer: (answerId: number) => void
}) {
  return (
    <div className="space-y-4">
      {/* Question content */}
      <div className="question-display">
        <h2 className="text-xl font-semibold mb-4">{question.questionText}</h2>
        {/* Your existing answer options */}
      </div>

      {/* Question feedback (shown after answering) */}
      <div className="flex justify-between items-center">
        <QuestionFeedback
          questionId={question.id}
          initialUpvotes={question.upvotes}
          initialDownvotes={question.downvotes}
          size="sm"
        />
        <span className="text-sm text-muted-foreground">
          Was this question helpful?
        </span>
      </div>
    </div>
  )
}

// Example 3: Document/Quiz Card Integration (for lists/grids)
export function QuizCardWithEngagement({ 
  document 
}: {
  document: {
    id: number
    title: string
    viewCount: number
    likeCount: number
    commentCount: number
    shareCount: number
  }
}) {
  return (
    <div className="quiz-card border rounded-lg p-4 hover:shadow-lg transition-shadow">
      {/* Card header */}
      <div className="card-header mb-3">
        <h3 className="font-semibold">{document.title}</h3>
      </div>

      {/* Engagement stats */}
      <div className="card-footer flex items-center justify-between">
        <EngagementStats
          viewCount={document.viewCount}
          likeCount={document.likeCount}
          commentCount={document.commentCount}
          shareCount={document.shareCount}
          layout="compact"
          size="sm"
        />
        
        <LikeButton
          documentId={document.id}
          initialLiked={false} // TODO: Get user's like status
          initialCount={document.likeCount}
          size="sm"
          showCount={false}
        />
      </div>
    </div>
  )
}

// Example 4: Integration with existing operations
export async function handleQuizCompletion(quizAttemptId: number, documentId: number) {
  try {
    // Your existing quiz completion logic
    
    // Track engagement
    await incrementDocumentViews({ documentId })
    
    // Optionally show engagement stats in success message
    console.log('Quiz completed! Engagement tracked.')
  } catch (error) {
    console.error('Error completing quiz:', error)
  }
}

/**
 * Integration Notes:
 * 
 * 1. **View Tracking**: Call `incrementDocumentViews` when users start a quiz
 * 2. **Question Feedback**: Add `QuestionFeedback` to question review/results
 * 3. **Like Button**: Add to quiz cards, results pages, and document pages
 * 4. **Comments**: Add to results pages and document detail pages
 * 5. **Engagement Stats**: Show in cards, headers, and summary sections
 * 
 * 6. **Database Updates**: The feedback system automatically updates counters:
 *    - Document.likeCount (via toggleDocumentLike)
 *    - Document.commentCount (via addDocumentComment)
 *    - Document.viewCount (via incrementDocumentViews)
 *    - Question.upvotes/downvotes (via toggleQuestionFeedback)
 * 
 * 7. **User Experience**: 
 *    - Feedback is instant with optimistic updates
 *    - Toast notifications provide feedback
 *    - Loading states prevent double-clicks
 *    - Error handling with user-friendly messages
 */
