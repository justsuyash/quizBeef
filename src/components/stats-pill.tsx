import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'wasp/client/operations'
import { getStatsOverview, getCurrentUser } from 'wasp/client/operations'
import { cn } from '../lib/cn'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { useAuth } from 'wasp/client/auth'

interface StatsPillProps {
  className?: string
}

const StatStack: React.FC<{
  icon: string;
  value: number | string;
  bubbleClasses: string;
  pulse?: boolean;
  layout?: 'inside' | 'right' | 'below';
  className?: string;
}> = ({ icon, value, bubbleClasses, pulse, layout = 'right', className }) => (
  <div
    className={cn(
      layout === 'right' ? 'flex items-center gap-1.5' : 'flex flex-col items-center',
      'justify-center min-w-[44px] sm:min-w-[52px]'
    )}
  >
    <div
      className={cn(
        'h-10 sm:h-11 rounded-full flex items-center justify-center text-base sm:text-lg shadow-sm',
        layout === 'inside' ? 'px-2 sm:px-2.5 w-auto' : 'w-10 sm:w-11',
        bubbleClasses,
        pulse && 'ring-2 ring-offset-1 ring-offset-white ring-black/10',
        className
      )}
    >
      {layout === 'inside' ? (
        <div className="flex items-center gap-1 font-semibold">
          <span aria-hidden>{icon}</span>
          <span className="text-[11px] sm:text-sm tabular-nums">{value}</span>
        </div>
      ) : (
        <span aria-hidden>{icon}</span>
      )}
    </div>
    {layout !== 'inside' && (
      <span className={cn(
        'font-semibold tabular-nums',
        layout === 'right' ? 'text-xs sm:text-sm' : 'mt-1 text-[10px] sm:text-xs'
      )}>
        {value}
      </span>
    )}
  </div>
)

export const StatsPill: React.FC<StatsPillProps> = ({ className }) => {
  const navigate = useNavigate()
  const { data: authUser } = useAuth()
  const { data: currentUser } = useQuery(getCurrentUser)
  const [previousStats, setPreviousStats] = useState<any>(null)
  const [pulseFlags, setPulseFlags] = useState({
    streak: false,
    elo: false,
    medals: false,
    assassins: false
  })

  const { data: stats, isLoading, error } = useQuery(getStatsOverview, { range: 30 })

  // SSE subscription for real-time updates
  useEffect(() => {
    const es = new EventSource('/api/stats-events')
    es.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data || '{}')
        if (!payload) return
        // For now, on any stats-related event, trigger a soft pulse and refetch
        setPulseFlags((prev) => ({ ...prev, streak: true, elo: true, medals: true }))
        // Let react-query refetch via window focus or we could manually invalidate; simple approach: close & reopen triggers
        setTimeout(() => setPulseFlags({ streak: false, elo: false, medals: false, assassins: false }), 600)
      } catch {}
    }
    es.onerror = () => {
      es.close()
    }
    return () => {
      es.close()
    }
  }, [])

  // Micro-animations when values change
  useEffect(() => {
    if (stats && previousStats) {
      const newPulseFlags = {
        streak: stats.streak !== previousStats.streak,
        elo: false, // TODO: Compare elo when implemented
        medals: stats.medalsCount !== previousStats.medalsCount,
        assassins: stats.assassinsCount !== previousStats.assassinsCount
      }

      setPulseFlags(newPulseFlags)

      // Reset pulse flags after animation
      const timeout = setTimeout(() => {
        setPulseFlags({ streak: false, elo: false, medals: false, assassins: false })
      }, 600)

      return () => clearTimeout(timeout)
    }

    if (stats) {
      setPreviousStats(stats)
    }
  }, [stats, previousStats])

  const handleClick = () => {
    navigate('/analytics')
  }

  if (isLoading) {
    return (
      <div className={cn(
        'flex items-center space-x-2 bg-white border border-gray-200 rounded-full px-2 sm:px-3 py-1.5 sm:py-2 shadow-sm',
        className
      )}>
        <div className="flex items-center space-x-2">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gray-200 animate-pulse" />
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gray-200 animate-pulse" />
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gray-200 animate-pulse" />
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gray-200 animate-pulse" />
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gray-200 animate-pulse" />
        </div>
      </div>
    )
  }

  if (error) {
    return null // Gracefully hide if there's an error
  }

  if (!stats) {
    return null
  }

  // Placeholder for Elo; values not shown in icon-only pill

  // Placeholder current Elo until wired
  const currentElo = 1200

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-center bg-white/90 backdrop-blur border border-black/10 rounded-full px-2.5 sm:px-3.5 py-1.5 sm:py-2 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer',
        'space-x-2 sm:space-x-3',
        className
      )}
    >
      {/* Left metrics with numbers below */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <StatStack icon="🔥" value={stats.streak || 0} bubbleClasses={stats.streak > 0 ? 'bg-orange-100' : 'bg-gray-100'} pulse={pulseFlags.streak} layout="inside" />
        <StatStack icon="♟" value={currentElo} bubbleClasses="bg-blue-100" pulse={pulseFlags.elo} layout="inside" className="px-3 sm:px-3.5" />
        <StatStack icon="🏅" value={stats.medalsCount || 0} bubbleClasses={stats.medalsCount > 0 ? 'bg-yellow-100' : 'bg-gray-100'} pulse={pulseFlags.medals} layout="inside" />
        <StatStack icon="🥷" value={stats.assassinsCount || 0} bubbleClasses={stats.assassinsCount > 0 ? 'bg-red-100' : 'bg-gray-100'} pulse={pulseFlags.assassins} layout="inside" />
      </div>

      {/* Avatar on the right - largest pill */}
      <div className="flex items-center justify-center">
        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gray-100 border border-black/10 flex items-center justify-center shadow-sm">
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border border-black/10">
            <AvatarImage src={currentUser?.avatarUrl || undefined} alt="Profile" />
            <AvatarFallback>
              {(currentUser?.handle || currentUser?.username || 'U').toString().slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  )
}
