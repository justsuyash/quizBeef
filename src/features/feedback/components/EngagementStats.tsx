import React from 'react'
import { Eye, Heart, MessageCircle, Share2 } from 'lucide-react'
import { Badge } from '../../../components/ui/badge'
import { cn } from '../../../lib/cn'

interface EngagementStatsProps {
  viewCount: number
  likeCount: number
  commentCount: number
  shareCount: number
  layout?: 'horizontal' | 'vertical' | 'compact'
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
  className?: string
}

export function EngagementStats({
  viewCount,
  likeCount,
  commentCount,
  shareCount,
  layout = 'horizontal',
  size = 'md',
  showLabels = false,
  className
}: EngagementStatsProps) {
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  const sizeClasses = {
    sm: {
      icon: 'h-3 w-3',
      text: 'text-xs',
      gap: 'gap-1',
      spacing: layout === 'horizontal' ? 'gap-3' : 'gap-1'
    },
    md: {
      icon: 'h-4 w-4',
      text: 'text-sm',
      gap: 'gap-1.5',
      spacing: layout === 'horizontal' ? 'gap-4' : 'gap-2'
    },
    lg: {
      icon: 'h-5 w-5',
      text: 'text-base',
      gap: 'gap-2',
      spacing: layout === 'horizontal' ? 'gap-6' : 'gap-3'
    }
  }

  const layoutClasses = {
    horizontal: 'flex items-center',
    vertical: 'flex flex-col',
    compact: 'flex items-center flex-wrap'
  }

  const stats = [
    {
      icon: Eye,
      count: viewCount,
      label: 'Views',
      color: 'text-muted-foreground'
    },
    {
      icon: Heart,
      count: likeCount,
      label: 'Likes',
      color: 'text-red-500'
    },
    {
      icon: MessageCircle,
      count: commentCount,
      label: 'Comments',
      color: 'text-blue-500'
    },
    {
      icon: Share2,
      count: shareCount,
      label: 'Shares',
      color: 'text-green-500'
    }
  ]

  const visibleStats = stats.filter(stat => stat.count > 0 || stat.label === 'Views')

  if (layout === 'compact') {
    return (
      <div className={cn(
        layoutClasses[layout],
        sizeClasses[size].spacing,
        className
      )}>
        {visibleStats.map((stat) => (
          <Badge
            key={stat.label}
            variant="secondary"
            className={cn(
              'flex items-center',
              sizeClasses[size].gap,
              sizeClasses[size].text
            )}
          >
            <stat.icon className={cn(sizeClasses[size].icon, stat.color)} />
            {formatCount(stat.count)}
          </Badge>
        ))}
      </div>
    )
  }

  return (
    <div className={cn(
      layoutClasses[layout],
      sizeClasses[size].spacing,
      className
    )}>
      {visibleStats.map((stat) => (
        <div
          key={stat.label}
          className={cn(
            'flex items-center',
            sizeClasses[size].gap,
            'text-muted-foreground hover:text-foreground transition-colors'
          )}
        >
          <stat.icon className={cn(sizeClasses[size].icon, stat.color)} />
          <span className={cn(
            'font-medium',
            sizeClasses[size].text
          )}>
            {formatCount(stat.count)}
          </span>
          {showLabels && (
            <span className={cn(
              'text-muted-foreground',
              sizeClasses[size].text
            )}>
              {stat.label}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
