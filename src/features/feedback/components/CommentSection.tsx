import React, { useState } from 'react'
import { MessageCircle, Send, User } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Textarea } from '../../../components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { Separator } from '../../../components/ui/separator'
import { Badge } from '../../../components/ui/badge'
import { useQuery } from 'wasp/client/operations'
import { addDocumentComment, getDocumentComments, addQuizComment, getQuizComments } from 'wasp/client/operations'
import { useToast } from '../../../hooks/use-toast'
import { cn } from '../../../lib/cn'

interface CommentSectionProps {
  documentId?: number
  quizId?: number
  initialCommentCount: number
  className?: string
}

export function CommentSection({ 
  documentId,
  quizId, 
  initialCommentCount,
  className 
}: CommentSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const {
    data: docComments,
    isLoading: isLoadingDocComments,
    refetch: refetchDocComments,
  } = useQuery(
    getDocumentComments,
    { documentId: (documentId as number), limit: 10, offset: 0 },
    { enabled: !!documentId && isExpanded }
  )

  const {
    data: quizComments,
    isLoading: isLoadingQuizComments,
    refetch: refetchQuizComments,
  } = useQuery(
    getQuizComments,
    { quizId: (quizId as number), limit: 10, offset: 0 },
    { enabled: !!quizId && isExpanded }
  )

  const commentsData = quizId ? quizComments : docComments
  const isLoadingComments = quizId ? isLoadingQuizComments : isLoadingDocComments
  const refetchComments = quizId ? refetchQuizComments : refetchDocComments

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      if (quizId) {
        await addQuizComment({ quizId, content: newComment.trim() })
      } else {
        await addDocumentComment({ documentId: documentId as number, content: newComment.trim() })
      }
      
      setNewComment('')
      await refetchComments()
      
      toast({
        title: "Comment added!",
        description: "Your comment has been posted",
        duration: 2000
      })
    } catch (error) {
      console.error('Error adding comment:', error)
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
        duration: 3000
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmitComment()
    }
  }

  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const commentDate = new Date(date)
    const diffInMinutes = Math.floor((now.getTime() - commentDate.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`
    return commentDate.toLocaleDateString()
  }

  const commentCount = commentsData?.total ?? initialCommentCount

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="h-5 w-5 text-muted-foreground" />
            Comments
            <Badge variant="secondary" className="ml-1">
              {commentCount}
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? 'Hide' : 'Show'} Comments
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {/* Add Comment Form */}
          <div className="space-y-3 mb-4">
            <Textarea
              placeholder="Share your thoughts about this quiz... (Ctrl+Enter to submit)"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[80px] resize-none"
              maxLength={1000}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {newComment.length}/1000 characters
              </span>
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
                size="sm"
                className="gap-2"
              >
                <Send className="h-3 w-3" />
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Comments List */}
          {isLoadingComments ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="h-8 w-8 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : commentsData?.comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {commentsData?.comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.user.avatarUrl || undefined} />
                    <AvatarFallback>
                      {comment.user.name ? (
                        comment.user.name.charAt(0).toUpperCase()
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {comment.user.name || 'Anonymous User'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(comment.createdAt.toString())}
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
              
              {commentsData && commentsData.total > commentsData.comments.length && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-4 text-muted-foreground"
                  onClick={() => {
                    // TODO: Implement load more functionality
                    toast({
                      title: "Load More",
                      description: "Load more functionality coming soon!",
                      duration: 2000
                    })
                  }}
                >
                  Load {Math.min(10, commentsData.total - commentsData.comments.length)} more comments
                </Button>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
