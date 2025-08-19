import React from 'react'
import { User, Trophy, BookOpen, Zap } from 'lucide-react'
import { Card, CardContent } from '../../../components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { Badge } from '../../../components/ui/badge'
import { FollowButton } from './FollowButton'
import { cn } from '../../../lib/cn'

interface UserCardProps {
  user: {
    id: number
    name?: string | null
    avatarUrl?: string | null
    followersCount: number
    isFollowing: boolean
    mutualFollowsCount?: number
    recentActivity?: {
      quizzesCompleted: number
      documentsUploaded: number
    }
  }
  layout?: 'horizontal' | 'vertical'
  showActivity?: boolean
  showMutualFollows?: boolean
  className?: string
  onClick?: () => void
}

export function UserCard({
  user,
  layout = 'horizontal',
  showActivity = true,
  showMutualFollows = true,
  className,
  onClick
}: UserCardProps) {
  const displayName = user.name || 'Anonymous User'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase()

  const cardContent = (
    <>
      {/* User Info */}
      <div className={cn(
        'flex gap-3',
        layout === 'vertical' ? 'flex-col items-center text-center' : 'items-center'
      )}>
        <Avatar className={layout === 'vertical' ? 'h-16 w-16' : 'h-12 w-12'}>
          <AvatarImage src={user.avatarUrl || undefined} />
          <AvatarFallback>
            {user.avatarUrl ? initials : <User className="h-6 w-6" />}
          </AvatarFallback>
        </Avatar>
        
        <div className={cn(
          'flex-1 min-w-0',
          layout === 'vertical' && 'text-center'
        )}>
          <h3 className="font-semibold text-sm truncate">{displayName}</h3>
          
          {/* Followers Count */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <span>{user.followersCount} followers</span>
            {showMutualFollows && user.mutualFollowsCount && user.mutualFollowsCount > 0 && (
              <>
                <span>•</span>
                <span>{user.mutualFollowsCount} mutual</span>
              </>
            )}
          </div>
        </div>
        
        {layout === 'horizontal' && (
          <FollowButton
            userId={user.id}
            initialIsFollowing={user.isFollowing}
            initialFollowersCount={user.followersCount}
            size="sm"
            showCount={false}
          />
        )}
      </div>

      {/* Activity Stats */}
      {showActivity && user.recentActivity && (
        <div className={cn(
          'flex gap-4 text-xs',
          layout === 'vertical' ? 'justify-center mt-3' : 'mt-2'
        )}>
          {user.recentActivity.quizzesCompleted > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Zap className="h-3 w-3 text-blue-500" />
              <span>{user.recentActivity.quizzesCompleted} quizzes</span>
            </div>
          )}
          {user.recentActivity.documentsUploaded > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <BookOpen className="h-3 w-3 text-green-500" />
              <span>{user.recentActivity.documentsUploaded} documents</span>
            </div>
          )}
        </div>
      )}

      {/* Follow Button for Vertical Layout */}
      {layout === 'vertical' && (
        <div className="mt-4 w-full">
          <FollowButton
            userId={user.id}
            initialIsFollowing={user.isFollowing}
            initialFollowersCount={user.followersCount}
            size="sm"
            variant="outline"
            showCount={false}
            className="w-full"
          />
        </div>
      )}
    </>
  )

  if (onClick) {
    return (
      <Card 
        className={cn(
          'cursor-pointer hover:shadow-md transition-shadow duration-200',
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          {cardContent}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        {cardContent}
      </CardContent>
    </Card>
  )
}
