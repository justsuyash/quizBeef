import React, { useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { toggleQuestionFeedback } from 'wasp/client/operations'
import { useToast } from '../../../hooks/use-toast'
import { cn } from '../../../lib/cn'

interface QuestionFeedbackProps {
  questionId: number
  initialUpvotes: number
  initialDownvotes: number
  userFeedback?: boolean | null // true = like, false = dislike, null = no feedback
  size?: 'sm' | 'md'
  className?: string
}

export function QuestionFeedback({
  questionId,
  initialUpvotes,
  initialDownvotes,
  userFeedback = null,
  size = 'sm',
  className
}: QuestionFeedbackProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [downvotes, setDownvotes] = useState(initialDownvotes)
  const [currentFeedback, setCurrentFeedback] = useState<boolean | null>(userFeedback)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleFeedback = async (isLike: boolean) => {
    if (isLoading) return

    setIsLoading(true)
    try {
      const result = await toggleQuestionFeedback({ questionId, isLike })
      
      // Update local state based on the change
      if (currentFeedback === isLike) {
        // Removing feedback
        if (isLike) {
          setUpvotes(prev => prev - 1)
        } else {
          setDownvotes(prev => prev - 1)
        }
        setCurrentFeedback(null)
      } else if (currentFeedback === null) {
        // Adding new feedback
        if (isLike) {
          setUpvotes(prev => prev + 1)
        } else {
          setDownvotes(prev => prev + 1)
        }
        setCurrentFeedback(isLike)
      } else {
        // Changing feedback
        if (isLike) {
          setUpvotes(prev => prev + 1)
          setDownvotes(prev => prev - 1)
        } else {
          setUpvotes(prev => prev - 1)
          setDownvotes(prev => prev + 1)
        }
        setCurrentFeedback(isLike)
      }

      // Show subtle feedback
      if (result.currentFeedback === true) {
        toast({
          title: "👍 Helpful question!",
          duration: 1500
        })
      } else if (result.currentFeedback === false) {
        toast({
          title: "👎 Feedback noted",
          duration: 1500
        })
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive",
        duration: 3000
      })
    } finally {
      setIsLoading(false)
    }
  }

  const sizeClasses = {
    sm: 'h-7 px-2 text-xs',
    md: 'h-8 px-3 text-sm'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4'
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleFeedback(true)}
        disabled={isLoading}
        className={cn(
          sizeClasses[size],
          'gap-1 transition-all duration-200',
          currentFeedback === true 
            ? 'text-green-600 bg-green-50 hover:bg-green-100 hover:text-green-700' 
            : 'text-muted-foreground hover:text-green-600 hover:bg-green-50'
        )}
      >
        <ThumbsUp className={cn(
          iconSizes[size],
          currentFeedback === true ? 'fill-current' : ''
        )} />
        <span className="font-medium">{upvotes}</span>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleFeedback(false)}
        disabled={isLoading}
        className={cn(
          sizeClasses[size],
          'gap-1 transition-all duration-200',
          currentFeedback === false 
            ? 'text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700' 
            : 'text-muted-foreground hover:text-red-600 hover:bg-red-50'
        )}
      >
        <ThumbsDown className={cn(
          iconSizes[size],
          currentFeedback === false ? 'fill-current' : ''
        )} />
        <span className="font-medium">{downvotes}</span>
      </Button>
    </div>
  )
}
