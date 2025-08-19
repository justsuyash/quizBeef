import React, { useState } from 'react'
import { UserPlus, UserMinus, Users } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { followUser, unfollowUser } from 'wasp/client/operations'
import { useToast } from '../../../hooks/use-toast'
import { cn } from '../../../lib/cn'

interface FollowButtonProps {
  userId: number
  initialIsFollowing: boolean
  initialFollowersCount: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  showCount?: boolean
  showIcon?: boolean
  className?: string
}

export function FollowButton({
  userId,
  initialIsFollowing,
  initialFollowersCount,
  size = 'md',
  variant = 'default',
  showCount = false,
  showIcon = true,
  className
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [followersCount, setFollowersCount] = useState(initialFollowersCount)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleToggleFollow = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      if (isFollowing) {
        const result = await unfollowUser({ userId })
        setIsFollowing(result.isFollowing)
        setFollowersCount(result.followersCount)
        
        toast({
          title: "Unfollowed",
          description: "You are no longer following this user",
          duration: 2000
        })
      } else {
        const result = await followUser({ userId })
        setIsFollowing(result.isFollowing)
        setFollowersCount(result.followersCount)
        
        toast({
          title: "Following!",
          description: "You are now following this user",
          duration: 2000
        })
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
        duration: 3000
      })
    } finally {
      setIsLoading(false)
    }
  }

  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-10 px-6 text-base'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  const getButtonVariant = () => {
    if (isFollowing) {
      return variant === 'default' ? 'outline' : variant
    }
    return variant
  }

  const getButtonText = () => {
    if (isFollowing) {
      return 'Following'
    }
    return 'Follow'
  }

  const getIcon = () => {
    if (isFollowing) {
      return <UserMinus className={iconSizes[size]} />
    }
    return <UserPlus className={iconSizes[size]} />
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={getButtonVariant()}
        size="sm"
        onClick={handleToggleFollow}
        disabled={isLoading}
        className={cn(
          sizeClasses[size],
          'gap-2 transition-all duration-200',
          isFollowing && 'hover:bg-destructive hover:text-destructive-foreground',
          className
        )}
      >
        {showIcon && getIcon()}
        <span>{isLoading ? 'Loading...' : getButtonText()}</span>
      </Button>
      
      {showCount && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-3 w-3" />
          <span>{followersCount}</span>
        </div>
      )}
    </div>
  )
}
