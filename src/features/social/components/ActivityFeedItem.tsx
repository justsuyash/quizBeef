import React from 'react'
import { 
  Trophy, 
  BookOpen, 
  Zap, 
  Target, 
  Sword, 
  UserPlus, 
  Heart, 
  Flame,
  Clock
} from 'lucide-react'
import { Card, CardContent } from '../../../components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { Badge } from '../../../components/ui/badge'
import { cn } from '../../../lib/cn'

interface ActivityFeedItemProps {
  activity: {
    id: number
    type: string
    createdAt: string
    data: any
    user: {
      id: number
      name?: string | null
      avatarUrl?: string | null
    }
    document?: {
      id: number
      title: string
    } | null
    quizAttempt?: {
      id: number
      score: number
      totalQuestions: number
    } | null
  }
  className?: string
}

export function ActivityFeedItem({ activity, className }: ActivityFeedItemProps) {
  const displayName = activity.user.name || 'Anonymous User'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase()

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date()
    const activityDate = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`
    return activityDate.toLocaleDateString()
  }

  const getActivityIcon = () => {
    switch (activity.type) {
      case 'QUIZ_COMPLETED':
        return <Zap className="h-4 w-4 text-blue-500" />
      case 'QUIZ_HIGH_SCORE':
        return <Trophy className="h-4 w-4 text-yellow-500" />
      case 'DOCUMENT_UPLOADED':
        return <BookOpen className="h-4 w-4 text-green-500" />
      case 'ACHIEVEMENT_EARNED':
        return <Trophy className="h-4 w-4 text-purple-500" />
      case 'BEEF_WON':
        return <Sword className="h-4 w-4 text-red-500" />
      case 'BEEF_CHALLENGE_CREATED':
        return <Target className="h-4 w-4 text-orange-500" />
      case 'FOLLOW_USER':
        return <UserPlus className="h-4 w-4 text-indigo-500" />
      case 'DOCUMENT_LIKED':
        return <Heart className="h-4 w-4 text-pink-500" />
      case 'STREAK_MILESTONE':
        return <Flame className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getActivityText = () => {
    const data = activity.data || {}
    
    switch (activity.type) {
      case 'QUIZ_COMPLETED':
        const score = activity.quizAttempt?.score || data.score || 0
        const total = activity.quizAttempt?.totalQuestions || data.totalQuestions || 0
        const percentage = total > 0 ? Math.round((score / total) * 100) : 0
        return (
          <span>
            completed a quiz on <strong>{activity.document?.title || 'Unknown Quiz'}</strong>
            {percentage > 0 && (
              <Badge variant="secondary" className="ml-2">
                {percentage}% ({score}/{total})
              </Badge>
            )}
          </span>
        )
      
      case 'QUIZ_HIGH_SCORE':
        return (
          <span>
            achieved a high score on <strong>{activity.document?.title || 'a quiz'}</strong>
            {data.score && (
              <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">
                {data.score}% 🏆
              </Badge>
            )}
          </span>
        )
      
      case 'DOCUMENT_UPLOADED':
        return (
          <span>
            uploaded a new document: <strong>{activity.document?.title || data.documentTitle}</strong>
          </span>
        )
      
      case 'ACHIEVEMENT_EARNED':
        return (
          <span>
            earned the achievement <strong>{data.achievementName}</strong>
            {data.achievementRarity && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "ml-2",
                  data.achievementRarity === 'LEGENDARY' && "bg-purple-100 text-purple-800",
                  data.achievementRarity === 'EPIC' && "bg-orange-100 text-orange-800",
                  data.achievementRarity === 'RARE' && "bg-blue-100 text-blue-800"
                )}
              >
                {data.achievementRarity}
              </Badge>
            )}
          </span>
        )
      
      case 'BEEF_WON':
        return (
          <span>
            won a beef challenge against <strong>{data.opponentName || 'an opponent'}</strong>
            {data.score && (
              <Badge variant="secondary" className="ml-2 bg-red-100 text-red-800">
                Victory! 🔥
              </Badge>
            )}
          </span>
        )
      
      case 'BEEF_CHALLENGE_CREATED':
        return (
          <span>
            created a beef challenge on <strong>{activity.document?.title || data.documentTitle}</strong>
          </span>
        )
      
      case 'FOLLOW_USER':
        return (
          <span>
            started following <strong>{data.followedUserName || 'someone'}</strong>
          </span>
        )
      
      case 'DOCUMENT_LIKED':
        return (
          <span>
            liked <strong>{activity.document?.title || data.documentTitle}</strong>
          </span>
        )
      
      case 'STREAK_MILESTONE':
        return (
          <span>
            reached a <strong>{data.streakDays || data.streak} day streak</strong>!
            <Badge variant="secondary" className="ml-2 bg-red-100 text-red-800">
              🔥 {data.streakDays || data.streak} days
            </Badge>
          </span>
        )
      
      default:
        return <span>had some activity</span>
    }
  }

  return (
    <Card className={cn('hover:shadow-sm transition-shadow duration-200', className)}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* User Avatar */}
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={activity.user.avatarUrl || undefined} />
            <AvatarFallback className="text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          {/* Activity Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              {/* Activity Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon()}
              </div>
              
              {/* Activity Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed">
                  <strong className="font-medium">{displayName}</strong>{' '}
                  {getActivityText()}
                </p>
                
                {/* Timestamp */}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTimeAgo(activity.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
