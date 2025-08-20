import React, { useState } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { toggleDocumentLike, toggleQuizLike } from 'wasp/client/operations'
import { useToast } from '../../../hooks/use-toast'
import { cn } from '../../../lib/cn'

interface LikeButtonProps {
  documentId?: number
  quizId?: number
  initialLiked: boolean
  initialCount: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost' | 'outline'
  showCount?: boolean
  className?: string
}

export function LikeButton({
  documentId,
  quizId,
  initialLiked,
  initialCount,
  size = 'md',
  variant = 'ghost',
  showCount = true,
  className
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleToggleLike = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      const result = quizId
        ? await toggleQuizLike({ quizId })
        : await toggleDocumentLike({ documentId: documentId as number })
      setIsLiked(result.isLiked)
      setLikeCount(result.likeCount)
      
      if (result.isLiked) {
        toast({
          title: "Liked!",
          description: "Added to your liked quizzes",
          duration: 2000
        })
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
        duration: 3000
      })
    } finally {
      setIsLoading(false)
    }
  }

  const sizeClasses = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-9 px-3 text-sm',
    lg: 'h-10 px-4 text-base'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5'
  }

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={handleToggleLike}
      disabled={isLoading}
      className={cn(
        sizeClasses[size],
        'gap-1.5 transition-all duration-200',
        isLiked && 'text-red-600 hover:text-red-700',
        className
      )}
    >
      <Heart 
        className={cn(
          iconSizes[size],
          'transition-all duration-200',
          isLiked ? 'fill-current text-red-600' : 'text-muted-foreground'
        )}
      />
      {showCount && (
        <span className={cn(
          'font-medium',
          isLiked ? 'text-red-600' : 'text-muted-foreground'
        )}>
          {likeCount}
        </span>
      )}
    </Button>
  )
}
